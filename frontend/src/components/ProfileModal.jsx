import React, { useState } from 'react';
import { 
  X, 
  User, 
  Check, 
  Sparkles, 
  Mail, 
  ShieldCheck, 
  Camera, 
  Save, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVATAR_SEEDS = [
  'felix', 'aneka', 'jack', 'sarah', 'alex', 
  'charlie', 'sam', 'jordan', 'taylor', 'morgan',
  'leo', 'oliver', 'luna', 'chloe', 'milo'
];

export default function ProfileModal({ isOpen, onClose, lang = 'km' }) {
  const { currentUser, updateProfile, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleShuffleAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    setSelectedAvatar(newAvatar);
  };

  const handleSelectPreset = (seed) => {
    setSelectedAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះគណនីរបស់អ្នក!' : 'Please enter your display name!');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await updateProfile(displayName.trim(), selectedAvatar);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto overscroll-contain">
      {/* Background ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Centered Card */}
      <div className="relative w-full max-w-[440px] my-auto bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-6 z-10 max-h-[90dvh] flex flex-col overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30 shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                {lang === 'km' ? 'កែប្រែព័ត៌មានគណនី (Profile)' : 'Edit Profile'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                {lang === 'km' ? 'ប្តូរឈ្មោះ និងរូប Avatar ដែលបង្ហាញលើ Map' : 'Update name and avatar shown on map'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto mt-4 space-y-4 flex-1 min-h-0 pr-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lang === 'km' ? 'បានរក្សាទុកដោយជោគជ័យ!' : 'Profile updated successfully!'}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="relative group">
              <img
                src={selectedAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                alt={displayName}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl border-2 border-cyan-400/80 object-cover shadow-xl shadow-cyan-500/20 bg-slate-900"
              />
              <button
                type="button"
                onClick={handleShuffleAvatar}
                title="ប្តូររូបភាពចៃដន្យ (Shuffle Avatar)"
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-white/20 hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="mt-2 text-[10px] text-slate-400 font-medium">
              {lang === 'km' ? 'ចុចប៊ូតុងខាងលើ ឬជ្រើសរើសរូបខាងក្រោម' : 'Shuffle or choose an avatar below'}
            </p>

            {/* Quick Avatar Presets */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto max-w-full pb-1 no-scrollbar">
              {AVATAR_SEEDS.slice(0, 7).map((seed) => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                const isSelected = selectedAvatar === url;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => handleSelectPreset(seed)}
                    className={`w-8 h-8 rounded-xl border p-0.5 transition shrink-0 cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-950/50'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                    }`}
                  >
                    <img src={url} alt={seed} className="w-full h-full object-cover rounded-lg" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {lang === 'km' ? 'ឈ្មោះគណនីរបស់អ្នក (Display Name)' : 'Display Name'} <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={lang === 'km' ? 'ឧ. Chantha Born, Mr. Dara' : 'e.g. John Doe'}
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
            <p className="text-[10px] text-cyan-300/80 mt-1">
              {lang === 'km'
                ? '★ ឈ្មោះនេះនឹងបង្ហាញផ្ទាល់នៅលើ Marker ផែនទី និងក្នុងបន្ទប់ Group!'
                : '★ This name will appear directly on your Map marker and in groups!'}
            </p>
          </div>

          {/* Email Info (Read-only) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              {lang === 'km' ? 'អ៊ីមែល (Email)' : 'Email Address'}
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 font-mono">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{currentUser.email}</span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold">
              {lang === 'km' ? 'តួនាទីគណនី' : 'Account Role'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            }`}>
              {isAdmin ? '👑 Administrator' : '👤 User'}
            </span>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

