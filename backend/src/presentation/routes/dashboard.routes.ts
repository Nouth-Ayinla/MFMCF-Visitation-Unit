import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '@application/middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     description: Retrieve overall statistics including total members, first-timers, and attendance rate
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMembers:
 *                       type: number
 *                       example: 150
 *                     totalFirstTimers:
 *                       type: number
 *                       example: 25
 *                     totalAttendanceThisMonth:
 *                       type: number
 *                       example: 450
 *                     attendanceRate:
 *                       type: number
 *                       example: 85
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', dashboardController.getStats.bind(dashboardController));

/**
 * @swagger
 * /api/v1/dashboard/attendance-trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get attendance trends
 *     description: Retrieve attendance trends for the specified number of days
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *           minimum: 1
 *           maximum: 90
 *         description: Number of days to retrieve trends for
 *     responses:
 *       200:
 *         description: Attendance trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: '2025-12-03'
 *                       count:
 *                         type: number
 *                         example: 95
 *       400:
 *         description: Invalid days parameter
 */
router.get('/attendance-trends', dashboardController.getAttendanceTrends.bind(dashboardController));

/**
 * @swagger
 * /api/v1/dashboard/level-distribution:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get level distribution
 *     description: Retrieve member distribution across different levels
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Level distribution data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                         example: '100'
 *                       count:
 *                         type: number
 *                         example: 45
 *       401:
 *         description: Unauthorized
 */
router.get('/level-distribution', dashboardController.getLevelDistribution.bind(dashboardController));

/**
 * @swagger
 * /api/v1/dashboard/recent-activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activity
 *     description: Retrieve recent member registration activity
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of activities to retrieve
 *     responses:
 *       200:
 *         description: Recent activity data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: 'New Member'
 *                       name:
 *                         type: string
 *                         example: 'John Smith'
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid limit parameter
 */
router.get('/recent-activity', dashboardController.getRecentActivity.bind(dashboardController));

/**
 * @swagger
 * /api/v1/dashboard/birthdays:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get upcoming birthdays
 *     description: Retrieve upcoming member birthdays within the specified number of days
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *           minimum: 1
 *           maximum: 60
 *         description: Number of days to look ahead for birthdays
 *     responses:
 *       200:
 *         description: Upcoming birthdays data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       memberId:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                         example: 'John Smith'
 *                       dateOfBirth:
 *                         type: string
 *                         example: '12-15'
 *                       daysUntil:
 *                         type: number
 *                         example: 5
 *       400:
 *         description: Invalid days parameter
 */
router.get('/birthdays', dashboardController.getUpcomingBirthdays.bind(dashboardController));

export default router;
