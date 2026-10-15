import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all dashboard endpoints
router.use(protect);

router.get('/stats', getDashboardStats);

export default router;
