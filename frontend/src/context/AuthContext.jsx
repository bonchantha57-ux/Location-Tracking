import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { auth, googleProvider, signInWithPopup } from '../config/firebase';

const AuthContext = createContext(null);

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
            setCurrentUser(res.user);
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

  // Login with Email & Password
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await api.login({ email, password });
      if (data.token) {
        localStorage.setItem('MAP_TRACKING_JWT', data.token);
      }
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Register with Email & Password
  const register = async (email, password, displayName, avatar, role = 'user') => {
    setAuthError(null);
    try {
      const data = await api.register({
        email,
        password,
        displayName,
        avatar,
        role
      });
      if (data.token) {
        localStorage.setItem('MAP_TRACKING_JWT', data.token);
      }
      setCurrentUser(data.user);
      return data.user;
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
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Google sign-in error:", err);
      // Friendly message if popup was closed by user
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

  const value = {
    currentUser,
    loading,
    authError,
    login,
    register,
    loginWithGoogle,
    logout,
    isAdmin: currentUser?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
