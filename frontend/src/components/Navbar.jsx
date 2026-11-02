import React, { useState } from 'react';
import { 
  Navigation, 
  Share2, 
  ShieldAlert, 
  LogOut, 
  LogIn, 
  Radio, 
  Globe, 
  Menu, 
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';

export default function Navbar({ 
  onOpenShare, 
  onOpenAuth, 
  onToggleAdmin, 
  isAdminView, 
  lang, 
  setLang, 
  t 
}) {
  const { currentUser, logout, isAdmin } = useAuth();
  const { isSharing, toggleSharing } = useTracking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="h-16 w-full glass-panel border-b border-slate-700/60 flex items-center justify-between px-3 sm:px-6 z-30 shrink-0 relative">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-md shadow-cyan-500/20 border border-cyan-400/40 shrink-0">
          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-white transform -rotate-45" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
          </span>
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <h1 className="font-black text-sm sm:text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 truncate">
              MAP TRACKING
            </h1>
            <span className="hidden md:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              PRO
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden lg:block leading-none mt-0.5">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Center Actions (Desktop & Tablet) */}
      <div className="hidden sm:flex items-center gap-2.5">
        {/* Share Button (Desktop) */}
        <button
          onClick={onOpenShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Share2 className="w-3.5 h-3.5 animate-bounce" />
          <span>{t.shareLocation}</span>
        </button>

        {/* GPS Broadcast toggle */}
        <button
          onClick={() => toggleSharing(!isSharing)}
          title={isSharing ? t.stopSharing : t.startSharing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
            isSharing
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isSharing ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
          <span className="hidden md:inline">{isSharing ? t.sharingActive : t.sharingDisabled}</span>
        </button>

        {/* Admin Dashboard button: ONLY VISIBLE IF LOGGED IN AS ADMIN */}
        {isAdmin && (
          <button
            onClick={onToggleAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isAdminView
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-slate-800/80 text-amber-400 border-amber-500/30 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isAdminView ? t.liveMap : t.adminPanel}</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Language switch */}
        <button
          onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition active:scale-95"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'km' ? 'EN' : 'ខ្មែរ'}</span>
        </button>

        {/* User Account Button */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <div 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition active:scale-95"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-cyan-400/80 object-cover"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${isSharing ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </div>
              <span className="text-xs font-bold text-slate-200 max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline">
                {currentUser.displayName}
              </span>
            </div>

            <button
              onClick={logout}
              title={t.logout}
              className="hidden md:flex p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 border border-blue-400/30 transition active:scale-95 whitespace-nowrap"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t.login}</span>
          </button>
        )}

        {/* Mobile Drawer Menu Toggle (Only when user logged in) */}
        {currentUser && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex sm:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 active:scale-95"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Mobile Drawer Dropdown (Only shows user info, GPS toggle, and Admin if role is admin) */}
      {mobileMenuOpen && currentUser && (
        <div className="absolute top-16 left-0 w-full glass-dropdown border-b border-slate-700/80 p-4 space-y-3 z-40 sm:hidden animate-slideDown shadow-2xl">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/70 border border-slate-700">
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-11 h-11 rounded-xl border border-cyan-400 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
              {isAdmin && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase mt-1 inline-block">
                  👑 ADMIN
                </span>
              )}
            </div>
          </div>

          <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
            {/* Admin button ONLY for admin users */}
            {isAdmin && (
              <button
                onClick={() => {
                  onToggleAdmin();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  isAdminView
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-800/90 text-amber-400 border-amber-500/30'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isAdminView ? t.liveMap : t.adminPanel}</span>
              </button>
            )}

            <button
              onClick={() => {
                toggleSharing(!isSharing);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                isSharing
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{isSharing ? t.sharingActive : t.sharingDisabled}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
