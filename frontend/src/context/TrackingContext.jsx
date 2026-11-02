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

export function TrackingProvider({ children }) {
  const { currentUser } = useAuth();
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
  const [mapStyle, setMapStyle] = useState('satellite');

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
      const users = await api.getActiveUsers();
      setAllUsers(users);
    } catch (e) {
      console.warn("Could not fetch active users:", e);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

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
          }
        });
        refreshUsers();
      }
    }

    socket.on('user_location_update', onLocationUpdate);
    socket.on('user_sharing_toggled', onSharingToggled);
    socket.on('group_member_joined', onMemberJoinedGroup);

    return () => {
      socket.off('user_location_update', onLocationUpdate);
      socket.off('user_sharing_toggled', onSharingToggled);
      socket.off('group_member_joined', onMemberJoinedGroup);
    };
  }, [currentGroup]);

  // Request & Watch Geolocation
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
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
        }
      },
      (error) => {
        console.warn("Geolocation permission note:", error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
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
        }
      },
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

  // Group Methods
  const createGroup = async (name, customId, options = {}) => {
    if (!currentUser) throw new Error("Please login to create a group");
    const group = await api.createGroup(name, customId, options);
    setCurrentGroup(group);
    localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(group));
    socket.emit('join_group', { groupId: group.groupId, user: currentUser });
    return group;
  };

  const joinGroup = async (groupId) => {
    if (!currentUser) throw new Error("Please login to join a group");
    const group = await api.joinGroup(groupId);
    setCurrentGroup(group);
    localStorage.setItem('MAP_TRACKING_CURRENT_GROUP', JSON.stringify(group));
    socket.emit('join_group', { groupId: group.groupId, user: currentUser });
    refreshUsers();
    return group;
  };

  const leaveGroup = async () => {
    if (currentGroup && currentUser) {
      await api.leaveGroup(currentGroup.groupId);
      socket.emit('leave_group', { groupId: currentGroup.groupId, uid: currentUser.uid });
      setCurrentGroup(null);
      localStorage.removeItem('MAP_TRACKING_CURRENT_GROUP');
    }
  };

  // Connected users:
  // If in a group, only show members of that group!
  // If not in a group, show other active users who are sharing!
  const filteredUsers = currentGroup
    ? allUsers.filter(u => currentGroup.members && currentGroup.members[u.uid])
    : allUsers;

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
    createGroup,
    joinGroup,
    leaveGroup,
    mapStyle,
    setMapStyle
  };

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) throw new Error("useTracking must be used within a TrackingProvider");
  return context;
}
