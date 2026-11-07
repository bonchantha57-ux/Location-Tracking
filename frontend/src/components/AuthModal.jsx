import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  Check, 
  Eye, 
  EyeOff, 
  Navigation,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
];

export default function AuthModal({ isOpen, onClose, onAdminLoggedIn, lang = 'km', t }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      let user;
      if (isRegisterMode) {
        if (!displayName.trim()) {
          setErrorMessage(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Please enter your full name');
          setLoading(false);
          return;
        }
        user = await register(email, password, displayName, selectedAvatar);
      } else {
        user = await login(email, password);
      }

      onClose();

      const isUserAdmin = 
        user?.role === 'admin' || 
        user?.email?.toLowerCase().includes('admin') || 
        user?.email?.toLowerCase().startsWith('admin@');

      // If this is an Admin account, immediately open Admin Dashboard!
      if (isUserAdmin && onAdminLoggedIn) {
        onAdminLoggedIn();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await loginWithGoogle();
      onClose();

      const isUserAdmin = 
        user?.role === 'admin' || 
        user?.email?.toLowerCase().includes('admin') || 
        user?.email?.toLowerCase().startsWith('admin@');

      // If this Google account is an Admin, open Admin Dashboard!
      if (isUserAdmin && onAdminLoggedIn) {
        onAdminLoggedIn();
      }
    } catch (err) {
      if (!err.message?.includes('cancelled')) {
        setErrorMessage(err.message || 'Google sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto overscroll-contain">
      {/* Ambient background light sphere */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Centered Cyber Card with exact mobile 88dvh max-height */}
      <div className="relative w-full max-w-[430px] my-auto bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-6 z-10 max-h-[88dvh] flex flex-col overflow-hidden">
        
        {/* Glow Header Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

        {/* Header - Fixed shrink-0 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
              <img src="/logo.svg" alt="Map Tracking" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>
            <div className="truncate">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wider leading-tight truncate">
                MAP TRACKING
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-normal truncate">
                {lang === 'km' ? 'ប្រព័ន្ធតាមដានទីតាំងផ្ទាល់ ពេលវេលាពិត' : 'Live Real-time Location Tracking'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable without clipping */}
        <div className="overflow-y-auto mt-3 pr-1 flex-1 min-h-0 overscroll-contain space-y-3">
          {/* One-Click Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer border border-slate-200"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{lang === 'km' ? 'ចូលដោយប្រើគណនី Google (Gmail)' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-slate-800" />
              <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {lang === 'km' ? 'ឬប្រើ Email / Password' : 'or email & password'}
              </span>
              <div className="flex-1 border-t border-slate-800" />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                !isRegisterMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.login}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                isRegisterMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.register}</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {isRegisterMode && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={lang === 'km' ? 'ឈ្មោះពេញរបស់អ្នក...' : 'Your full name...'}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                {/* Avatar Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t.chooseAvatar}
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {PRESET_AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`relative w-9 h-9 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                          selectedAvatar === av
                            ? 'border-cyan-400 ring-2 ring-cyan-500/30 scale-105'
                            : 'border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={av} alt="avatar" className="w-full h-full object-cover" />
                        {selectedAvatar === av && (
                          <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  {t.email}
                </label>
                {(email.toLowerCase().includes('admin') || email.toLowerCase().startsWith('admin@')) && (
                  <span className="text-[10px] font-bold text-amber-400 animate-pulse flex items-center gap-1">
                    👑 {lang === 'km' ? 'ចូលជា Admin ស្វ័យប្រវត្ត' : 'Admin Access Detected'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@maptracking.com"
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition ${
                    (email.toLowerCase().includes('admin') || email.toLowerCase().startsWith('admin@'))
                      ? 'border-amber-500/80 focus:border-amber-400 ring-1 ring-amber-500/30'
                      : 'border-slate-700/80 focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>
                {loading 
                  ? (lang === 'km' ? 'កំពុងដំណើរការ...' : 'Processing...') 
                  : (isRegisterMode ? t.register : t.login)}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </form>
        </div>

        {/* Footer switch - Fixed shrink-0 */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-center shrink-0">
          <p className="text-xs text-slate-400">
            {isRegisterMode 
              ? (lang === 'km' ? 'មានគណនីរួចហើយ? ' : 'Already have an account? ')
              : (lang === 'km' ? 'មិនទាន់មានគណនី? ' : "Don't have an account? ")}
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage('');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition ml-1"
            >
              {isRegisterMode ? t.login : t.register}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
