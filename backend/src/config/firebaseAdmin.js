import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Web/Node Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
};

let app = null;
let firestoreDb = null;
let realtimeDb = null;
let isConnected = false;

// Initialize Firebase App
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    firestoreDb = getFirestore(app);
    realtimeDb = getDatabase(app);
    isConnected = true;
    console.log(`🔥 Firebase successfully connected: Project [${firebaseConfig.projectId}]`);
    console.log(`📦 Cloud Firestore & Realtime Database initialized!`);
  }
} catch (err) {
  console.warn("⚠️ Firebase connection note:", err.message);
}

// Local Persistent Store (fallback and local mirror)
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbFilePath = path.join(dataDir, 'db.json');

function readLocalDb() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const parsed = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
      if (!parsed.groups) parsed.groups = {};
      return parsed;
    }
  } catch (e) {}
  return { users: {}, rooms: {}, groups: {} };
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Error writing local db:", e);
  }
}

// Helper for fast, non-blocking cloud persistence
function syncCloud(promise) {
  if (!promise || typeof promise.catch !== 'function') return;
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout')), 1500))
  ]).catch(() => {});
}

// Recursively sanitize objects so no keys with undefined values or undefined keys reach Firestore
function sanitizeForFirestore(val) {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }
  const clean = {};
  for (const [key, value] of Object.entries(val)) {
    if (key !== 'undefined' && key !== '' && value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

export const db = {
  isFirebase: () => isConnected,
  getFirebaseApp: () => app,
  getFirestore: () => firestoreDb,
  getRealtimeDb: () => realtimeDb,

  // Users Collection
  async getUser(uid) {
    if (!uid) return null;
    const cleanUid = String(uid);
    const data = readLocalDb();
    if (data.users && data.users[cleanUid]) return data.users[cleanUid];

    if (isConnected && firestoreDb) {
      try {
        const userRef = doc(firestoreDb, 'users', cleanUid);
        const snap = await Promise.race([
          getDoc(userRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        if (snap?.exists()) return snap.data();
      } catch (e) {}
    }
    return null;
  },

  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    const data = readLocalDb();
    const localUser = Object.values(data.users || {}).find(u => u.email?.toLowerCase() === cleanEmail);
    if (localUser) return localUser;

    if (isConnected && firestoreDb) {
      try {
        const q = query(collection(firestoreDb, 'users'), where('email', '==', cleanEmail));
        const snap = await Promise.race([
          getDocs(q),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        if (snap && !snap.empty) {
          return snap.docs[0].data();
        }
      } catch (e) {}
    }
    return null;
  },

  async setUser(uid, userData) {
    if (!uid) return null;
    const cleanUid = String(uid);
    const sanitizedUser = sanitizeForFirestore({
      uid: cleanUid,
      ...userData
    });

    // 1. Mirror in Local DB
    const data = readLocalDb();
    if (!data.users) data.users = {};
    data.users[cleanUid] = { ...(data.users[cleanUid] || {}), ...sanitizedUser };
    writeLocalDb(data);

    // 2. Persist to Firestore asynchronously
    if (isConnected && firestoreDb) {
      const userRef = doc(firestoreDb, 'users', cleanUid);
      syncCloud(setDoc(userRef, sanitizedUser, { merge: true }));
    }

    return data.users[cleanUid];
  },

  async getAllUsers() {
    const data = readLocalDb();
    const localUsersMap = { ...(data.users || {}) };

    // Fetch directly from Cloud Firestore to guarantee complete and live database synchronization
    if (isConnected && firestoreDb) {
      try {
        const snap = await Promise.race([
          getDocs(collection(firestoreDb, 'users')),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        if (snap && !snap.empty) {
          snap.forEach(docSnap => {
            const u = docSnap.data();
            if (u && u.uid) {
              localUsersMap[u.uid] = { ...(localUsersMap[u.uid] || {}), ...u };
            }
          });
          data.users = localUsersMap;
          writeLocalDb(data);
        }
      } catch (err) {
        console.warn("Firestore getAllUsers sync note:", err.message);
      }
    }

    return Object.values(localUsersMap);
  },

  async deleteUser(uid) {
    if (!uid) return false;
    const cleanUid = String(uid);

    // 1. Delete from local DB
    const data = readLocalDb();
    if (data.users && data.users[cleanUid]) {
      delete data.users[cleanUid];
      writeLocalDb(data);
    }

    // 2. Delete from Cloud Firestore
    if (isConnected && firestoreDb) {
      try {
        const userRef = doc(firestoreDb, 'users', cleanUid);
        syncCloud(deleteDoc(userRef));
      } catch (e) {}
    }

    // 3. Delete from Realtime DB
    if (isConnected && realtimeDb) {
      try {
        const locRef = ref(realtimeDb, `locations/${cleanUid}`);
        await set(locRef, null);
      } catch (e) {}
    }

    return true;
  },

  // Update user's live location in Firestore and Realtime Database
  async updateUserLocation(uid, locationData, isSharing = true) {
    if (!uid) return null;
    const cleanUid = String(uid);
    const update = sanitizeForFirestore({
      location: {
        ...locationData,
        updatedAt: Date.now()
      },
      isSharing,
      lastSeen: Date.now()
    });

    // 1. Save in Firestore & local DB
    const updated = await this.setUser(cleanUid, update);

    // 2. Save in Firebase Realtime Database for high-frequency GPS telemetry
    if (isConnected && realtimeDb) {
      try {
        const locRef = ref(realtimeDb, `locations/${cleanUid}`);
        await set(locRef, {
          uid: cleanUid,
          lat: locationData.lat,
          lng: locationData.lng,
          speed: locationData.speed,
          heading: locationData.heading,
          accuracy: locationData.accuracy,
          isSharing,
          updatedAt: Date.now()
        });
      } catch (e) {}
    }

    return updated;
  },

  async toggleUserSharing(uid, isSharing) {
    if (!uid) return null;
    const cleanUid = String(uid);
    const updated = await this.setUser(cleanUid, { isSharing, lastSeen: Date.now() });
    if (isConnected && realtimeDb) {
      try {
        const locRef = ref(realtimeDb, `locations/${cleanUid}/isSharing`);
        await set(locRef, isSharing);
      } catch (e) {}
    }
    return updated;
  },

  // Groups Management in Firestore & Realtime DB
  async createGroup(groupId, name, creator, options = {}) {
    const cleanId = String(groupId || ('GP' + Math.floor(1000 + Math.random() * 9000))).toUpperCase().trim();
    const isDuo = options.type === 'duo' || options.maxMembers === 2 || cleanId.startsWith('DUO-');
    
    // STRICT VALIDATION: ensure creator.uid is never undefined!
    const creatorUid = String(creator?.uid || creator?.id || ('usr_' + Date.now().toString(36)));
    const creatorName = creator?.displayName || creator?.name || creator?.email?.split('@')[0] || 'User';
    const creatorAvatar = creator?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorUid}`;

    const memberEntry = {
      uid: creatorUid,
      displayName: creatorName,
      avatar: creatorAvatar,
      role: 'admin',
      joinedAt: Date.now()
    };

    const groupData = {
      groupId: cleanId,
      name: name || (isDuo ? `Duo Tracking (${cleanId})` : `Group ${cleanId}`),
      creatorUid,
      creatorName,
      createdAt: Date.now(),
      type: isDuo ? 'duo' : (options.type || 'group'),
      maxMembers: isDuo ? 2 : (options.maxMembers || 50),
      members: {
        [creatorUid]: memberEntry
      },
      trails: {
        [creatorUid]: []
      }
    };

    const sanitizedGroup = sanitizeForFirestore(groupData);

    // Save in Local DB
    const data = readLocalDb();
    if (!data.groups) data.groups = {};
    data.groups[cleanId] = sanitizedGroup;
    writeLocalDb(data);

    // Save in Firestore asynchronously
    if (isConnected && firestoreDb) {
      syncCloud(setDoc(doc(firestoreDb, 'groups', cleanId), sanitizedGroup));
    }

    // Save in Realtime DB asynchronously
    if (isConnected && realtimeDb) {
      syncCloud(set(ref(realtimeDb, `groups/${cleanId}`), sanitizedGroup));
    }

    return sanitizedGroup;
  },

  async getGroup(groupId) {
    if (!groupId) return null;
    const cleanId = String(groupId).toUpperCase().trim();

    const data = readLocalDb();
    if (data.groups && data.groups[cleanId]) {
      return data.groups[cleanId];
    }

    if (isConnected && firestoreDb) {
      try {
        const snap = await Promise.race([
          getDoc(doc(firestoreDb, 'groups', cleanId)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        if (snap?.exists()) return snap.data();
      } catch (e) {}
    }

    return null;
  },

  async joinGroup(groupId, user) {
    if (!groupId) return null;
    const cleanId = String(groupId).toUpperCase().trim();

    // STRICT VALIDATION: ensure userUid is never undefined!
    const userUid = String(user?.uid || user?.id || ('usr_' + Date.now().toString(36)));
    const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'User';
    const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userUid}`;

    let group = await this.getGroup(cleanId);
    const data = readLocalDb();

    if (!group) {
      // Create if doesn't exist
      const isDuo = cleanId.startsWith('DUO-');
      group = await this.createGroup(cleanId, isDuo ? 'Duo Private (២នាក់)' : `Group ${cleanId}`, {
        uid: userUid,
        displayName: userName,
        avatar: userAvatar
      }, {
        type: isDuo ? 'duo' : 'group',
        maxMembers: isDuo ? 2 : 50
      });
      return group;
    }

    const memberUids = Object.keys(group.members || {});
    const isAlreadyMember = memberUids.includes(userUid);
    const maxMembers = group.maxMembers || (group.type === 'duo' ? 2 : null);

    if (!isAlreadyMember && maxMembers && memberUids.length >= maxMembers) {
      const err = new Error(
        group.type === 'duo'
          ? 'បន្ទប់នេះសម្រាប់តែ ២នាក់ប៉ុណ្ណោះ ហើយបានពេញហើយ! (This Duo session is strictly for 2 people and is already full!)'
          : `បន្ទប់ ${cleanId} បានពេញហើយ (អតិបរមា ${maxMembers} នាក់)`
      );
      err.status = 403;
      throw err;
    }

    if (!data.groups) data.groups = {};
    if (!data.groups[cleanId]) data.groups[cleanId] = group;
    if (!data.groups[cleanId].members) data.groups[cleanId].members = {};
    if (!data.groups[cleanId].trails) data.groups[cleanId].trails = {};
    if (!data.groups[cleanId].trails[userUid]) data.groups[cleanId].trails[userUid] = [];

    const memberData = sanitizeForFirestore({
      uid: userUid,
      displayName: userName,
      avatar: userAvatar,
      role: isAlreadyMember ? (data.groups[cleanId].members[userUid]?.role || 'member') : 'member',
      joinedAt: isAlreadyMember ? (data.groups[cleanId].members[userUid]?.joinedAt || Date.now()) : Date.now()
    });

    data.groups[cleanId].members[userUid] = memberData;
    writeLocalDb(data);

    const updatedGroup = data.groups[cleanId];

    if (isConnected && firestoreDb) {
      const sanitizedMembers = sanitizeForFirestore(updatedGroup.members);
      syncCloud(setDoc(doc(firestoreDb, 'groups', cleanId), {
        members: sanitizedMembers
      }, { merge: true }));
    }

    if (isConnected && realtimeDb) {
      syncCloud(set(ref(realtimeDb, `groups/${cleanId}/members/${userUid}`), memberData));
    }

    return updatedGroup;
  },

  async leaveGroup(groupId, uid) {
    if (!groupId || !uid) return false;
    const cleanId = String(groupId).toUpperCase().trim();
    const cleanUid = String(uid);

    const data = readLocalDb();
    if (data.groups && data.groups[cleanId] && data.groups[cleanId].members && data.groups[cleanId].members[cleanUid]) {
      delete data.groups[cleanId].members[cleanUid];
      writeLocalDb(data);

      if (isConnected && firestoreDb) {
        const sanitizedMembers = sanitizeForFirestore(data.groups[cleanId].members);
        syncCloud(setDoc(doc(firestoreDb, 'groups', cleanId), {
          members: sanitizedMembers
        }, { merge: true }));
      }

      if (isConnected && realtimeDb) {
        syncCloud(set(ref(realtimeDb, `groups/${cleanId}/members/${cleanUid}`), null));
      }

      return true;
    }
    return false;
  },

  // Record a movement track point (bread crumb / history trail) for a member in a group
  async recordGroupTrailPoint(groupId, uid, locationData) {
    if (!groupId || !uid || !locationData || locationData.lat === undefined) return null;
    const cleanId = String(groupId).toUpperCase().trim();
    const cleanUid = String(uid);

    const data = readLocalDb();
    if (!data.groups || !data.groups[cleanId]) return null;
    const group = data.groups[cleanId];
    if (!group.trails) group.trails = {};
    if (!group.trails[cleanUid]) group.trails[cleanUid] = [];

    const userTrail = group.trails[cleanUid];
    const newPoint = {
      lat: Number(locationData.lat),
      lng: Number(locationData.lng),
      speed: Number(locationData.speed || 0),
      heading: Number(locationData.heading || 0),
      altitude: Number(locationData.altitude || 0),
      timestamp: Number(locationData.timestamp || Date.now())
    };

    // Filter micro jitter: only record if shifted by at least ~4 meters or 1st point
    if (userTrail.length > 0) {
      const lastPoint = userTrail[userTrail.length - 1];
      const dLat = Math.abs(lastPoint.lat - newPoint.lat);
      const dLng = Math.abs(lastPoint.lng - newPoint.lng);
      if (dLat < 0.00004 && dLng < 0.00004) {
        return null; // stationary
      }
    }

    // Keep up to 600 points per user trail
    if (userTrail.length >= 600) {
      userTrail.shift();
    }
    userTrail.push(newPoint);
    writeLocalDb(data);

    // Persist to Realtime DB and Firestore
    if (isConnected && realtimeDb) {
      syncCloud(set(ref(realtimeDb, `groups/${cleanId}/trails/${cleanUid}`), userTrail));
    }
    if (isConnected && firestoreDb) {
      syncCloud(setDoc(doc(firestoreDb, 'groups', cleanId), {
        trails: {
          [cleanUid]: userTrail
        }
      }, { merge: true }));
    }

    return newPoint;
  },

  // Get historical trails for all members in a group
  async getGroupTrails(groupId) {
    if (!groupId) return {};
    const cleanId = String(groupId).toUpperCase().trim();
    const data = readLocalDb();
    if (data.groups && data.groups[cleanId]?.trails) {
      return data.groups[cleanId].trails;
    }

    if (isConnected && firestoreDb) {
      try {
        const snap = await Promise.race([
          getDoc(doc(firestoreDb, 'groups', cleanId)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        if (snap?.exists()) {
          const groupData = snap.data();
          return groupData.trails || {};
        }
      } catch (e) {}
    }

    return {};
  }
};
