import { db } from '../config/firebaseAdmin.js';

export function setupLocationSockets(io) {
  io.on('connection', (socket) => {
    // Join room / Share link
    socket.on('join_room', async ({ roomId, user }) => {
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

    // Join Admin broadcast channel
    socket.on('join_admin_feed', () => {
      socket.join('admin_channel');
    });

    // Real-time location update event from client
    socket.on('send_location', async (payload) => {
      try {
        const { uid, location, isSharing, groupId } = payload;
        if (!uid || !location) return;

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

        // Broadcast to all clients on map
        io.emit('user_location_update', broadcastData);

        // If in a specific group, also emit to group room
        if (groupId) {
          io.to(`group_${groupId.toUpperCase()}`).emit('group_location_update', broadcastData);
        }

        // Also broadcast to admin channel
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

    socket.on('disconnect', () => {});
  });
}
