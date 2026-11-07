import express from 'express';
import { 
  getAdminStats, 
  getAdminUsersList, 
  getAdminGroupsList,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  toggleUserSharingPermission 
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsersList);
router.get('/groups', getAdminGroupsList);
router.post('/users', createAdminUser);
router.put('/users/:targetUid', updateAdminUser);
router.delete('/users/:targetUid', deleteAdminUser);
router.patch('/users/:targetUid/sharing', toggleUserSharingPermission);

export default router;

