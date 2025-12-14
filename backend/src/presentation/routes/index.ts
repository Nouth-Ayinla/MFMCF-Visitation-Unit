import { Router } from 'express';
import authRoutes from './auth.routes';
import memberRoutes from './member.routes';
import organizationRoutes from './organization.routes';
import attendanceRoutes from './attendance.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import birthdayRoutes from './birthday.routes';
import smsRoutes from './sms.routes';
import reportRoutes from './report.routes';
import settingRoutes from './setting.routes';
import activityLogRoutes from './activityLog.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/birthdays', birthdayRoutes);
router.use('/sms', smsRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/', organizationRoutes);

export default router;
