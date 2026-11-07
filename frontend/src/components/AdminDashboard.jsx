import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Radio, 
  MapPin, 
  Search, 
  X, 
  Clock, 
  Slash, 
  Eye,
  RefreshCw,
  PlusCircle,
  Edit,
  Trash2,
  Key,
  Mail,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Globe,
  Heart,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import { api } from '../services/api';
import { timeAgo, formatSpeed } from '../utils/geoUtils';

export default function AdminDashboard({ onClose, onLocateUser, lang = 'km', t }) {
  const { currentUser } = useAuth();
  const { switchActiveGroup, joinGroup } = useTracking();

  const [activeAdminTab, setActiveAdminTab] = useState('users'); // 'users' | 'groups'
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    activeSharing: 0,
    hiddenUsers: 0,
    adminCount: 0,
    totalGroups: 0,
    isFirebase: false
  });
  const [usersList, setUsersList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'sharing' | 'hidden'
  const [loading, setLoading] = useState(true);

  // User Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetUid, setTargetUid] = useState(null);
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch real data directly from backend (connected to Firestore)
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, groupsData] = await Promise.all([
        api.getAdminStats().catch(() => ({})),
        api.getAdminUsers().catch(() => []),
        api.getAdminGroups().catch(() => [])
      ]);

      setStats({
        ...statsData,
        totalGroups: groupsData.length || statsData.totalGroups || 0
      });
      setUsersList(Array.isArray(usersData) ? usersData : []);
      setGroupsList(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Open Create User Modal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setTargetUid(null);
    setFormDisplayName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormError('');
    setModalOpen(true);
  };

  // Open Edit User Modal
  const handleOpenEditModal = (user) => {
    setIsEditing(true);
    setTargetUid(user.uid);
    setFormDisplayName(user.displayName || '');
    setFormEmail(user.email || '');
    setFormPassword(''); // Leave blank if not changing
    setFormRole(user.role || 'user');
    setFormError('');
    setModalOpen(true);
  };

  // Submit Create or Edit User
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (isEditing) {
        const updates = {
          displayName: formDisplayName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole
        };
        if (formPassword.trim()) {
          if (formPassword.trim().length < 6) {
            throw new Error(lang === 'km' ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួ' : 'Password must be at least 6 characters');
          }
          updates.password = formPassword.trim();
        }

        await api.updateAdminUser(targetUid, updates);
      } else {
        if (!formPassword.trim() || formPassword.trim().length < 6) {
          throw new Error(lang === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់យ៉ាងតិច ៦ តួ' : 'Password must be at least 6 characters');
        }
        await api.createAdminUser({
          displayName: formDisplayName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword.trim(),
          role: formRole
        });
      }

      setModalOpen(false);
      await fetchAdminData();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (user.uid === currentUser?.uid) {
      alert(lang === 'km' ? 'អ្នកមិនអាចលុបគណនី Admin ផ្ទាល់ខ្លួនបានទេ!' : 'You cannot delete your own admin account!');
      return;
    }

    const confirmMsg = lang === 'km'
      ? `តើអ្នកពិតជាចង់លុបគណនី "${user.displayName || user.email}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានឡើយ!`
      : `Are you sure you want to delete user "${user.displayName || user.email}"? This action cannot be undone!`;

    if (window.confirm(confirmMsg)) {
      try {
        await api.deleteAdminUser(user.uid);
        await fetchAdminData();
      } catch (err) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  // Toggle Sharing Permission
  const handleToggleUserSharing = async (user) => {
    try {
      const newStatus = !user.isSharing;
      await api.revokeUserSharing(user.uid, newStatus);
      setUsersList(prev => prev.map(u => u.uid === user.uid ? { ...u, isSharing: newStatus } : u));
      setStats(prev => ({
        ...prev,
        activeSharing: newStatus ? prev.activeSharing + 1 : prev.activeSharing - 1,
        hiddenUsers: newStatus ? prev.hiddenUsers - 1 : prev.hiddenUsers + 1
      }));
    } catch (e) {
      alert("Error updating user status: " + e.message);
    }
  };

  // Admin Switch to View Group on Map
  const handleViewGroupOnMap = async (group) => {
    try {
      await joinGroup(group.groupId);
    } catch (e) {
      switchActiveGroup(group.groupId);
    }
    onClose();
  };

  // Filter users
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'online') return matchesSearch && user.isOnline;
    if (statusFilter === 'sharing') return matchesSearch && user.isSharing;
    if (statusFilter === 'hidden') return matchesSearch && !user.isSharing;
    return matchesSearch;
  });

  // Filter groups
  const filteredGroups = groupsList.filter(group => {
    return (
      group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.groupId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.creatorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col p-3 sm:p-6 lg:p-8 overflow-y-auto animate-fadeIn safe-pb">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-white tracking-wide font-khmer-title">
                {t.adminPanel}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 uppercase">
                FIRESTORE LIVE API
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {lang === 'km' 
                ? 'ទាញទិន្នន័យផ្ទាល់ពី Cloud Database: មើលអ្នក Online, បង្កើត/កែប្រែ User, ពិនិត្យ Groups ទាំងអស់ និងមើលទីតាំងផ្ទាល់' 
                : 'Direct cloud sync: Monitor live online users, CRUD accounts, monitor all groups, and locate live on map.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Add New User Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 border border-cyan-400/40 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.createUser || (lang === 'km' ? 'បង្កើត User ថ្មី' : 'New User')}</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={fetchAdminData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Close / Back to Map */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{lang === 'km' ? 'ត្រឡប់ទៅផែនទី' : 'Back to Map'}</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 my-4 sm:my-6 shrink-0">
        {/* Total Accounts */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400">{t.totalAccounts}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-white">{stats.totalUsers}</span>
            <span className="text-xs text-slate-400">{lang === 'km' ? 'គណនី' : 'users'}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-blue-400 font-medium">
            ● {stats.adminCount} Admin ក្នុងប្រព័ន្ធ
          </div>
        </div>

        {/* Total Online Users */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-emerald-500/40 relative overflow-hidden bg-gradient-to-br from-emerald-950/20 to-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-300">
              {t.onlineUsers || (lang === 'km' ? 'អ្នកកំពុង Online' : 'Online Users')}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 animate-pulse">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-emerald-400">{stats.onlineUsers || 0}</span>
            <span className="text-xs text-emerald-300/80">{lang === 'km' ? 'នាក់កំពុង Online' : 'online now'}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-emerald-400/90 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{lang === 'km' ? 'ភ្ជាប់ WebSocket ផ្ទាល់' : 'Live WebSocket Stream'}</span>
          </div>
        </div>

        {/* Active GPS Sharing */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-cyan-300">{t.activeSharingUsers}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-cyan-300">{stats.activeSharing}</span>
            <span className="text-xs text-cyan-200/80">{lang === 'km' ? 'កំពុងបើក GPS' : 'GPS Active'}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-cyan-400/80 font-medium">
            ● {lang === 'km' ? 'អាចមើលទីតាំងលើផែនទី' : 'Visible on live map'}
          </div>
        </div>

        {/* Total Groups & Duos Created */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-purple-500/30 relative overflow-hidden bg-gradient-to-br from-purple-950/20 to-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-purple-300">
              {lang === 'km' ? 'ក្រុម & Duo ទាំងអស់' : 'Total Groups & Duos'}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-purple-300">
              {stats.totalGroups || groupsList.length}
            </span>
            <span className="text-xs text-purple-300/80">{lang === 'km' ? 'ក្រុមបង្កើតឡើង' : 'created'}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-purple-400/90 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>{lang === 'km' ? 'Admin អាចមើល Groups ទាំងអស់បាន' : 'Full visibility for Admin'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Header: Users vs Groups */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'km' ? 'គណនីទាំងអស់ (Users)' : 'All Accounts'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-900/30 text-[10px] font-mono">
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('groups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeAdminTab === 'groups'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
              : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'km' ? 'ក្រុមទាំងអស់ (Groups & Duos)' : 'All Groups & Duos'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-900/30 text-[10px] font-mono">
            {groupsList.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeAdminTab === 'users' ? t.searchUser : (lang === 'km' ? 'ស្វែងរក Group ឬ អ្នកបង្កើត...' : 'Search group or creator...')}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filters (Only for users tab) */}
        {activeAdminTab === 'users' && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'all' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'km' ? 'ទាំងអស់' : 'All'} ({usersList.length})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === 'online' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-emerald-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {lang === 'km' ? 'Online ផ្ទាល់' : 'Online'} ({stats.onlineUsers || 0})
            </button>
            <button
              onClick={() => setStatusFilter('sharing')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === 'sharing' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-cyan-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {lang === 'km' ? 'បើក GPS' : 'Sharing'} ({stats.activeSharing})
            </button>
            <button
              onClick={() => setStatusFilter('hidden')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'hidden' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'km' ? 'បិទ GPS' : 'Hidden'} ({stats.hiddenUsers})
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Users Table vs Groups Table */}
      {activeAdminTab === 'users' ? (
        /* Users Table */
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/95 sticky top-0 z-10 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 sm:px-4">{t.fullName}</th>
                  <th className="py-3 px-3 sm:px-4">{t.role}</th>
                  <th className="py-3 px-3 sm:px-4">{lang === 'km' ? 'ការតភ្ជាប់' : 'Online'}</th>
                  <th className="py-3 px-3 sm:px-4">{t.status}</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">{t.coordinates}</th>
                  <th className="py-3 px-3 sm:px-4 hidden md:table-cell">{t.lastUpdated}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      {lang === 'km' ? 'មិនទាន់មានគណនីក្នុងប្រព័ន្ធនៅឡើយទេ។ ចុច "បង្កើត User ថ្មី" ដើម្បីបង្កើត!' : 'No registered users in the database yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-800/40 transition">
                      {/* User Profile */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                              alt={user.displayName}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-700 object-cover"
                            />
                            {user.isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 text-xs truncate max-w-[120px] sm:max-w-none flex items-center gap-1.5">
                              <span>{user.displayName || 'No Name'}</span>
                              {user.uid === currentUser?.uid && (
                                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-none font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                          user.role === 'admin' || user.email?.toLowerCase().includes('admin')
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {user.role === 'admin' || user.email?.toLowerCase().includes('admin') ? '👑 Admin' : 'User'}
                        </span>
                      </td>

                      {/* Online Status */}
                      <td className="py-3 px-3 sm:px-4">
                        {user.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>Online</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            <span>Offline</span>
                          </span>
                        )}
                      </td>

                      {/* Sharing Status */}
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          user.isSharing
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isSharing ? 'bg-cyan-400' : 'bg-rose-400'}`}></span>
                          <span className="hidden sm:inline">
                            {user.isSharing ? (lang === 'km' ? 'GPS បើក' : 'GPS ON') : (lang === 'km' ? 'GPS បិទ' : 'GPS OFF')}
                          </span>
                        </span>
                      </td>

                      {/* Location Coordinates & Speed */}
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                        {user.location?.lat ? (
                          <div>
                            <div className="font-mono text-[11px] text-cyan-300">
                              {user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{formatSpeed(user.location.speed)}</span>
                              <span>&plusmn;{user.location.accuracy || 10}m</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">{lang === 'km' ? 'គ្មានទិន្នន័យ GPS' : 'No GPS Data'}</span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{timeAgo(user.location?.updatedAt || user.lastSeen, lang)}</span>
                        </div>
                      </td>

                      {/* Action buttons (View Location, Edit, Delete, Toggle Sharing) */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 📍 View Live Location on Map */}
                          {user.location?.lat ? (
                            <button
                              onClick={() => {
                                onLocateUser(user);
                                onClose();
                              }}
                              title={lang === 'km' ? 'មើលទីតាំងលើផែនទី' : 'View on Map'}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="hidden sm:inline">{lang === 'km' ? 'មើលទីតាំង' : 'Locate'}</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              title="No GPS location yet"
                              className="px-2 py-1 rounded-lg bg-slate-800/50 text-slate-600 border border-slate-800 text-[10px] cursor-not-allowed"
                            >
                              <MapPin className="w-3.5 h-3.5 text-slate-600 inline" />
                            </button>
                          )}

                          {/* ✏️ Edit User */}
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            title={t.editUser || 'Edit User'}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-95 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* 🗑️ Delete User */}
                          {user.uid !== currentUser?.uid && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              title={t.deleteUser || 'Delete User'}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* GPS Sharing Toggle */}
                          <button
                            onClick={() => handleToggleUserSharing(user)}
                            title={user.isSharing ? t.revokeSharing : t.startSharing}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              user.isSharing
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {user.isSharing 
                              ? (lang === 'km' ? 'ដកសិទ្ធិ' : 'Revoke') 
                              : (lang === 'km' ? 'អនុញ្ញាត' : 'Allow')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Groups & Duos Table for Admin */
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/95 sticky top-0 z-10 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 sm:px-4">{lang === 'km' ? 'ឈ្មោះ & ID ក្រុម' : 'Group Name & ID'}</th>
                  <th className="py-3 px-3 sm:px-4">{lang === 'km' ? 'ប្រភេទ' : 'Type'}</th>
                  <th className="py-3 px-3 sm:px-4">{lang === 'km' ? 'អ្នកបង្កើត (Creator)' : 'Creator'}</th>
                  <th className="py-3 px-3 sm:px-4">{lang === 'km' ? 'ចំនួនសមាជិក' : 'Members'}</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">{lang === 'km' ? 'កាលបរិច្ឆេទបង្កើត' : 'Created At'}</th>
                  <th className="py-3 px-3 sm:px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      {lang === 'km' ? 'មិនទាន់មាន Group ឬ Duo ណាត្រូវបានបង្កើតឡើងនៅឡើយទេ។' : 'No groups or duo sessions created yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => {
                    const isGroupDuo = group.type === 'duo' || group.groupId?.startsWith('DUO-');
                    const members = group.members ? Object.values(group.members) : [];
                    const memberCount = members.length;

                    return (
                      <tr key={group.groupId} className="hover:bg-slate-800/40 transition">
                        {/* Group Name & ID */}
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl border shrink-0 ${
                              isGroupDuo 
                                ? 'bg-pink-500/15 text-pink-400 border-pink-500/30' 
                                : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            }`}>
                              {isGroupDuo ? <Heart className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs truncate max-w-[150px] sm:max-w-none">
                                {group.name || group.groupId}
                              </div>
                              <div className="font-mono text-[10px] text-cyan-300">
                                {group.groupId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3 sm:px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                            isGroupDuo
                              ? 'bg-pink-500/15 text-pink-300 border-pink-500/40'
                              : 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                          }`}>
                            {isGroupDuo ? '🔒 Duo (២នាក់)' : '👥 Multi-User Group'}
                          </span>
                        </td>

                        {/* Creator */}
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-300 text-xs">
                              {group.creatorName || 'User'}
                            </span>
                          </div>
                        </td>

                        {/* Members count & preview */}
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white">
                              {memberCount}/{group.maxMembers || (isGroupDuo ? 2 : 50)}
                            </span>
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {members.slice(0, 3).map((m) => (
                                <img
                                  key={m.uid}
                                  src={m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.uid}`}
                                  alt={m.displayName}
                                  title={m.displayName}
                                  className="w-5 h-5 rounded-full border border-slate-900 object-cover"
                                />
                              ))}
                              {memberCount > 3 && (
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-[8px] font-bold text-slate-300 flex items-center justify-center border border-slate-900">
                                  +{memberCount - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{timeAgo(group.createdAt, lang)}</span>
                          </div>
                        </td>

                        {/* Action: View Group on Map */}
                        <td className="py-3 px-3 sm:px-4 text-right">
                          <button
                            onClick={() => handleViewGroupOnMap(group)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{lang === 'km' ? 'មើលលើ Map' : 'View on Map'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {isEditing ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                </div>
                <h3 className="text-base font-bold text-white">
                  {isEditing 
                    ? (lang === 'km' ? 'កែប្រែព័ត៌មានគណនី' : 'Edit User Account')
                    : (lang === 'km' ? 'បង្កើតគណនី User ថ្មី' : 'Create New User Account')}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUser} className="space-y-3.5 mt-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t.fullName}
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="e.g. Chantha Born"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t.password} {isEditing && <span className="text-[10px] text-slate-500 font-normal">({lang === 'km' ? 'ទុកទទេបើមិនប្តូរ' : 'Leave empty to keep'})</span>}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required={!isEditing}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t.role}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('user')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      formRole === 'user'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    👤 User ធម្មតា
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      formRole === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    👑 Admin គ្រប់គ្រង
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting 
                    ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') 
                    : (isEditing ? (lang === 'km' ? 'កែប្រែ' : 'Update') : (lang === 'km' ? 'បង្កើត' : 'Create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
