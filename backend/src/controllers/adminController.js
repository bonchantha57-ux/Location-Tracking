import { db } from '../config/firebaseAdmin.js';

export async function getAdminStats(req, res) {
  try {
    const users = await db.getAllUsers();
    const totalUsers = users.length;
    const activeSharing = users.filter(u => u.isSharing && u.location?.lat).length;
    const hiddenUsers = users.filter(u => !u.isSharing).length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    return res.json({
      stats: {
        totalUsers,
        activeSharing,
        hiddenUsers,
        adminCount,
        isFirebase: db.isFirebase(),
        systemTime: Date.now()
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ error: 'Server error fetching admin stats' });
  }
}

export async function getAdminUsersList(req, res) {
  try {
    const users = await db.getAllUsers();
    const safeUsers = users.map(({ passwordHash, ...user }) => user);
    return res.json({ users: safeUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Server error fetching users list' });
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

