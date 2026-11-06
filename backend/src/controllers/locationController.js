import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdmin.js';

export async function updateLocation(req, res) {
  try {
    const { lat, lng, speed, heading, altitude, accuracy, isSharing } = req.body;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Coordinates lat and lng required' });
    }

    const locationData = {
      lat: Number(lat),
      lng: Number(lng),
      speed: Number(speed || 0),
      heading: Number(heading || 0),
      altitude: Number(altitude || 0),
      accuracy: Number(accuracy || 10)
    };

    const updatedUser = await db.updateUserLocation(uid, locationData, isSharing ?? true);

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Update location error:", err);
    return res.status(500).json({ error: 'Server error updating location' });
  }
}

export async function toggleSharing(req, res) {
  try {
    const { isSharing } = req.body;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updatedUser = await db.toggleUserSharing(uid, Boolean(isSharing));
    return res.json({ success: true, isSharing: updatedUser.isSharing });
  } catch (err) {
    return res.status(500).json({ error: 'Server error toggling sharing' });
  }
}

export async function getActiveUsers(req, res) {
  try {
    const { groupId } = req.query;
    const users = await db.getAllUsers();

    // Check if requester is Admin
    let isAdmin = false;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded.role === 'admin' || decoded.email?.toLowerCase().includes('admin')) {
          isAdmin = true;
        }
      } catch (e) {}
    }

    // 1. If Admin: Has God-view access to see ALL active users who are sharing!
    if (isAdmin) {
      const activeSharing = users
        .filter(u => u.isSharing && u.location?.lat)
        .map(({ passwordHash, ...safeUser }) => safeUser);
      return res.json({ users: activeSharing });
    }

    // 2. If groupId is provided: ONLY return members of this specific group who have isSharing=true!
    if (groupId) {
      const cleanGroupId = groupId.toUpperCase().trim();
      const group = await db.getGroup(cleanGroupId);
      if (group && group.members) {
        const memberUids = new Set(Object.keys(group.members));
        const groupUsers = users
          .filter(u => memberUids.has(u.uid) && u.isSharing && u.location?.lat)
          .map(({ passwordHash, ...safeUser }) => safeUser);
        return res.json({ users: groupUsers });
      }
    }

    // 3. Normal users without a group: strictly return empty array (zero stranger visibility)
    return res.json({ users: [] });
  } catch (err) {
    console.error("Error fetching active users:", err);
    return res.status(500).json({ error: 'Server error fetching active users' });
  }
}

export async function joinTrackingRoom(req, res) {
  try {
    const { roomId } = req.body;
    const user = req.user;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId required' });
    }

    const members = await db.joinRoom(roomId, user);
    return res.json({ success: true, roomId, members });
  } catch (err) {
    return res.status(500).json({ error: 'Server error joining tracking room' });
  }
}

// Group Features
export async function createGroupHandler(req, res) {
  try {
    const { name, customId, type, maxMembers } = req.body;
    let user = req.user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const isDuo = type === 'duo' || maxMembers === 2;
    const prefix = isDuo ? 'DUO' : 'GP';
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const groupId = customId ? customId.toUpperCase().replace(/\s+/g, '') : `${prefix}-${randomCode}`;

    const existing = await db.getGroup(groupId);
    if (existing) {
      return res.status(400).json({ error: 'Group / Duo ID already exists, please choose another or auto-generate' });
    }

    const group = await db.createGroup(
      groupId, 
      name || (isDuo ? `Duo Tracking (${groupId})` : `Group ${groupId}`), 
      user,
      {
        type: isDuo ? 'duo' : 'group',
        maxMembers: isDuo ? 2 : (maxMembers || 50)
      }
    );
    return res.status(201).json({ success: true, group });
  } catch (err) {
    console.error("Create group error:", err);
    return res.status(500).json({ error: err.message || 'Failed to create group' });
  }
}

export async function joinGroupHandler(req, res) {
  try {
    const { groupId } = req.body;
    const user = req.user;

    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Please login first' });
    }

    if (!groupId) {
      return res.status(400).json({ error: 'Please enter a Group ID' });
    }

    const cleanId = groupId.toUpperCase().trim();
    const existing = await db.getGroup(cleanId);
    if (!existing) {
      return res.status(404).json({ error: `Group ID "${cleanId}" not found. Please check and try again.` });
    }

    const updatedGroup = await db.joinGroup(cleanId, user);
    return res.json({ success: true, group: updatedGroup });
  } catch (err) {
    console.error("Join group error:", err);
    return res.status(err.status || 400).json({ error: err.message || 'Failed to join group' });
  }
}

export async function getGroupHandler(req, res) {
  try {
    const { groupId } = req.params;
    const group = await db.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    return res.json({ group });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch group' });
  }
}

export async function getGroupTrailsHandler(req, res) {
  try {
    const { groupId } = req.params;
    const trails = await db.getGroupTrails(groupId);
    return res.json({ success: true, trails });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch group trails' });
  }
}

export async function leaveGroupHandler(req, res) {
  try {
    const { groupId } = req.body;
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    await db.leaveGroup(groupId, uid);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to leave group' });
  }
}
