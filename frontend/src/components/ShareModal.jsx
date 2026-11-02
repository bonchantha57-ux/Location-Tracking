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
  Radio
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';

export default function ShareModal({ isOpen, onClose, onOpenAuth, lang = 'km', t }) {
  const { currentUser } = useAuth();
  const { currentGroup, createGroup, joinGroup, leaveGroup } = useTracking();

  const [activeTab, setActiveTab] = useState('duo'); // 'duo' | 'join' | 'create'
  const [inputGroupId, setInputGroupId] = useState('');
  const [inputDuoId, setInputDuoId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [customGroupId, setCustomGroupId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle Create 2-Person Private Duo session
  const handleCreateDuo = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      await createGroup('Duo Tracking (២នាក់)', null, {
        type: 'duo',
        maxMembers: 2
      });
      // Stays open so user can immediately see and copy QR and Link!
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
      onClose();
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
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error joining group');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Multi-User Group
  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await createGroup(newGroupName.trim(), customGroupId.trim(), {
        type: 'group',
        maxMembers: 50
      });
      setNewGroupName('');
      setCustomGroupId('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error creating group');
    } finally {
      setLoading(false);
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

  const currentShareUrl = currentGroup 
    ? `${window.location.origin}${window.location.pathname}?${isDuo ? 'duo' : 'group'}=${currentGroup.groupId}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto overscroll-contain">
      {/* Background ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Centered Card with exact mobile 85dvh max-height */}
      <div className="relative w-full max-w-[460px] my-auto bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-6 z-10 max-h-[85dvh] flex flex-col overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-indigo-600" />

        {/* Header - Fixed shrink-0 */}
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
                {lang === 'km' ? 'ចែករំលែកទីតាំង (Live Tracking)' : 'Location Sharing Hub'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {lang === 'km' ? 'ផ្ញើ Link ឬ Scan QR ដើម្បីមើលគ្នាលើផែនទី' : 'Share Link or Scan QR to track together'}
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

        {/* Body content (scrollable with zero clipping) */}
        <div className="overflow-y-auto mt-3 pr-1 space-y-3.5 flex-1 min-h-0 overscroll-contain">
          {!currentUser ? (
            /* When NOT logged in: Prompt to sign in first */
            <div className="py-4 text-center space-y-3.5">
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
          ) : currentGroup ? (
            /* When ALREADY in an active Group or Duo Session: Display QR Code & Link */
            <div className="space-y-3">
              {/* Card Header Info */}
              <div className={`p-3 sm:p-4 rounded-2xl border relative overflow-hidden ${
                isDuo 
                  ? 'bg-gradient-to-br from-pink-950/40 via-slate-900 to-rose-950/30 border-pink-500/40' 
                  : 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/30 border-cyan-500/40'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isDuo 
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' 
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {isDuo ? '🔒 សម្រាប់តែ ២នាក់ (DUO PRIVATE)' : '👥 ក្រុម (ACTIVE GROUP)'}
                  </span>

                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-300">
                    {membersCount}/{currentGroup.maxMembers || (isDuo ? 2 : 50)} នាក់
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {currentGroup.name}
                </h3>

                {/* QR Code Presentation Box */}
                <div className="mt-2.5 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl">
                  <QRCodeSVG
                    value={currentShareUrl}
                    size={135}
                    level="H"
                    includeMargin={false}
                  />
                  <div className="mt-2 flex items-center gap-1.5 text-slate-900 text-[10px] sm:text-[11px] font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                    <span>{lang === 'km' ? 'ឱ្យដៃគូបើក Camera ទូរស័ព្ទ Scan QR នេះ' : 'Scan this QR code with phone camera'}</span>
                  </div>
                </div>

                {/* Direct Link Copy */}
                <div className="mt-2.5 flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-slate-950/90 border border-slate-700">
                  <input
                    type="text"
                    readOnly
                    value={currentShareUrl}
                    className="flex-1 bg-transparent text-[11px] font-mono text-cyan-300 truncate focus:outline-none pl-1"
                  />
                  <button
                    onClick={() => handleCopyLink(currentShareUrl)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
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
                <div className="mt-2 flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-slate-950/90 border border-slate-700">
                  <div className="flex items-center gap-1.5 pl-1 truncate">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{isDuo ? 'Duo ID:' : 'Group ID:'}</span>
                    <span className="font-mono text-xs font-black text-pink-300 tracking-wider truncate">
                      {currentGroup.groupId}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyId(currentGroup.groupId)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                      copiedId
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId ? 'បានចម្លង!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Connection Live Status between 2 users */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-800">
                  {membersCount < 2 ? (
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400 shrink-0" />
                      <span>{lang === 'km' ? 'កំពុងរង់ចាំដៃគូរបស់អ្នក Join... (១/២ នាក់)' : 'Waiting for partner to join... (1/2)'}</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>{lang === 'km' ? '🎉 បានភ្ជាប់ជោគជ័យ ២/២ នាក់! កំពុងមើលគ្នាផ្ទាល់' : '🎉 Connected 2/2! Live tracking active'}</span>
                      </div>

                      {/* 2 Avatars Visual Connected */}
                      <div className="flex items-center justify-center gap-2.5 py-1 bg-slate-950/60 rounded-xl p-2 border border-slate-800">
                        {membersList.slice(0, 2).map((m, idx) => (
                          <React.Fragment key={m.uid}>
                            <div className="flex items-center gap-2 truncate">
                              <img
                                src={m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.uid}`}
                                alt={m.displayName}
                                className="w-7 h-7 rounded-xl border border-cyan-400 object-cover shrink-0"
                              />
                              <div className="truncate text-left">
                                <p className="text-[11px] font-bold text-white truncate max-w-[75px]">{m.displayName}</p>
                                <span className="text-[9px] text-emerald-400 font-semibold">● Online</span>
                              </div>
                            </div>

                            {idx === 0 && (
                              <div className="flex flex-col items-center px-1 shrink-0">
                                <Heart className="w-3.5 h-3.5 text-pink-500 animate-bounce" />
                                <span className="text-[8px] font-mono text-cyan-300">DUO</span>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* End/Leave Button */}
              <button
                onClick={leaveGroup}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isDuo ? (lang === 'km' ? 'បញ្ចប់ការតាមដាន ២នាក់ (End Duo)' : 'End Duo Tracking') : (lang === 'km' ? 'ចាកចេញពី Group' : 'Leave Group')}</span>
              </button>
            </div>
          ) : (
            /* When Logged In & NOT in a Group: 3 Clean Tabs */
            <div>
              {/* 3 Tabs Segmented */}
              <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1 mb-3">
                <button
                  onClick={() => {
                    setActiveTab('duo');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                    activeTab === 'duo'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-3 h-3" />
                  <span>{lang === 'km' ? 'សម្រាប់តែ ២នាក់' : 'Duo (2 Only)'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('join');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                    activeTab === 'join'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  <span>{lang === 'km' ? 'ចូលតាម ID' : 'Join by ID'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('create');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                    activeTab === 'create'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>{lang === 'km' ? 'បង្កើត Group' : 'Create Group'}</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* TAB 1: 2-Person Private Sharing (Duo with QR & Link) */}
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
                        ? 'ប្រព័ន្ធនឹងបង្កើត QR Code និង Link ពិសេសសម្រាប់ផ្ញើទៅកាន់ដៃគូរបស់អ្នក (គូស្នេហ៍ ឬមិត្តភក្តិ) ដើម្បីមើលទីតាំងផ្ទាល់គ្នាទៅវិញទៅមកលើផែនទី!'
                        : 'Generates a private direct Link & QR Code to send to your partner (couple or close friend) to track each other live on the map!'}
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

              {/* TAB 2: Join Group by ID */}
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
                        placeholder="ឧ. GP-8492 ឬ TK1234"
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

              {/* TAB 3: Create Multi-User Group */}
              {activeTab === 'create' && (
                <form onSubmit={handleCreate} className="space-y-3">
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
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {lang === 'km' ? 'Group ID (ស្រេចចិត្ត - Optional)' : 'Custom Group ID (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={customGroupId}
                      onChange={(e) => setCustomGroupId(e.target.value.toUpperCase())}
                      placeholder="ឧ. KAMPOT-2026 (ទុកទទេដើម្បីបង្កើតស្វ័យប្រវត្ត)"
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono uppercase bg-slate-950 border border-slate-700/80 rounded-xl text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{loading ? 'កំពុងបង្កើត...' : (lang === 'km' ? 'បង្កើត Group ថ្មី' : 'Create New Group')}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
