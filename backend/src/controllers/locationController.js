import { db } from '../config/firebaseAdmin.js';

export async function updateLocation(req, res) {
  try {
    const { lat, lng, speed, heading, altitude, accuracy, isSharing } = req.body;
    const uid = req.user.uid;

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
    const uid = req.user.uid;

    const updatedUser = await db.toggleUserSharing(uid, Boolean(isSharing));
    return res.json({ success: true, isSharing: updatedUser.isSharing });
  } catch (err) {
    return res.status(500).json({ error: 'Server error toggling sharing' });
  }
}

export async function getActiveUsers(req, res) {
  try {
    const users = await db.getAllUsers();
    // Return users who are actively sharing
    const activeSharing = users
      .filter(u => u.isSharing && u.location?.lat)
      .map(({ passwordHash, ...safeUser }) => safeUser);

    return res.json({ users: activeSharing });
  } catch (err) {
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
    const user = req.user;

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

export async function leaveGroupHandler(req, res) {
  try {
    const { groupId } = req.body;
    const uid = req.user.uid;
    await db.leaveGroup(groupId, uid);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to leave group' });
  }
}

