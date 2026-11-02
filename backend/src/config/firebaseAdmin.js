import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
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

export const db = {
  isFirebase: () => isConnected,
  getFirebaseApp: () => app,
  getFirestore: () => firestoreDb,
  getRealtimeDb: () => realtimeDb,

  // Users Collection
  async getUser(uid) {
    const data = readLocalDb();
    if (data.users[uid]) return data.users[uid];

    if (isConnected && firestoreDb) {
      try {
        const userRef = doc(firestoreDb, 'users', uid);
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
    const cleanEmail = email.toLowerCase().trim();
    const data = readLocalDb();
    const localUser = Object.values(data.users).find(u => u.email?.toLowerCase() === cleanEmail);
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
    // 1. Mirror in Local DB
    const data = readLocalDb();
    data.users[uid] = { ...(data.users[uid] || {}), ...userData };
    writeLocalDb(data);

    // 2. Persist to Firestore asynchronously
    if (isConnected && firestoreDb) {
      const userRef = doc(firestoreDb, 'users', uid);
      syncCloud(setDoc(userRef, data.users[uid], { merge: true }));
    }

    return data.users[uid];
  },

  async getAllUsers() {
    const data = readLocalDb();
    return Object.values(data.users);
  },

  // Update user's live location in Firestore and Realtime Database
  async updateUserLocation(uid, locationData, isSharing = true) {
    const update = {
      location: {
        ...locationData,
        updatedAt: Date.now()
      },
      isSharing,
      lastSeen: Date.now()
    };

    // 1. Save in Firestore & local DB
    const updated = await this.setUser(uid, update);

    // 2. Save in Firebase Realtime Database for high-frequency GPS telemetry
    if (isConnected && realtimeDb) {
      try {
        const locRef = ref(realtimeDb, `locations/${uid}`);
        await set(locRef, {
          uid,
          lat: locationData.lat,
          lng: locationData.lng,
          speed: locationData.speed,
          heading: locationData.heading,
          accuracy: locationData.accuracy,
          isSharing,
          updatedAt: Date.now()
        });
      } catch (e) {
        // Realtime DB sync note
      }
    }

    return updated;
  },

  async toggleUserSharing(uid, isSharing) {
    const updated = await this.setUser(uid, { isSharing, lastSeen: Date.now() });
    if (isConnected && realtimeDb) {
      try {
        const locRef = ref(realtimeDb, `locations/${uid}/isSharing`);
        await set(locRef, isSharing);
      } catch (e) {}
    }
    return updated;
  },

  // Groups Management in Firestore & Realtime DB
  async createGroup(groupId, name, creator, options = {}) {
    const cleanId = groupId.toUpperCase().trim();
    const isDuo = options.type === 'duo' || options.maxMembers === 2 || cleanId.startsWith('DUO-');
    const groupData = {
      groupId: cleanId,
      name: name || (isDuo ? `Duo Tracking (${cleanId})` : `Group ${cleanId}`),
      creatorUid: creator.uid,
      creatorName: creator.displayName,
      createdAt: Date.now(),
      type: isDuo ? 'duo' : (options.type || 'group'),
      maxMembers: isDuo ? 2 : (options.maxMembers || 50),
      members: {
        [creator.uid]: {
          uid: creator.uid,
          displayName: creator.displayName,
          avatar: creator.avatar,
          role: 'admin',
          joinedAt: Date.now()
        }
      }
    };

    // Save in Local DB
    const data = readLocalDb();
    if (!data.groups) data.groups = {};
    data.groups[cleanId] = groupData;
    writeLocalDb(data);

    // Save in Firestore asynchronously
    if (isConnected && firestoreDb) {
      syncCloud(setDoc(doc(firestoreDb, 'groups', cleanId), groupData));
    }

    // Save in Realtime DB asynchronously
    if (isConnected && realtimeDb) {
      syncCloud(set(ref(realtimeDb, `groups/${cleanId}`), groupData));
    }

    return groupData;
  },

  async getGroup(groupId) {
    if (!groupId) return null;
    const cleanId = groupId.toUpperCase().trim();

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
    if (!groupId || !user) return null;
    const cleanId = groupId.toUpperCase().trim();

    let group = await this.getGroup(cleanId);
    const data = readLocalDb();

    if (!group) {
      // Create if doesn't exist
      const isDuo = cleanId.startsWith('DUO-');
      group = await this.createGroup(cleanId, isDuo ? 'Duo Private (២នាក់)' : `Group ${cleanId}`, user, {
        type: isDuo ? 'duo' : 'group',
        maxMembers: isDuo ? 2 : 50
      });
      return group;
    }

    const memberUids = Object.keys(group.members || {});
    const isAlreadyMember = memberUids.includes(user.uid);
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

    data.groups[cleanId].members[user.uid] = {
      uid: user.uid,
      displayName: user.displayName,
      avatar: user.avatar,
      role: isAlreadyMember ? (data.groups[cleanId].members[user.uid]?.role || 'member') : 'member',
      joinedAt: isAlreadyMember ? (data.groups[cleanId].members[user.uid]?.joinedAt || Date.now()) : Date.now()
    };
    writeLocalDb(data);

    const updatedGroup = data.groups[cleanId];

    if (isConnected && firestoreDb) {
      syncCloud(setDoc(doc(firestoreDb, 'groups', cleanId), {
        members: updatedGroup.members
      }, { merge: true }));
    }

    if (isConnected && realtimeDb) {
      syncCloud(set(ref(realtimeDb, `groups/${cleanId}/members/${user.uid}`), updatedGroup.members[user.uid]));
    }

    return updatedGroup;
  },

  async leaveGroup(groupId, uid) {
    if (!groupId || !uid) return false;
    const cleanId = groupId.toUpperCase().trim();

    const data = readLocalDb();
    if (data.groups && data.groups[cleanId] && data.groups[cleanId].members[uid]) {
      delete data.groups[cleanId].members[uid];
      writeLocalDb(data);

      if (isConnected && firestoreDb) {
        syncCloud(setDoc(doc(firestoreDb, 'groups', cleanId), {
          members: data.groups[cleanId].members
        }, { merge: true }));
      }

      if (isConnected && realtimeDb) {
        syncCloud(set(ref(realtimeDb, `groups/${cleanId}/members/${uid}`), null));
      }

      return true;
    }
    return false;
  }
};
