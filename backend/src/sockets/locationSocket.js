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
