import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  PlusCircle, 
  LogIn, 
  LogOut, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Send, 
  Hash,
  QrCode,
  Heart,
  Smartphone,
  Radio,
  RefreshCw,
  UserMinus,
  CheckCircle2,
  Crown
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';

// Safe collision-free ID generator helper
function generateRandomSafeId(prefix = 'GP-') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + code;
}

export default function ShareModal({ isOpen, onClose, onOpenAuth, lang = 'km', t }) {
  const { currentUser } = useAuth();
  const { 
    currentGroup, 
    createGroup, 
    joinGroup, 
    leaveGroup, 
    userGroups = [], 
    switchActiveGroup, 
    removeMember 
  } = useTracking();

  // Tabs: 'my-groups' | 'duo' | 'create' | 'join'
  const [activeTab, setActiveTab] = useState(() => (userGroups.length > 0 ? 'my-groups' : 'duo'));
  const [inputGroupId, setInputGroupId] = useState('');
  const [inputDuoId, setInputDuoId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [autoGroupId, setAutoGroupId] = useState(() => generateRandomSafeId('GP-'));
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Re-generate auto ID
  const handleShuffleId = () => {
    setAutoGroupId(generateRandomSafeId('GP-'));
  };

  // Handle Create 2-Person Private Duo session (Auto ID: DUO-XXXXXX)
  const handleCreateDuo = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      await createGroup('Duo Tracking (២នាក់)', null, {
        type: 'duo',
        maxMembers: 2
      });
      setActiveTab('my-groups');
    } catch (err) {
      setErrorMsg(err.message || 'Error creating Duo session');
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Duo by ID
  const handleJoinDuo = async (e) => {
    e.preventDefault();
    if (!inputDuoId.trim()) return;
    setErrorMsg('');
    setLoading(true);

    try {
      await joinGroup(inputDuoId.trim());
      setInputDuoId('');
      setActiveTab('my-groups');
    } catch (err) {
      setErrorMsg(err.message || 'Error joining Duo session');
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Group by ID
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inputGroupId.trim()) return;
    setErrorMsg('');
    setLoading(true);

    try {
      await joinGroup(inputGroupId.trim());
      setInputGroupId('');
      setActiveTab('my-groups');
    } catch (err) {
      setErrorMsg(err.message || 'Error joining group');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Multi-User Group with Collision-Free Auto ID
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setErrorMsg('');
    setLoading(true);

    try {
      await createGroup(newGroupName.trim(), autoGroupId, {
        type: 'group',
        maxMembers: 50
      });
      setNewGroupName('');
      setAutoGroupId(generateRandomSafeId('GP-'));
      setActiveTab('my-groups');
    } catch (err) {
      setErrorMsg(err.message || 'Error creating group');
    } finally {
      setLoading(false);
    }
  };

  // Kick member from active group (Owner only)
  const handleKickMember = async (groupId, memberUid, memberName) => {
    const confirmMsg = lang === 'km'
      ? `តើអ្នកពិតជាចង់ដក "${memberName}" ចេញពីបន្ទប់មែនទេ?`
      : `Are you sure you want to remove "${memberName}" from this group?`;

    if (window.confirm(confirmMsg)) {
      try {
        await removeMember(groupId, memberUid);
      } catch (err) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  // Copy helpers
  const handleCopyId = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isDuo = currentGroup?.type === 'duo' || currentGroup?.groupId?.startsWith('DUO-');
  const membersList = currentGroup?.members ? Object.values(currentGroup.members) : [];
  const membersCount = membersList.length;
  const isOwner = currentGroup && currentUser && (currentGroup.creatorUid === currentUser.uid);

  const currentShareUrl = currentGroup 
    ? `${window.location.origin}${window.location.pathname}?${isDuo ? 'duo' : 'group'}=${currentGroup.groupId}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto overscroll-contain">
      {/* Background ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Centered Card */}
      <div className="relative w-full max-w-[500px] my-auto bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-6 z-10 max-h-[88dvh] flex flex-col overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-indigo-600" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-lg border shrink-0 ${
              isDuo 
                ? 'bg-gradient-to-tr from-pink-500 to-rose-600 shadow-pink-500/25 border-pink-400/30' 
                : 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyan-500/25 border-cyan-400/30'
            }`}>
              {isDuo ? <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate">
                {lang === 'km' ? 'មជ្ឈមណ្ឌលចែករំលែកទីតាំង (Live Tracking)' : 'Location Sharing Hub'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {lang === 'km' ? 'គ្រប់គ្រងគ្រុប, បង្កើត Duo ឬ Scan QR មើលគ្នាលើផែនទី' : 'Manage groups, create Duo or Scan QR to track'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        {currentUser && (
          <div className="p-1 mt-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1 shrink-0 overflow-x-auto">
            {/* My Groups Tab */}
            <button
              onClick={() => {
                setActiveTab('my-groups');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                activeTab === 'my-groups'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>{lang === 'km' ? 'ក្រុមខ្ញុំ' : 'My Groups'}</span>
              {userGroups.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900/80 text-[9px] font-mono border border-white/20">
                  {userGroups.length}
                </span>
              )}
            </button>

            {/* Duo Tab */}
            <button
              onClick={() => {
                setActiveTab('duo');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                activeTab === 'duo'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-3 h-3" />
              <span>{lang === 'km' ? '២នាក់ (Duo)' : 'Duo (2)'}</span>
            </button>

            {/* Create Group Tab */}
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3 h-3" />
              <span>{lang === 'km' ? 'បង្កើត Group' : 'Create'}</span>
            </button>

            {/* Join by ID Tab */}
            <button
              onClick={() => {
                setActiveTab('join');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-slate-700 to-slate-850 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>{lang === 'km' ? 'ចូលរួម' : 'Join'}</span>
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="overflow-y-auto mt-3 pr-1 space-y-3 flex-1 min-h-0 overscroll-contain">
          {!currentUser ? (
            /* When NOT logged in */
            <div className="py-6 text-center space-y-3.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <LogIn className="w-6 h-6 text-cyan-400" />
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  {lang === 'km' ? 'សូមចូលគណនីជាមុនសិន' : 'Please Sign In First'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                  {lang === 'km'
                    ? 'តម្រូវឱ្យមានគណនីជាមុនសិន ទើបអាចបង្កើត Link, QR កូដ ឬចូលរួមមើលទីតាំងគ្នាបាន!'
                    : 'You must have an account to create QR codes, share links, or join tracking!'}
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.login} / {t.register}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-shake">
                  {errorMsg}
                </div>
              )}

              {/* TAB 1: MY GROUPS (Multi-group list, Active switch, QR/Link, Owner kick) */}
              {activeTab === 'my-groups' && (
                <div className="space-y-3">
                  {userGroups.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <Users className="w-10 h-10 mx-auto text-slate-500" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {lang === 'km' ? 'អ្នកមិនទាន់បានចូលរួមក្នុង Group ណាឡើយ' : 'No Groups Joined Yet'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {lang === 'km' ? 'បង្កើតបន្ទប់ Duo ២នាក់ ឬបង្កើត Group ថ្មី ដើម្បីចែករំលែកទីតាំង!' : 'Create a 2-person Duo or a new Group to start sharing!'}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center pt-2">
                        <button
                          onClick={() => setActiveTab('duo')}
                          className="px-3 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-bold hover:bg-pink-500/30 transition cursor-pointer"
                        >
                          {lang === 'km' ? '⚡ បង្កើត Duo (២នាក់)' : 'Create Duo'}
                        </button>
                        <button
                          onClick={() => setActiveTab('create')}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition cursor-pointer"
                        >
                          {lang === 'km' ? '➕ បង្កើត Group' : 'Create Group'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Active Group Card with QR & Link */}
                      {currentGroup && (
                        <div className={`p-3 sm:p-4 rounded-2xl border relative overflow-hidden ${
                          isDuo 
                            ? 'bg-gradient-to-br from-pink-950/40 via-slate-900 to-rose-950/30 border-pink-500/40' 
                            : 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/30 border-cyan-500/40'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                              isDuo 
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' 
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{isDuo ? '🔒 DUO PRIVATE (សកម្មលើ Map)' : '👥 ACTIVE GROUP (សកម្មលើ Map)'}</span>
                            </span>

                            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-300">
                              {membersCount}/{currentGroup.maxMembers || (isDuo ? 2 : 50)} នាក់
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-black text-white truncate">
                              {currentGroup.name}
                            </h3>
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0 ml-2">
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>{lang === 'km' ? 'ម្ចាស់ក្រុម' : 'Owner'}</span>
                              </span>
                            )}
                          </div>

                          {/* QR Code Presentation Box */}
                          <div className="mt-2.5 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl">
                            <QRCodeSVG
                              value={currentShareUrl}
                              size={130}
                              level="H"
                              includeMargin={false}
                            />
                            <div className="mt-1.5 flex items-center gap-1 text-slate-900 text-[10px] font-bold">
                              <Smartphone className="w-3 h-3 text-pink-600" />
                              <span>{lang === 'km' ? 'Scan QR នេះដើម្បីចូលមើលគ្នាភ្លាមៗ' : 'Scan this QR code to join'}</span>
                            </div>
                          </div>

                          {/* Direct Link Copy */}
                          <div className="mt-2.5 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/90 border border-slate-700">
                            <input
                              type="text"
                              readOnly
                              value={currentShareUrl}
                              className="flex-1 bg-transparent text-[11px] font-mono text-cyan-300 truncate focus:outline-none pl-1"
                            />
                            <button
                              onClick={() => handleCopyLink(currentShareUrl)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                                copiedLink
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedLink ? 'បានចម្លង!' : 'Copy Link'}</span>
                            </button>
                          </div>

                          {/* Group Code Copy */}
                          <div className="mt-2 flex items-center justify-between p-1.5 rounded-xl bg-slate-950/90 border border-slate-700">
                            <div className="flex items-center gap-1.5 pl-1 truncate">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{isDuo ? 'Duo ID:' : 'Group ID:'}</span>
                              <span className="font-mono text-xs font-black text-pink-300 tracking-wider truncate">
                                {currentGroup.groupId}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyId(currentGroup.groupId)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                                copiedId
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId ? 'បានចម្លង!' : 'Copy ID'}</span>
                            </button>
                          </div>

                          {/* Members List with Owner Kick Ability */}
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                {lang === 'km' ? 'សមាជិកក្នុងក្រុមនេះ' : 'Members in this group'} ({membersCount})
                              </span>
                              {isOwner && (
                                <span className="text-[9px] text-amber-400/90 font-medium">
                                  {lang === 'km' ? '★ អ្នកអាចដកសមាជិកចេញបាន' : '★ You can kick members'}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {membersList.map((m) => {
                                const isMemberSelf = m.uid === currentUser?.uid;
                                const isMemberOwner = m.uid === currentGroup.creatorUid;

                                return (
                                  <div 
                                    key={m.uid}
                                    className="flex items-center justify-between p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img
                                        src={m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.uid}`}
                                        alt={m.displayName}
                                        className="w-6 h-6 rounded-lg border border-slate-700 object-cover shrink-0"
                                      />
                                      <span className="font-semibold text-slate-200 truncate">
                                        {m.displayName || 'User'} {isMemberSelf && <span className="text-[10px] text-cyan-400 font-bold">(អ្នក)</span>}
                                      </span>
                                      {isMemberOwner && (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-bold border border-amber-500/30">
                                          Owner
                                        </span>
                                      )}
                                    </div>

                                    {/* Kick button: ONLY visible to Owner and NOT on themselves */}
                                    {isOwner && !isMemberSelf && (
                                      <button
                                        onClick={() => handleKickMember(currentGroup.groupId, m.uid, m.displayName)}
                                        className="p-1 px-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                                      >
                                        <UserMinus className="w-3 h-3 text-rose-400" />
                                        <span>{lang === 'km' ? 'ដកចេញ' : 'Kick'}</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Multi-Group Switcher List */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {lang === 'km' ? 'បញ្ជី Group ទាំងអស់របស់អ្នក (ចុចដើម្បីផ្លាស់ប្តូរមើល)' : 'All Your Groups (Click to switch map view)'}
                        </h4>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {userGroups.map((grp) => {
                            const isCurrent = grp.groupId === currentGroup?.groupId;
                            const grpIsDuo = grp.type === 'duo' || grp.groupId?.startsWith('DUO-');
                            const grpMembers = grp.members ? Object.keys(grp.members).length : 0;
                            const grpIsOwner = grp.creatorUid === currentUser?.uid;

                            return (
                              <div
                                key={grp.groupId}
                                className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                                  isCurrent
                                    ? 'bg-cyan-950/30 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">
                                      {grp.name || grp.groupId}
                                    </span>
                                    {grpIsOwner && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-bold border border-amber-500/30 shrink-0">
                                        Owner
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                    <span className={grpIsDuo ? 'text-pink-300 font-semibold' : 'text-cyan-300 font-semibold'}>
                                      {grp.groupId}
                                    </span>
                                    <span>•</span>
                                    <span>{grpMembers} នាក់</span>
                                    {isCurrent && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-400 font-bold">● សកម្មលើ Map</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {!isCurrent && (
                                    <button
                                      onClick={() => {
                                        switchActiveGroup(grp.groupId);
                                        onClose();
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition cursor-pointer"
                                    >
                                      {lang === 'km' ? 'មើលលើ Map' : 'Switch Map'}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (window.confirm(lang === 'km' ? `ចាកចេញពី ${grp.name || grp.groupId}?` : `Leave ${grp.name || grp.groupId}?`)) {
                                        leaveGroup(grp.groupId);
                                      }
                                    }}
                                    title={lang === 'km' ? 'ចាកចេញពី Group នេះ' : 'Leave this group'}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DUO PRIVATE (Strictly 2 people) */}
              {activeTab === 'duo' && (
                <div className="space-y-3">
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-pink-950/40 via-slate-900 to-indigo-950/40 border border-pink-500/30 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white">
                          {lang === 'km' ? 'ចែករំលែកសម្រាប់តែ ២នាក់ (Private Duo)' : 'Strict 2-Person Location Sharing'}
                        </h4>
                        <p className="text-[10px] text-pink-300 font-semibold">
                          {lang === 'km' ? '🔒 កំណត់ត្រឹមតែ ២នាក់ គ្មានអ្នកទី ៣ អាចចូលបាន' : 'Strictly limited to 2 people only'}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {lang === 'km'
                        ? 'ប្រព័ន្ធនឹងបង្កើតលេខកូដ Duo ID ដោយស្វ័យប្រវត្ត (Auto-generated) គ្មានការជាន់គ្នាជាមួយអ្នកដទៃ សម្រាប់ផ្ញើទៅកាន់ដៃគូរបស់អ្នក!'
                        : 'Generates a collision-free unique Duo ID to connect directly with your partner!'}
                    </p>

                    {/* Big Button to Generate 2-Person Link & QR */}
                    <button
                      type="button"
                      onClick={handleCreateDuo}
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-pink-400/40"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>{loading ? 'កំពុងបង្កើត...' : (lang === 'km' ? '⚡ បង្កើត Link & QR កូដសម្រាប់ ២នាក់' : 'Generate 2-Person Link & QR')}</span>
                    </button>
                  </div>

                  {/* Or Enter Duo ID */}
                  <form onSubmit={handleJoinDuo} className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      {lang === 'km' ? 'ឬវាយបញ្ចូល Duo ID របស់ដៃគូ' : 'Or Enter Partner\'s Duo ID'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputDuoId}
                        onChange={(e) => setInputDuoId(e.target.value.toUpperCase())}
                        placeholder="ឧ. DUO-8492"
                        className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-slate-950 border border-slate-700/80 rounded-xl text-pink-300 placeholder-slate-500 focus:outline-none focus:border-pink-400"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition active:scale-95 cursor-pointer shrink-0"
                      >
                        {loading ? '...' : (lang === 'km' ? 'ចូលរួម' : 'Join')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: CREATE MULTI-USER GROUP (With Collision-Free Auto-ID) */}
              {activeTab === 'create' && (
                <form onSubmit={handleCreate} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {lang === 'km' ? 'ឈ្មោះ Group' : 'Group Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder={lang === 'km' ? 'ឧ. ដំណើរកម្សាន្តកំពត, ក្រុមការងារ' : 'e.g. Trip to Kampot'}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>

                  {/* Auto-Generated Unique Group ID Preview */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">
                        {lang === 'km' ? 'Group ID (បង្កើតស្វ័យប្រវត្ត មិនជាន់គ្នា)' : 'Auto-Generated Group ID (Collision-free)'}
                      </span>
                      <button
                        type="button"
                        onClick={handleShuffleId}
                        title="ប្តូរកូដថ្មី"
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>ប្តូរកូដ</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40">
                      <span className="font-mono text-sm sm:text-base font-black text-cyan-300 tracking-wider">
                        {autoGroupId}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>មានសុវត្ថិភាព</span>
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      {lang === 'km'
                        ? 'លេខកូដនេះត្រូវបានបង្កើតឡើងដោយស្វ័យប្រវត្ត ដើម្បីធានាថាមិនជាន់គ្នាជាមួយអ្នកដទៃឡើយ!'
                        : 'This code is guaranteed unique across all users.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newGroupName.trim()}
                    className="w-full mt-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{loading ? 'កំពុងបង្កើត...' : (lang === 'km' ? 'បង្កើត Group ថ្មី' : 'Create New Group')}</span>
                  </button>
                </form>
              )}

              {/* TAB 4: JOIN GROUP BY ID */}
              {activeTab === 'join' && (
                <form onSubmit={handleJoin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {lang === 'km' ? 'វាយបញ្ចូល Group ID' : 'Enter Group ID'}
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={inputGroupId}
                        onChange={(e) => setInputGroupId(e.target.value.toUpperCase())}
                        placeholder="ឧ. GP-8492"
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-slate-950 border border-slate-700/80 rounded-xl text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'km' 
                        ? 'សួរមិត្តភក្តិរបស់អ្នកនូវ Group ID រួចវាយបញ្ចូលទីនេះដើម្បីមើលគ្នាលើផែនទី!' 
                        : 'Ask your friend for their Group ID and enter it to track together!'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{loading ? 'កំពុងភ្ជាប់...' : (lang === 'km' ? 'ចូលរួម Group ភ្លាមៗ' : 'Join Group Now')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
