import { Router } from 'express';
import authRoutes from './auth';
import campaignRoutes from './campaigns';
import adRoutes from './ads';
import reviewRoutes from './reviews';
import rewardRoutes from './rewards';
import notificationRoutes from './notifications';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/ads', adRoutes);
router.use('/reviews', reviewRoutes);
router.use('/rewards', rewardRoutes);
router.use('/notifications', notificationRoutes);

export default router;
