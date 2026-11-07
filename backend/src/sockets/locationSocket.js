import { db } from '../config/firebaseAdmin.js';

// Global Map of active online sockets (socket.id -> uid)
export const activeOnlineSockets = new Map();

export function getOnlineUids() {
  return new Set(Array.from(activeOnlineSockets.values()).filter(Boolean));
}

export function setupLocationSockets(io) {
  io.on('connection', (socket) => {
    // Identify client user
    socket.on('identify', ({ uid }) => {
      if (uid) {
        socket.userUid = String(uid);
        activeOnlineSockets.set(socket.id, String(uid));
      }
    });

    // Join room / Share link
    socket.on('join_room', async ({ roomId, user }) => {
      if (user?.uid) {
        socket.userUid = String(user.uid);
        activeOnlineSockets.set(socket.id, String(user.uid));
      }
      if (roomId) {
        socket.join(roomId);
        if (user) {
          await db.joinRoom(roomId, user);
          io.to(roomId).emit('user_joined_room', { roomId, user });
        }
      }
    });

    // Join Group by ID
    socket.on('join_group', async ({ groupId, user }) => {
      if (user?.uid) {
        socket.userUid = String(user.uid);
        activeOnlineSockets.set(socket.id, String(user.uid));
      }
      if (groupId && user) {
        const cleanId = groupId.toUpperCase().trim();
        socket.join(`group_${cleanId}`);
        io.to(`group_${cleanId}`).emit('group_member_joined', { groupId: cleanId, user });

        // Immediately sync existing historical movement trails to the newly joined member!
        try {
          const trails = await db.getGroupTrails(cleanId);
          socket.emit('group_trails_sync', { groupId: cleanId, trails });
        } catch (e) {
          console.warn("Could not sync trails on join_group:", e);
        }
      }
    });

    // Request group trails manually
    socket.on('get_group_trails', async ({ groupId }) => {
      if (groupId) {
        const cleanId = groupId.toUpperCase().trim();
        const trails = await db.getGroupTrails(cleanId);
        socket.emit('group_trails_sync', { groupId: cleanId, trails });
      }
    });

    socket.on('leave_group', ({ groupId, uid }) => {
      if (groupId) {
        const cleanId = groupId.toUpperCase().trim();
        socket.leave(`group_${cleanId}`);
        io.to(`group_${cleanId}`).emit('group_member_left', { groupId: cleanId, uid });
      }
    });

    // Group owner or admin kicks a member
    socket.on('remove_group_member', async ({ groupId, memberUid, requesterUid, requesterRole }) => {
      if (groupId && memberUid) {
        const cleanId = groupId.toUpperCase().trim();
        try {
          await db.removeGroupMember(cleanId, memberUid, requesterUid, requesterRole);
          io.to(`group_${cleanId}`).emit('group_member_removed', { groupId: cleanId, memberUid });
        } catch (e) {
          console.warn("Socket remove_group_member error:", e.message);
        }
      }
    });

    // Join Admin broadcast channel
    socket.on('join_admin_feed', () => {
      socket.join('admin_channel');
    });

    // Real-time location update event from client
    socket.on('send_location', async (payload) => {
      try {
        const { uid, location, isSharing, groupId } = payload;
        if (!uid || !location) return;

        socket.userUid = String(uid);
        activeOnlineSockets.set(socket.id, String(uid));

        // Persist to DB
        await db.updateUserLocation(uid, location, isSharing);

        // If user is in a group and is actively sharing, record movement trail point!
        let recordedPoint = null;
        if (groupId && isSharing) {
          const cleanGroupId = groupId.toUpperCase().trim();
          recordedPoint = await db.recordGroupTrailPoint(cleanGroupId, uid, location);
          if (recordedPoint) {
            // Real-time trail point broadcast to all members in this group
            io.to(`group_${cleanGroupId}`).emit('group_trail_point', {
              groupId: cleanGroupId,
              uid,
              point: recordedPoint
            });
          }
        }

        const broadcastData = {
          uid,
          location: {
            ...location,
            updatedAt: Date.now()
          },
          isSharing,
          groupId
        };

        // 1. If user is in a group and is sharing: emit ONLY to members of that specific group!
        if (groupId && isSharing) {
          io.to(`group_${groupId.toUpperCase()}`).emit('group_location_update', broadcastData);
        }

        // 2. Admin channel receives all location updates (God-view)
        io.to('admin_channel').emit('user_location_update', broadcastData);
        io.to('admin_channel').emit('admin_user_update', broadcastData);
      } catch (err) {
        console.error("Socket send_location error:", err);
      }
    });

    // Client sharing toggle
    socket.on('toggle_sharing', async ({ uid, isSharing }) => {
      if (!uid) return;
      await db.toggleUserSharing(uid, isSharing);
      io.emit('user_sharing_toggled', { uid, isSharing });
    });

    socket.on('disconnect', () => {
      activeOnlineSockets.delete(socket.id);
    });
  });
}
