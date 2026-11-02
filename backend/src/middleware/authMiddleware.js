import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdmin.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const uid = decoded.uid || decoded.id || decoded.userId;

    if (!uid) {
      return res.status(403).json({ error: 'Invalid token: missing uid' });
    }

    let user = await db.getUser(uid);
    if (!user) {
      // Re-hydrate user from verified JWT payload so sessions never break across server restarts!
      user = {
        uid: String(uid),
        email: decoded.email || 'user@gmail.com',
        displayName: decoded.displayName || (decoded.email ? decoded.email.split('@')[0] : 'User'),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
        role: decoded.role || 'user',
        isSharing: true,
        lastSeen: Date.now()
      };
      await db.setUser(uid, user);
    } else {
      if (!user.uid) user.uid = String(uid);
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}
