import { 
  db, 
  isConfigured, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc, 
  onSnapshot, 
  query, 
  where 
} from '../config/firebase';

// Recursively sanitize objects for Firestore
function sanitizeData(val) {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(item => sanitizeData(item)).filter(item => item !== undefined);
  }
  const clean = {};
  for (const [key, value] of Object.entries(val)) {
    if (key !== 'undefined' && key !== '' && value !== undefined) {
      clean[key] = sanitizeData(value);
    }
  }
  return clean;
}

// Helper: purge legacy demo data if present in localStorage
function cleanLegacyFakeData() {
  try {
    const raw = localStorage.getItem('MAP_TRACKING_LOCAL_USERS');
    if (raw) {
      const users = JSON.parse(raw);
      // Filter out any hardcoded demo users from previous version
      const cleaned = users.filter(u => 
        !u.uid?.startsWith('user_demo_') && 
        !u.uid?.startsWith('admin_demo_') &&
        u.email !== 'admin@maptracking.com' &&
        u.email !== 'sophea.tech@gmail.com' &&
        u.email !== 'dara.khmer@gmail.com' &&
        u.email !== 'bopha.smart@gmail.com'
      );
      localStorage.setItem('MAP_TRACKING_LOCAL_USERS', JSON.stringify(cleaned));
    }
  } catch (e) {
    console.error("Error cleaning legacy fake data:", e);
  }
}

cleanLegacyFakeData();

// Local store for real users
function getLocalUsers() {
  try {
    const raw = localStorage.getItem('MAP_TRACKING_LOCAL_USERS');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem('MAP_TRACKING_LOCAL_USERS', JSON.stringify(users));
  } catch (e) {}
}

function getLocalRooms() {
  try {
    const raw = localStorage.getItem('MAP_TRACKING_LOCAL_ROOMS');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveLocalRooms(rooms) {
  try {
    localStorage.setItem('MAP_TRACKING_LOCAL_ROOMS', JSON.stringify(rooms));
  } catch (e) {}
}

export const TrackingService = {
  // Save or update user profile
  async saveUserProfile(user) {
    if (!user || !user.uid) return false;

    const sanitized = sanitizeData({
      uid: String(user.uid),
      email: user.email || '',
      displayName: user.displayName || 'User',
      avatar: user.avatar || '',
      role: user.role || 'user',
      isSharing: user.isSharing ?? true,
      lastSeen: Date.now(),
      createdAt: user.createdAt || Date.now()
    });

    if (isConfigured && db) {
      try {
        const userRef = doc(db, 'users', String(user.uid));
        await setDoc(userRef, sanitized, { merge: true });
        return true;
      } catch (err) {
        console.error("Firebase saveUserProfile error:", err);
      }
    }

    // Local mode sync for real accounts
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.uid === user.uid);
    if (idx >= 0) {
      users[idx] = { 
        ...users[idx], 
        ...sanitized, 
        lastSeen: Date.now() 
      };
    } else {
      users.push(sanitized);
    }
    saveLocalUsers(users);
    window.dispatchEvent(new CustomEvent('map_tracking_users_changed'));
    return true;
  },

  // Update user's live location
  async updateUserLocation(uid, locationData, isSharing = true) {
    if (!uid) return false;

    const locUpdate = sanitizeData({
      location: {
        ...locationData,
        updatedAt: Date.now()
      },
      isSharing: isSharing,
      lastSeen: Date.now()
    });

    if (isConfigured && db) {
      try {
        const userRef = doc(db, 'users', String(uid));
        await updateDoc(userRef, locUpdate);
        return true;
      } catch (err) {
        console.error("Firebase updateUserLocation error:", err);
      }
    }

    // Local mode sync for real accounts
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx >= 0) {
      users[idx].location = locUpdate.location;
      users[idx].isSharing = isSharing;
      users[idx].lastSeen = Date.now();
      saveLocalUsers(users);
      window.dispatchEvent(new CustomEvent('map_tracking_users_changed'));
    }
    return true;
  },

  // Toggle user sharing status
  async toggleSharing(uid, isSharing) {
    if (!uid) return false;

    if (isConfigured && db) {
      try {
        const userRef = doc(db, 'users', String(uid));
        await updateDoc(userRef, {
          isSharing: isSharing,
          lastSeen: Date.now()
        });
        return true;
      } catch (err) {
        console.error("Firebase toggleSharing error:", err);
      }
    }

    // Local mode sync
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx >= 0) {
      users[idx].isSharing = isSharing;
      users[idx].lastSeen = Date.now();
      saveLocalUsers(users);
      window.dispatchEvent(new CustomEvent('map_tracking_users_changed'));
    }
    return true;
  },

  // Subscribe to all users (for Admin dashboard and Live Map)
  subscribeAllUsers(callback) {
    if (isConfigured && db) {
      try {
        const usersCol = collection(db, 'users');
        const unsubscribe = onSnapshot(usersCol, (snapshot) => {
          const list = [];
          snapshot.forEach((d) => list.push(d.data()));
          callback(list);
        }, (err) => {
          console.error("Firebase subscribeAllUsers error:", err);
          callback(getLocalUsers());
        });
        return unsubscribe;
      } catch (err) {
        console.error("Error setting up onSnapshot for users:", err);
      }
    }

    // Local mode listener
    const handler = () => {
      callback(getLocalUsers());
    };
    window.addEventListener('map_tracking_users_changed', handler);
    // Initial call
    callback(getLocalUsers());
    return () => window.removeEventListener('map_tracking_users_changed', handler);
  },

  // Create or join a shared tracking session/room
  async joinTrackingRoom(roomId, user) {
    if (!roomId || !user) return;
    const cleanUid = String(user.uid || user.id || ('usr_' + Date.now().toString(36)));

    const memberData = sanitizeData({
      uid: cleanUid,
      displayName: user.displayName || 'User',
      avatar: user.avatar || '',
      joinedAt: Date.now()
    });

    if (isConfigured && db) {
      try {
        const roomRef = doc(db, 'tracking_rooms', roomId);
        const snap = await getDoc(roomRef);
        const members = snap.exists() ? snap.data().members || {} : {};
        members[cleanUid] = memberData;
        await setDoc(roomRef, {
          roomId,
          members,
          updatedAt: Date.now()
        }, { merge: true });
        return true;
      } catch (err) {
        console.error("Firebase joinTrackingRoom error:", err);
      }
    }

    // Local mode
    const rooms = getLocalRooms();
    if (!rooms[roomId]) {
      rooms[roomId] = { roomId, members: {}, updatedAt: Date.now() };
    }
    rooms[roomId].members[cleanUid] = memberData;
    saveLocalRooms(rooms);
    window.dispatchEvent(new CustomEvent(`map_tracking_room_${roomId}`));
    return true;
  },

  // Subscribe to a specific tracking room
  subscribeTrackingRoom(roomId, callback) {
    if (!roomId) return () => {};

    if (isConfigured && db) {
      try {
        const roomRef = doc(db, 'tracking_rooms', roomId);
        const unsubscribe = onSnapshot(roomRef, (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data());
          }
        });
        return unsubscribe;
      } catch (err) {
        console.error("Firebase subscribeTrackingRoom error:", err);
      }
    }

    // Local mode
    const handler = () => {
      const rooms = getLocalRooms();
      if (rooms[roomId]) callback(rooms[roomId]);
    };
    window.addEventListener(`map_tracking_room_${roomId}`, handler);
    const rooms = getLocalRooms();
    if (rooms[roomId]) callback(rooms[roomId]);
    return () => window.removeEventListener(`map_tracking_room_${roomId}`, handler);
  }
};
