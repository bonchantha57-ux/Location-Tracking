import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdmin.js';

function generateToken(user) {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '30d' }
  );
}

export async function register(req, res) {
  try {
    const { email, password, displayName, avatar, role } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const isAdmin = 
      email.toLowerCase().includes('admin') || 
      (process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) ||
      role === 'admin';

    const newUser = {
      uid,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      displayName,
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
      role: isAdmin ? 'admin' : 'user',
      isSharing: true,
      createdAt: Date.now(),
      lastSeen: Date.now()
    };

    await db.setUser(uid, newUser);

    const token = generateToken(newUser);
    const { passwordHash, ...userResponse } = newUser;

    return res.status(201).json({
      user: userResponse,
      token
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify password if hash exists (or accept valid demo login)
    if (user.passwordHash) {
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }
    }

    // Ensure admin role if email contains admin
    if (user.email.toLowerCase().includes('admin') && user.role !== 'admin') {
      user.role = 'admin';
      await db.setUser(user.uid, { role: 'admin' });
    }

    const token = generateToken(user);
    const { passwordHash, ...userResponse } = user;

    return res.json({
      user: userResponse,
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: 'Server error during login' });
  }
}

export async function getMe(req, res) {
  try {
    const { passwordHash, ...userResponse } = req.user;
    return res.json({ user: userResponse });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

// Google Sign-In handler
export async function googleAuth(req, res) {
  try {
    const { email, displayName, avatar, googleUid } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google account' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await db.getUserByEmail(cleanEmail);

    const isAdmin = 
      cleanEmail.includes('admin') || 
      (process.env.ADMIN_EMAIL && cleanEmail === process.env.ADMIN_EMAIL.toLowerCase());

    if (!user) {
      // Create new user from Google profile
      const uid = googleUid || ('usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6));
      user = {
        uid,
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        role: isAdmin ? 'admin' : 'user',
        isSharing: true,
        provider: 'google',
        createdAt: Date.now(),
        lastSeen: Date.now()
      };
      await db.setUser(uid, user);
    } else {
      // Update avatar or display name if missing
      const updates = {
        lastSeen: Date.now()
      };
      if (avatar && (!user.avatar || user.avatar.includes('dicebear'))) {
        updates.avatar = avatar;
      }
      if (displayName && !user.displayName) {
        updates.displayName = displayName;
      }
      if (isAdmin && user.role !== 'admin') {
        updates.role = 'admin';
      }
      user = await db.setUser(user.uid, updates);
    }

    const token = generateToken(user);
    const { passwordHash, ...userResponse } = user;

    return res.json({
      user: userResponse,
      token
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ error: 'Server error during Google authentication' });
  }
}

