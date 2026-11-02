import React, { useState, useEffect } from 'react';
import { Share2, Users, X, Heart, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TrackingProvider, useTracking } from './context/TrackingContext';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import ShareModal from './components/ShareModal';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import ActiveTrackersPanel from './components/ActiveTrackersPanel';
import HUDControls from './components/HUDControls';
import { translations } from './utils/i18n';

function MainApp() {
  const [lang, setLang] = useState('km'); // 'km' | 'en'
  const t = translations[lang] || translations.km;

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingSessionId, setPendingSessionId] = useState(null);

  const { currentUser } = useAuth();
  const { currentGroup, leaveGroup, joinGroup } = useTracking();

  const isDuo = currentGroup?.type === 'duo' || currentGroup?.groupId?.startsWith('DUO-');
  const membersCount = currentGroup?.members ? Object.keys(currentGroup.members).length : 0;

  // Handle URL share link detection (?duo=DUO-XXXX or ?group=GP-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duoId = params.get('duo');
    const groupId = params.get('group');
    const targetId = duoId || groupId;

    if (targetId) {
      if (currentUser) {
        joinGroup(targetId)
          .then(() => {
            setIsShareOpen(true);
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            alert(err.message || 'Error joining tracking session');
          });
      } else {
        // Not logged in: prompt user to sign in first, then auto join
        setPendingSessionId(targetId);
        setIsAuthOpen(true);
      }
    }
  }, [currentUser]);

  // When user successfully signs in after clicking invite link
  useEffect(() => {
    if (currentUser && pendingSessionId) {
      joinGroup(pendingSessionId)
        .then(() => {
          setIsShareOpen(true);
          setPendingSessionId(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          alert(err.message || 'Error joining tracking session');
          setPendingSessionId(null);
        });
    }
  }, [currentUser, pendingSessionId]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleClearSelected = () => {
    setSelectedUser(null);
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleAdmin={() => setIsAdminView(!isAdminView)}
        isAdminView={isAdminView}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      {/* Main Map Content Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <MapView
          selectedUserId={selectedUser?.uid}
          onSelectUser={handleSelectUser}
          lang={lang}
        />

        {/* Active Connected Friends List Panel */}
        <ActiveTrackersPanel
          selectedUserId={selectedUser?.uid}
          onSelectUser={handleSelectUser}
          onOpenShare={() => setIsShareOpen(true)}
          lang={lang}
          t={t}
        />

        {/* Active Group / Duo Banner Indicator (Top Center, perfectly centered between layer & tracker buttons) */}
        {currentGroup && (
          <div 
            onClick={() => setIsShareOpen(true)}
            className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl glass-panel shadow-2xl backdrop-blur-xl animate-fadeIn max-w-[calc(100vw-130px)] sm:max-w-md cursor-pointer transition ${
              isDuo
                ? 'border border-pink-500/60 hover:border-pink-400 shadow-pink-500/25 bg-slate-900/95'
                : 'border border-cyan-400/60 hover:border-cyan-300 shadow-cyan-500/25 bg-slate-900/95'
            }`}
          >
            {isDuo ? (
              <Heart className="w-3.5 h-3.5 text-pink-400 animate-bounce shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            )}

            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-[11px] sm:text-xs font-black text-white truncate">
                {isDuo ? (lang === 'km' ? 'DUO (២នាក់)' : 'DUO') : currentGroup.name}
              </span>
              <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-lg border shrink-0 ${
                isDuo 
                  ? 'bg-pink-950/90 text-pink-300 border-pink-500/40' 
                  : 'bg-slate-950 text-cyan-300 border-slate-700'
              }`}>
                {currentGroup.groupId} ({membersCount}/{currentGroup.maxMembers || (isDuo ? 2 : 50)})
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                leaveGroup();
              }}
              title={lang === 'km' ? 'ចាកចេញ' : 'Leave'}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition shrink-0 ml-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* HUD Overlay / Telemetry */}
        <HUDControls
          selectedUser={selectedUser}
          onClearSelected={handleClearSelected}
          onOpenShare={() => setIsShareOpen(true)}
          lang={lang}
          t={t}
        />

        {/* Mobile Floating Group/Share Button (Bottom Center, safely positioned without cutoff) */}
        <div className="sm:hidden absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto mb-[env(safe-area-inset-bottom,0px)]">
          <button
            onClick={() => setIsShareOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-white font-black text-xs shadow-2xl active:scale-95 transition whitespace-nowrap cursor-pointer border backdrop-blur-xl ${
              isDuo
                ? 'bg-gradient-to-r from-pink-500 via-rose-600 to-indigo-600 border-pink-400/50 shadow-pink-500/40'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 border-cyan-400/50 shadow-cyan-500/40'
            }`}
          >
            {isDuo ? <Heart className="w-3.5 h-3.5 text-white animate-bounce" /> : <Users className="w-3.5 h-3.5" />}
            <span className="truncate max-w-[130px]">
              {currentGroup 
                ? `${currentGroup.groupId} (${membersCount}/${currentGroup.maxMembers || (isDuo ? 2 : 50)})` 
                : (lang === 'km' ? 'ចែករំលែក ២នាក់' : 'Share Duo')}
            </span>
          </button>
        </div>

        {/* Admin Dashboard Overlay */}
        {isAdminView && (
          <AdminDashboard
            onClose={() => setIsAdminView(false)}
            onLocateUser={(user) => {
              setSelectedUser(user);
              setIsAdminView(false);
            }}
            lang={lang}
            t={t}
          />
        )}
      </main>

      {/* Group & Share Location Modal (with QR Code for 2-Person Duo & Group) */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
        lang={lang}
        t={t}
      />

      {/* Auth Modal (Login / Register / 1-Click Google Sign-in) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAdminLoggedIn={() => setIsAdminView(true)}
        lang={lang}
        t={t}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TrackingProvider>
        <MainApp />
      </TrackingProvider>
    </AuthProvider>
  );
}
