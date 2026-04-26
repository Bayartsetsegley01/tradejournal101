import express from 'express';
import { authenticateToken } from '../utils/authMiddleware.js';
import { requireAdmin } from '../utils/adminMiddleware.js';
import {
  getDashboardStats,
  getUsers, updateUserStatus, deleteUser,
  getFeedback, updateFeedbackStatus, deleteFeedback,
  getConfig, updateConfig,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getDashboardStats);

router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

router.get('/feedback', getFeedback);
router.patch('/feedback/:id/status', updateFeedbackStatus);
router.delete('/feedback/:id', deleteFeedback);

router.get('/config', getConfig);
router.put('/config', updateConfig);

export default router;
