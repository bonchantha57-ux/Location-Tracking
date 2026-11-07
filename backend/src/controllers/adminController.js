import bcrypt from 'bcryptjs';
import { db } from '../config/firebaseAdmin.js';
import { getOnlineUids } from '../sockets/locationSocket.js';

export async function getAdminStats(req, res) {
  try {
    const [users, groups] = await Promise.all([
      db.getAllUsers(),
      db.getAllGroups()
    ]);
    const onlineUids = getOnlineUids();
    const now = Date.now();

    const totalUsers = users.length;
    const totalGroups = groups.length;
    // User is online if actively connected via WebSocket OR seen in last 5 minutes
    const onlineUsers = users.filter(u => 
      onlineUids.has(String(u.uid)) || (u.lastSeen && (now - u.lastSeen) < 5 * 60 * 1000)
    ).length;

    const activeSharing = users.filter(u => u.isSharing && u.location?.lat).length;
    const hiddenUsers = users.filter(u => !u.isSharing).length;
    const adminCount = users.filter(u => u.role === 'admin' || u.email?.toLowerCase().includes('admin')).length;

    return res.json({
      stats: {
        totalUsers,
        onlineUsers,
        totalGroups,
        activeSharing,
        hiddenUsers,
        adminCount,
        isFirebase: db.isFirebase(),
        systemTime: now
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ error: 'Server error fetching admin stats' });
  }
}

// Get all groups across the platform for Admin monitoring
export async function getAdminGroupsList(req, res) {
  try {
    const groups = await db.getAllGroups();
    const safeGroups = groups.map(g => ({
      groupId: g.groupId,
      name: g.name,
      type: g.type,
      creatorUid: g.creatorUid,
      creatorName: g.creatorName,
      createdAt: g.createdAt,
      maxMembers: g.maxMembers,
      membersCount: g.members ? Object.keys(g.members).length : 0,
      members: g.members || {}
    }));
    safeGroups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.json({ success: true, groups: safeGroups });
  } catch (err) {
    console.error("Admin groups list error:", err);
    return res.status(500).json({ error: 'Server error fetching groups list' });
  }
}

export async function getAdminUsersList(req, res) {
  try {
    const users = await db.getAllUsers();
    const onlineUids = getOnlineUids();
    const now = Date.now();

    const safeUsers = users.map(({ passwordHash, ...user }) => ({
      ...user,
      isOnline: onlineUids.has(String(user.uid)) || (user.lastSeen && (now - user.lastSeen) < 5 * 60 * 1000)
    }));

    // Sort: Online & Admins first, then by lastSeen desc
    safeUsers.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
      return (b.lastSeen || 0) - (a.lastSeen || 0);
    });

    return res.json({ users: safeUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching users list' });
  }
}

// Create new user account by Admin
export async function createAdminUser(req, res) {
  try {
    const { email, password, displayName, role = 'user' } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const isAdmin = role === 'admin' || cleanEmail.includes('admin');

    const newUser = {
      uid,
      email: cleanEmail,
      passwordHash: hashedPassword,
      displayName: displayName.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      role: isAdmin ? 'admin' : 'user',
      isSharing: true,
      createdAt: Date.now(),
      lastSeen: Date.now()
    };

    await db.setUser(uid, newUser);
    const { passwordHash, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      user: safeUser
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    return res.status(500).json({ error: 'Server error creating user' });
  }
}

// Edit/Update user account by Admin
export async function updateAdminUser(req, res) {
  try {
    const { targetUid } = req.params;
    const { displayName, email, role, password, isSharing } = req.body;

    const user = await db.getUser(targetUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {
      lastSeen: Date.now()
    };

    if (displayName) updates.displayName = displayName.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role;
    if (typeof isSharing === 'boolean') updates.isSharing = isSharing;
    if (password && password.trim().length >= 6) {
      updates.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await db.setUser(targetUid, updates);
    const { passwordHash, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      user: safeUser
    });
  } catch (err) {
    console.error("Admin update user error:", err);
    return res.status(500).json({ error: 'Server error updating user' });
  }
}

// Delete user account by Admin
export async function deleteAdminUser(req, res) {
  try {
    const { targetUid } = req.params;

    if (req.user?.uid === targetUid) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    const user = await db.getUser(targetUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.deleteUser(targetUid);

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return res.status(500).json({ error: 'Server error deleting user' });
  }
}

export async function toggleUserSharingPermission(req, res) {
  try {
    const { targetUid } = req.params;
    const { isSharing } = req.body;

    const user = await db.getUser(targetUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await db.toggleUserSharing(targetUid, isSharing);
    const { passwordHash, ...safeUser } = updated;
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: 'Server error updating user sharing' });
  }
}

