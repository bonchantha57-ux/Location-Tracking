import express from 'express';
import { 
  updateLocation, 
  toggleSharing, 
  getActiveUsers, 
  joinTrackingRoom,
  createGroupHandler,
  joinGroupHandler,
  getGroupHandler,
  leaveGroupHandler
} from '../controllers/locationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoints
router.get('/active-users', getActiveUsers);
router.get('/group/:groupId', getGroupHandler);

// Protected endpoints
router.post('/update', authenticateToken, updateLocation);
router.post('/toggle-sharing', authenticateToken, toggleSharing);
router.post('/join-room', authenticateToken, joinTrackingRoom);

// Group Management
router.post('/group/create', authenticateToken, createGroupHandler);
router.post('/group/join', authenticateToken, joinGroupHandler);
router.post('/group/leave', authenticateToken, leaveGroupHandler);

export default router;
