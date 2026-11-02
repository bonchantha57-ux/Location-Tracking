import express from 'express';
import { 
  getAdminStats, 
  getAdminUsersList, 
  toggleUserSharingPermission 
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsersList);
router.patch('/users/:targetUid/sharing', toggleUserSharingPermission);

export default router;

