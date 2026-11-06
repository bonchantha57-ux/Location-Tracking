import express from 'express';
import { register, login, getMe, googleAuth } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/firebase-login', googleAuth);
router.get('/me', authenticateToken, getMe);

export default router;
