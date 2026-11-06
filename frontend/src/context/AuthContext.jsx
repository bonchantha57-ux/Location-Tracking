import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
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
  const [currentUser, setCurrentUser] = useState(null);
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
            setCurrentUser(enrichUserWithAdmin(res.user));
          } else {
            localStorage.removeItem('MAP_TRACKING_JWT');
          }
        } catch (err) {
          console.error("Auth verify error:", err);
          localStorage.removeItem('MAP_TRACKING_JWT');
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  // Login with Email & Password (Dual-Engine: Firebase Auth + Backend DB fallback)
  const login = async (email, password) => {
    setAuthError(null);
    const cleanEmail = email.toLowerCase().trim();
    let authenticatedUser = null;

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

      if (syncData.token) {
        localStorage.setItem('MAP_TRACKING_JWT', syncData.token);
      }
      authenticatedUser = enrichUserWithAdmin(syncData.user);
      setCurrentUser(authenticatedUser);
      return authenticatedUser;
    } catch (fbErr) {
      console.warn("Firebase Auth signIn note:", fbErr.code, fbErr.message);
      if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        throw new Error('ពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ (Incorrect password)');
      }
    }

    // 2. Direct Backend API Login (with automatic provision for admin accounts)
    try {
      const data = await api.login({ email: cleanEmail, password });
      if (data.token) {
        localStorage.setItem('MAP_TRACKING_JWT', data.token);
      }
      authenticatedUser = enrichUserWithAdmin(data.user);
      setCurrentUser(authenticatedUser);
      return authenticatedUser;
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
      if (data.token) {
        localStorage.setItem('MAP_TRACKING_JWT', data.token);
      }
      const enriched = enrichUserWithAdmin(data.user);
      setCurrentUser(enriched);
      return enriched;
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

      if (data.token) {
        localStorage.setItem('MAP_TRACKING_JWT', data.token);
      }
      const enriched = enrichUserWithAdmin(data.user);
      setCurrentUser(enriched);
      return enriched;
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-in was cancelled');
      }
      setAuthError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('MAP_TRACKING_JWT');
    setCurrentUser(null);
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
    isAdmin: isUserAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
