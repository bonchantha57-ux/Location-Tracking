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
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { timeAgo, formatSpeed } from '../utils/geoUtils';

export default function AdminDashboard({ onClose, onLocateUser, lang = 'km', t }) {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSharing: 0,
    hiddenUsers: 0,
    adminCount: 0,
    isFirebase: false
  });
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Fetch from backend
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers()
      ]);
      setStats(statsData);
      setUsersList(usersData);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

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

  const filteredUsers = usersList.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'sharing') return matchesSearch && user.isSharing;
    if (statusFilter === 'hidden') return matchesSearch && !user.isSharing;
    return matchesSearch;
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
                BACKEND API
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {t.adminMapNotice}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-bold transition"
          >
            <X className="w-4 h-4" />
            <span>{lang === 'km' ? 'ត្រឡប់ទៅផែនទី' : 'Back to Map'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 my-4 sm:my-6">
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
          <div className="mt-1.5 text-[10px] text-blue-400/80 font-medium">
            ● {stats.adminCount} Admin
          </div>
        </div>

        {/* Active Sharing */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-300">{t.activeSharingUsers}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 animate-pulse">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-emerald-400">{stats.activeSharing}</span>
            <span className="text-xs text-emerald-300/80">{lang === 'km' ? 'កំពុងបើក GPS' : 'broadcasting'}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            {lang === 'km' ? 'អាចមើលឃើញលើផែនទី' : 'Visible on live map'}
          </div>
        </div>

        {/* Sharing Disabled */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400">{lang === 'km' ? 'បិទការចែករំលែក' : 'Sharing Hidden'}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Slash className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-slate-300">{stats.hiddenUsers}</span>
            <span className="text-xs text-slate-400">{lang === 'km' ? 'គណនី' : 'users'}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 font-medium">
            {lang === 'km' ? 'មិនបង្ហាញលើផែនទី' : 'Hidden from public'}
          </div>
        </div>

        {/* Database Status */}
        <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-cyan-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-cyan-300">Backend Database</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-base sm:text-xl font-black text-cyan-300">
              {stats.isFirebase ? 'Firebase Cloud' : 'Express Server'}
            </span>
          </div>
          <div className="mt-1.5 text-[10px] text-cyan-400/80 font-medium">
            ✓ Secure Backend .env Protected
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchUser}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'km' ? 'ទាំងអស់' : 'All'} ({usersList.length})
          </button>
          <button
            onClick={() => setStatusFilter('sharing')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              statusFilter === 'sharing' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {lang === 'km' ? 'កំពុងចែករំលែក' : 'Sharing'} ({stats.activeSharing})
          </button>
          <button
            onClick={() => setStatusFilter('hidden')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === 'hidden' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'km' ? 'បិទទីតាំង' : 'Hidden'} ({stats.hiddenUsers})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 sm:px-4">{t.fullName}</th>
                <th className="py-3 px-3 sm:px-4">{t.role}</th>
                <th className="py-3 px-3 sm:px-4">{t.status}</th>
                <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">{t.coordinates}</th>
                <th className="py-3 px-3 sm:px-4 hidden md:table-cell">{t.lastUpdated}</th>
                <th className="py-3 px-3 sm:px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    {lang === 'km' ? 'មិនទាន់មានគណនីក្នុងប្រព័ន្ធនៅឡើយទេ។ ចុះឈ្មោះដើម្បីបង្កើតគណនីដំបូង!' : 'No registered users in the database yet. Register to create the first account!'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-800/40 transition">
                    {/* User Profile */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                          alt={user.displayName}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-700 object-cover"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 text-xs truncate max-w-[110px] sm:max-w-none">
                            {user.displayName}
                            {user.uid === currentUser?.uid && (
                              <span className="ml-1 text-[9px] text-cyan-400 font-bold">(You)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[110px] sm:max-w-none">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3 sm:px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                        user.role === 'admin'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : 'User'}
                      </span>
                    </td>

                    {/* Sharing Status */}
                    <td className="py-3 px-3 sm:px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        user.isSharing
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isSharing ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                        <span className="hidden sm:inline">
                          {user.isSharing ? (lang === 'km' ? 'កំពុងចែករំលែក' : 'Sharing') : (lang === 'km' ? 'បានបិទ' : 'Hidden')}
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

                    {/* Action buttons */}
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.location?.lat && (
                          <button
                            onClick={() => {
                              onLocateUser(user);
                              onClose();
                            }}
                            title={lang === 'km' ? 'មើលទីតាំងលើផែនទី' : 'View on Map'}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleUserSharing(user)}
                          title={user.isSharing ? t.revokeSharing : t.startSharing}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
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
    </div>
  );
}
