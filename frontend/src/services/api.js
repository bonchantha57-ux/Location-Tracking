const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const DEFAULT_API = isLocal ? 'http://localhost:5000/api' : 'https://location-tracking-n6br.onrender.com/api';
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API).replace(/\/+$/, '');

function getAuthHeader() {
  const token = localStorage.getItem('MAP_TRACKING_JWT');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
  // Auth API
  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async googleAuth(googleData) {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google authentication failed');
    return data;
  },

  async firebaseAuth(firebaseData) {
    const res = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firebaseData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Firebase authentication failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) return null;
    return await res.json();
  },

  // Location API
  async updateLocation(locationData, isSharing = true) {
    const res = await fetch(`${API_BASE_URL}/location/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ ...locationData, isSharing })
    });
    return await res.json();
  },

  async toggleSharing(isSharing) {
    const res = await fetch(`${API_BASE_URL}/location/toggle-sharing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ isSharing })
    });
    return await res.json();
  },

  async getActiveUsers(groupId) {
    try {
      const url = groupId 
        ? `${API_BASE_URL}/location/active-users?groupId=${encodeURIComponent(groupId)}`
        : `${API_BASE_URL}/location/active-users`;
      const res = await fetch(url, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch (e) {
      return [];
    }
  },

  async joinRoom(roomId) {
    const res = await fetch(`${API_BASE_URL}/location/join-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ roomId })
    });
    return await res.json();
  },

  // Group APIs
  async createGroup(name, customId, options = {}) {
    const res = await fetch(`${API_BASE_URL}/location/group/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ name, customId, ...options })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create group');
    return data.group;
  },

  async joinGroup(groupId) {
    const res = await fetch(`${API_BASE_URL}/location/group/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ groupId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join group');
    return data.group;
  },

  async getGroup(groupId) {
    const res = await fetch(`${API_BASE_URL}/location/group/${groupId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch group');
    return data.group;
  },

  async getGroupTrails(groupId) {
    try {
      const res = await fetch(`${API_BASE_URL}/location/group/${groupId}/trails`);
      if (!res.ok) return {};
      const data = await res.json();
      return data.trails || {};
    } catch (e) {
      return {};
    }
  },

  async leaveGroup(groupId) {
    const res = await fetch(`${API_BASE_URL}/location/group/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ groupId })
    });
    return await res.json();
  },

  async getMyGroups() {
    try {
      const res = await fetch(`${API_BASE_URL}/location/my-groups`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.groups || [];
    } catch (e) {
      return [];
    }
  },

  async removeGroupMember(groupId, memberUid) {
    const res = await fetch(`${API_BASE_URL}/location/group/${groupId}/remove-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ memberUid })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove member');
    return data;
  },

  // Admin API
  async getAdminStats() {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin stats');
    return data.stats;
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin users');
    return data.users || [];
  },

  async getAdminGroups() {
    const res = await fetch(`${API_BASE_URL}/admin/groups`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin groups');
    return data.groups || [];
  },

  async revokeUserSharing(targetUid, isSharing) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${targetUid}/sharing`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ isSharing })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user sharing');
    return data.user;
  },

  async createAdminUser(userData) {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user');
    return data;
  },

  async updateAdminUser(targetUid, updates) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${targetUid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },

  async deleteAdminUser(targetUid) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${targetUid}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  }
};
