import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from '../config/firebase';

const AuthContext = createContext(null);

function enrichUserWithAdmin(user) {
  if (!user) return null;
  const isAdm = 
    user.role === 'admin' || 
    user.email?.toLowerCase().includes('admin') || 
    user.email?.toLowerCase().startsWith('admin@');
  if (isAdm && user.role !== 'admin') {
    return { ...user, role: 'admin' };
  }
  return user;
}

export function AuthProvider({ children }) {
  // Load cached user session immediately to eliminate initial flicker and prevent logout on refresh
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('MAP_TRACKING_USER');
      return saved ? enrichUserWithAdmin(JSON.parse(saved)) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore authenticated session from backend on mount
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('MAP_TRACKING_JWT');
      if (token) {
        try {
          const res = await api.getMe();
          if (res?.user) {
            const enriched = enrichUserWithAdmin(res.user);
            setCurrentUser(enriched);
            localStorage.setItem('MAP_TRACKING_USER', JSON.stringify(enriched));
          }
        } catch (err) {
          console.warn("Auth verify background note (preserving session):", err.message);
          // ONLY clear token if backend explicitly returns 401 / 403 (invalid token)
          // NEVER log out due to server cold start, sleep or temporary network glitch!
          if (err.status === 401 || err.status === 403) {
            localStorage.removeItem('MAP_TRACKING_JWT');
            localStorage.removeItem('MAP_TRACKING_USER');
            setCurrentUser(null);
          }
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  // Helper to persist user and token
  const persistSession = (user, token) => {
    if (token) {
      localStorage.setItem('MAP_TRACKING_JWT', token);
    }
    if (user) {
      const enriched = enrichUserWithAdmin(user);
      localStorage.setItem('MAP_TRACKING_USER', JSON.stringify(enriched));
      setCurrentUser(enriched);
      return enriched;
    }
    return user;
  };

  // Login with Email & Password (Dual-Engine: Firebase Auth + Backend DB fallback)
  const login = async (email, password) => {
    setAuthError(null);
    const cleanEmail = email.toLowerCase().trim();

    // 1. Try Firebase Authentication first (for accounts created in Firebase Console or Firebase Auth)
    try {
      const fbCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = fbCredential.user;

      const syncData = await api.firebaseAuth({
        email: fbUser.email || cleanEmail,
        displayName: fbUser.displayName || (cleanEmail.includes('admin') ? 'Administrator' : cleanEmail.split('@')[0]),
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        googleUid: fbUser.uid
      });

      return persistSession(syncData.user, syncData.token);
    } catch (fbErr) {
      console.warn("Firebase Auth signIn note:", fbErr.code, fbErr.message);
      if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        throw new Error('ពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ (Incorrect password)');
      }
    }

    // 2. Direct Backend API Login (with automatic provision for admin accounts)
    try {
      const data = await api.login({ email: cleanEmail, password });
      return persistSession(data.user, data.token);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Register with Email & Password
  const register = async (email, password, displayName, avatar, role = 'user') => {
    setAuthError(null);
    const cleanEmail = email.toLowerCase().trim();
    const assignedRole = (cleanEmail.includes('admin') || cleanEmail.startsWith('admin@')) ? 'admin' : role;

    // Also attempt Firebase user registration so both sides stay unified
    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, password);
    } catch (fbErr) {
      // User might already exist in Firebase
    }

    try {
      const data = await api.register({
        email: cleanEmail,
        password,
        displayName,
        avatar,
        role: assignedRole
      });
      return persistSession(data.user, data.token);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // One-Click Sign In with Google
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const data = await api.googleAuth({
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email.split('@')[0],
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.email}`,
        googleUid: fbUser.uid
      });

      return persistSession(data.user, data.token);
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-in was cancelled');
      }
      setAuthError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  // Logout - strictly only when explicitly invoked by user!
  const logout = () => {
    try {
      localStorage.removeItem('MAP_TRACKING_JWT');
      localStorage.removeItem('MAP_TRACKING_USER');
      localStorage.removeItem('MAP_TRACKING_CURRENT_GROUP');
      localStorage.removeItem('MAP_TRACKING_USER_GROUPS');
    } catch (e) {}

    signOut(auth).catch(() => {});
    setCurrentUser(null);
    window.dispatchEvent(new CustomEvent('map_tracking_user_logout'));
  };

  // Update user profile (Display Name and Avatar)
  const updateProfile = async (displayName, avatar) => {
    if (!currentUser) throw new Error("No user logged in");
    const updated = await api.updateProfile({ displayName, avatar });
    const merged = { ...currentUser, ...updated };
    setCurrentUser(merged);
    try {
      localStorage.setItem('MAP_TRACKING_USER', JSON.stringify(merged));
    } catch (e) {}

    // Broadcast in real-time
    socket.emit('update_profile', {
      uid: merged.uid,
      displayName: merged.displayName,
      avatar: merged.avatar
    });

    return merged;
  };

  const isUserAdmin = Boolean(
    currentUser?.role === 'admin' || 
    currentUser?.email?.toLowerCase().includes('admin') ||
    currentUser?.email?.toLowerCase().startsWith('admin@')
  );

  const value = {
    currentUser,
    loading,
    authError,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    isAdmin: isUserAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
