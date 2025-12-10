import { Router } from 'express';
import authRoutes from './auth.routes';
import memberRoutes from './member.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);

// Future routes will be added here:
// router.use('/users', userRoutes);
// router.use('/attendance', attendanceRoutes);

export default router;
