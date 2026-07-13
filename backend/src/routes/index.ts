import { Router } from 'express';
import authRoutes from './auth';
import campaignRoutes from './campaigns';
import adRoutes from './ads';
import reviewRoutes from './reviews';
import rewardRoutes from './rewards';
import notificationRoutes from './notifications';
import redemptionRoutes from './redemption';
import analyticsRoutes from './analytics';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/ads', adRoutes);
router.use('/reviews', reviewRoutes);
router.use('/rewards', rewardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/redemption', redemptionRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
