import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { calculateDistanceKm } from '../utils/geoUtils';

const TrackingContext = createContext(null);

const DEFAULT_COORDS = {
  lat: 11.5564,
  lng: 104.9282,
  accuracy: 10,
  speed: 0,
  heading: 0,
  altitude: 10,
  timestamp: Date.now()
};

// Calculate total distance traveled in kilometers from an array of trail points
export function calculateTrailDistanceKm(trailPoints = []) {
  if (!trailPoints || trailPoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < trailPoints.length - 1; i++) {
    const p1 = trailPoints[i];
    const p2 = trailPoints[i + 1];
    if (p1?.lat && p2?.lat) {
      total += calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
    }
  }
  return total;
}

export function TrackingProvider({ children }) {
  const { currentUser, isAdmin } = useAuth();
  const [myLocation, setMyLocation] = useState(DEFAULT_COORDS);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isSharing, setIsSharing] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('MAP_TRACKING_CURRENT_GROUP');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  // Multi-group state: Array of all groups user has joined
  const [userGroups, setUserGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('MAP_TRACKING_USER_GROUPS');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [mapStyle, setMapStyle] = useState('satellite');

  // Movement Trails / Breadcrumbs State
  const [groupTrails, setGroupTrails] = useState(() => {
    try {
      const savedGroup = localStorage.getItem('MAP_TRACKING_CURRENT_GROUP');
      if (savedGroup) {
        const parsed = JSON.parse(savedGroup);
        const savedTrails = localStorage.getItem(`MAP_TRACKING_TRAILS_${parsed.groupId}`);
        return savedTrails ? JSON.parse(savedTrails) : {};
      }
    } catch (e) {}
    return {};
  });
  const [showTrails, setShowTrails] = useState(true);
  const [focusedTrailUid, setFocusedTrailUid] = useState(null);

  const watchIdRef = useRef(null);

  // Check URL query parameters for group ID (?group=GP-1234)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupParam = params.get('group');
    if (groupParam && currentUser) {
      joinGroup(groupParam);
    }
  }, [currentUser]);

  // Fetch initial active users from Backend API
  const refreshUsers = async () => {
    try {
      const users = await api.getActiveUsers(currentGroup?.groupId);
      setAllUsers(users);
    } catch (e) {
      console.warn("Could not fetch active users:", e);
    }
  };

  useEffect(() => {
    refreshUsers();
    if (isAdmin) {
      socket.emit('join_admin_feed');
    }
  }, [currentGroup?.groupId, isAdmin]);

  // Sync historical trails when currentGroup changes
  useEffect(() => {
    if (!currentGroup?.groupId) {
      setGroupTrails({});
      setFocusedTrailUid(null);
      return;
    }

    const cleanGroupId = currentGroup.groupId.toUpperCase().trim();

    // 1. Load from localStorage cache
    try {
      const cached = localStorage.getItem(`MAP_TRACKING_TRAILS_${cleanGroupId}`);
      if (cached) {
        setGroupTrails(JSON.parse(cached));
      }
    } catch (e) {}

    // 2. Fetch fresh trails from backend
    api.getGroupTrails(cleanGroupId).then((serverTrails) => {
      if (serverTrails && Object.keys(serverTrails).length > 0) {
        setGroupTrails((prev) => {
          const merged = { ...prev, ...serverTrails };
          try {
            localStorage.setItem(`MAP_TRACKING_TRAILS_${cleanGroupId}`, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    });

    // 3. Request fresh sync via WebSocket
    socket.emit('get_group_trails', { groupId: cleanGroupId });
  }, [currentGroup?.groupId]);

  // WebSocket listeners
  useEffect(() => {
    function onLocationUpdate(data) {
      setAllUsers((prevUsers) => {
        const idx = prevUsers.findIndex(u => u.uid === data.uid);
        if (idx >= 0) {
          const updated = [...prevUsers];
          updated[idx] = {
            ...updated[idx],
            location: data.location,
            isSharing: data.isSharing,
            groupId: data.groupId
          };
          return updated;
        } else {
          refreshUsers();
          return prevUsers;
        }
      });
    }

    function onSharingToggled(data) {
      setAllUsers((prevUsers) => {
        return prevUsers.map(u => {
          if (u.uid === data.uid) {
            return { ...u, isSharing: data.isSharing };
          }
          return u;
        });
      });
    }

    function onMemberJoinedGroup(data) {
      if (currentGroup && data.groupId === currentGroup.groupId) {
        // Refresh group data
        api.getGroup(currentGroup.groupId).then(g => {
          if (g) {
            setCurrentGroup(g);
            localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(g));
            if (g.trails) {
              setGroupTrails(g.trails);
            }
          }
        });
        refreshUsers();
      }
    }

    // Historical movement trails sync from socket
    function onGroupTrailsSync(data) {
      if (!currentGroup || data.groupId !== currentGroup.groupId) return;
      if (data.trails) {
        setGroupTrails((prev) => {
          const merged = { ...prev, ...data.trails };
          try {
            localStorage.setItem(`MAP_TRACKING_TRAILS_${currentGroup.groupId}`, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    }

    // Live movement breadcrumb point from socket
    function onGroupTrailPoint(data) {
      if (!currentGroup || data.groupId !== currentGroup.groupId) return;
      if (data.uid && data.point) {
        setGroupTrails((prev) => {
          const userPts = prev[data.uid] ? [...prev[data.uid]] : [];
          if (userPts.length > 0 && userPts[userPts.length - 1].timestamp === data.point.timestamp) {
            return prev;
          }
          if (userPts.length >= 600) userPts.shift();
          userPts.push(data.point);
          const updated = {
            ...prev,
            [data.uid]: userPts
          };
          try {
            localStorage.setItem(`MAP_TRACKING_TRAILS_${currentGroup.groupId}`, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    }

    // Member kicked / removed from group
    function onGroupMemberRemoved(data) {
      if (!data?.groupId) return;
      if (data.memberUid === currentUser?.uid) {
        setUserGroups(prev => {
          const remaining = prev.filter(g => g.groupId !== data.groupId);
          try {
            localStorage.setItem('MAP_TRACKING_USER_GROUPS', JSON.stringify(remaining));
          } catch (e) {}
          return remaining;
        });
        setCurrentGroup(prev => {
          if (prev?.groupId === data.groupId) {
            try {
              localStorage.removeItem('MAP_TRACKING_CURRENT_GROUP');
            } catch (e) {}
            return null;
          }
          return prev;
        });
        setGroupTrails({});
        alert(`អ្នកត្រូវបានដកចេញពីបន្ទប់ ${data.groupId} (You were removed from ${data.groupId})`);
      } else {
        // Someone else was removed: update member list
        api.getGroup(data.groupId).then(fresh => {
          if (fresh) {
            setCurrentGroup(prev => prev?.groupId === data.groupId ? fresh : prev);
            setUserGroups(prev => prev.map(g => g.groupId === data.groupId ? fresh : g));
          }
        }).catch(() => {});
      }
      refreshUsers();
    }

    socket.on('user_location_update', onLocationUpdate);
    socket.on('group_location_update', onLocationUpdate);
    socket.on('user_sharing_toggled', onSharingToggled);
    socket.on('group_member_joined', onMemberJoinedGroup);
    socket.on('group_member_removed', onGroupMemberRemoved);
    socket.on('group_trails_sync', onGroupTrailsSync);
    socket.on('group_trail_point', onGroupTrailPoint);

    return () => {
      socket.off('user_location_update', onLocationUpdate);
      socket.off('group_location_update', onLocationUpdate);
      socket.off('user_sharing_toggled', onSharingToggled);
      socket.off('group_member_joined', onMemberJoinedGroup);
      socket.off('group_member_removed', onGroupMemberRemoved);
      socket.off('group_trails_sync', onGroupTrailsSync);
      socket.off('group_trail_point', onGroupTrailPoint);
    };
  }, [currentGroup]);

  // Request & Watch Geolocation
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser");
      return;
    }

    const handleNewLocation = (position) => {
      const newLoc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy || 10),
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
        altitude: position.coords.altitude || 10,
        timestamp: Date.now()
      };
      setMyLocation(newLoc);
      setHasLocationPermission(true);

      if (currentUser && isSharing) {
        api.updateLocation(newLoc, true);
        socket.emit('send_location', {
          uid: currentUser.uid,
          location: newLoc,
          isSharing: true,
          groupId: currentGroup?.groupId
        });

        // Locally append user's own point to trail for instant zero-lag feedback
        if (currentGroup?.groupId) {
          const myPoint = {
            lat: newLoc.lat,
            lng: newLoc.lng,
            speed: newLoc.speed || 0,
            heading: newLoc.heading || 0,
            altitude: newLoc.altitude || 0,
            timestamp: newLoc.timestamp
          };
          setGroupTrails((prev) => {
            const myPts = prev[currentUser.uid] ? [...prev[currentUser.uid]] : [];
            if (myPts.length > 0) {
              const last = myPts[myPts.length - 1];
              const dLat = Math.abs(last.lat - myPoint.lat);
              const dLng = Math.abs(last.lng - myPoint.lng);
              if (dLat < 0.00004 && dLng < 0.00004) return prev;
            }
            if (myPts.length >= 600) myPts.shift();
            myPts.push(myPoint);
            const updated = {
              ...prev,
              [currentUser.uid]: myPts
            };
            try {
              localStorage.setItem(`MAP_TRACKING_TRAILS_${currentGroup.groupId}`, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
    };

    navigator.geolocation.getCurrentPosition(
      handleNewLocation,
      (error) => console.warn("Geolocation permission note:", error.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleNewLocation,
      (err) => console.warn("Watch position note:", err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );
  };

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [currentUser, isSharing, currentGroup]);

  // Toggle sharing on / off
  const toggleSharing = async (newState) => {
    const val = typeof newState === 'boolean' ? newState : !isSharing;
    setIsSharing(val);
    if (currentUser) {
      await api.toggleSharing(val);
      socket.emit('toggle_sharing', { uid: currentUser.uid, isSharing: val });
      if (val && myLocation) {
        await api.updateLocation(myLocation, true);
        socket.emit('send_location', { 
          uid: currentUser.uid, 
          location: myLocation, 
          isSharing: true,
          groupId: currentGroup?.groupId 
        });
      }
    }
  };

  // Load all groups user belongs to from backend
  const refreshUserGroups = async () => {
    if (!currentUser?.uid) {
      setUserGroups([]);
      return;
    }
    try {
      const groups = await api.getMyGroups();
      if (Array.isArray(groups)) {
        setUserGroups(groups);
        try {
          localStorage.setItem('MAP_TRACKING_USER_GROUPS', JSON.stringify(groups));
        } catch (e) {}

        // Ensure currentGroup is synchronized with fresh server data
        if (groups.length > 0) {
          setCurrentGroup(prev => {
            if (!prev) {
              try {
                localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(groups[0]));
              } catch (e) {}
              return groups[0];
            }
            const fresh = groups.find(g => g.groupId === prev.groupId);
            if (fresh) {
              try {
                localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(fresh));
              } catch (e) {}
              return fresh;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.warn("Could not fetch my groups:", e);
    }
  };

  useEffect(() => {
    refreshUserGroups();
  }, [currentUser?.uid]);

  // Switch Active Group to view on Map
  const switchActiveGroup = (groupId) => {
    const target = userGroups.find(g => g.groupId === groupId);
    if (target) {
      setCurrentGroup(target);
      try {
        localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(target));
      } catch (e) {}
      socket.emit('join_group', { groupId: target.groupId, user: currentUser });
      refreshUsers();
    }
  };

  // Group Methods (Multi-Group support)
  const createGroup = async (name, customId, options = {}) => {
    if (!currentUser) throw new Error("Please login to create a group");
    const res = await api.createGroup(name, customId, options);
    const group = res.group || res;
    setCurrentGroup(group);
    setUserGroups(prev => {
      const filtered = prev.filter(g => g.groupId !== group.groupId);
      const updated = [group, ...filtered];
      try {
        localStorage.setItem('MAP_TRACKING_USER_GROUPS', JSON.stringify(updated));
        localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(group));
      } catch (e) {}
      return updated;
    });
    socket.emit('join_group', { groupId: group.groupId, user: currentUser });
    refreshUsers();
    return group;
  };

  const joinGroup = async (groupId) => {
    if (!currentUser) throw new Error("Please login to join a group");
    const res = await api.joinGroup(groupId);
    const group = res.group || res;
    setCurrentGroup(group);
    setUserGroups(prev => {
      const filtered = prev.filter(g => g.groupId !== group.groupId);
      const updated = [group, ...filtered];
      try {
        localStorage.setItem('MAP_TRACKING_USER_GROUPS', JSON.stringify(updated));
        localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(group));
      } catch (e) {}
      return updated;
    });
    socket.emit('join_group', { groupId: group.groupId, user: currentUser });
    refreshUsers();
    return group;
  };

  const leaveGroup = async (groupIdToLeave) => {
    const targetId = groupIdToLeave || currentGroup?.groupId;
    if (!targetId || !currentUser) return;

    try {
      await api.leaveGroup(targetId);
      socket.emit('leave_group', { groupId: targetId, uid: currentUser.uid });

      setUserGroups(prev => {
        const remaining = prev.filter(g => g.groupId !== targetId);
        try {
          localStorage.setItem('MAP_TRACKING_USER_GROUPS', JSON.stringify(remaining));
        } catch (e) {}

        if (currentGroup?.groupId === targetId) {
          const nextActive = remaining.length > 0 ? remaining[0] : null;
          setCurrentGroup(nextActive);
          try {
            if (nextActive) {
              localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(nextActive));
            } else {
              localStorage.removeItem('MAP_TRACKING_CURRENT_GROUP');
            }
          } catch (e) {}
        }
        return remaining;
      });

      setGroupTrails({});
      setFocusedTrailUid(null);
      refreshUsers();
    } catch (e) {
      console.warn("Error leaving group:", e);
    }
  };

  // Group Owner / Admin kicks a member from a group
  const removeMember = async (groupId, memberUid) => {
    if (!groupId || !memberUid) return;
    try {
      await api.removeGroupMember(groupId, memberUid);
      socket.emit('remove_group_member', {
        groupId,
        memberUid,
        requesterUid: currentUser?.uid,
        requesterRole: currentUser?.role
      });
      // Refresh group details
      const fresh = await api.getGroup(groupId);
      if (fresh) {
        setCurrentGroup(prev => prev?.groupId === groupId ? fresh : prev);
        setUserGroups(prev => prev.map(g => g.groupId === groupId ? fresh : g));
      }
      refreshUsers();
    } catch (err) {
      throw err;
    }
  };

  // Strict Visibility Rules:
  // 1. Admin: Has God-view access to see all users actively sharing on the map.
  // 2. Regular User in Group/Duo: Can ONLY see members of that same group who have an account and have isSharing=true!
  // 3. Regular User NOT in a group: Cannot see any other users (stranger privacy protection).
  let filteredUsers = [];
  if (isAdmin) {
    filteredUsers = allUsers;
  } else if (currentUser && currentGroup?.members) {
    filteredUsers = allUsers.filter(u => 
      u.uid !== currentUser.uid &&
      currentGroup.members[u.uid] &&
      Boolean(u.isSharing)
    );
  } else {
    filteredUsers = [];
  }

  const otherActiveUsers = filteredUsers
    .filter(u => u.uid !== currentUser?.uid && u.isSharing && u.location?.lat)
    .map(u => ({
      ...u,
      distanceKm: calculateDistanceKm(
        myLocation.lat,
        myLocation.lng,
        u.location.lat,
        u.location.lng
      )
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const value = {
    myLocation,
    setMyLocation,
    hasLocationPermission,
    requestLocationPermission,
    isSharing,
    toggleSharing,
    allUsers,
    refreshUsers,
    otherActiveUsers,
    currentGroup,
    userGroups,
    switchActiveGroup,
    removeMember,
    refreshUserGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    mapStyle,
    setMapStyle,
    // Movement Trails Exports
    groupTrails,
    showTrails,
    setShowTrails,
    focusedTrailUid,
    setFocusedTrailUid
  };

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) throw new Error("useTracking must be used within a TrackingProvider");
  return context;
}
