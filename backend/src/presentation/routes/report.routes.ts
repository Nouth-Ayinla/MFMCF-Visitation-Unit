import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '@application/middleware/auth.middleware';
import { authorize } from '@application/middleware/authorize.middleware';

const router = Router();
const reportController = new ReportController();

// All routes require authentication and appropriate role
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/reports/members:
 *   get:
 *     tags: [Reports]
 *     summary: Generate member report
 *     description: Generate comprehensive member statistics report
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration end date
 *       - in: query
 *         name: levelId
 *         schema:
 *           type: string
 *         description: Filter by level ID
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *     responses:
 *       200:
 *         description: Member report generated successfully
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
 *                     totalFirstTimers:
 *                       type: number
 *                     byLevel:
 *                       type: array
 *                     byDepartment:
 *                       type: array
 *                     byGender:
 *                       type: array
 *                     recentRegistrations:
 *                       type: array
 */
router.get(
  '/members',
  authorize('admin', 'visitation_coordinator', 'assistant_coordinator', 'president'),
  reportController.getMemberReport.bind(reportController)
);

/**
 * @swagger
 * /api/v1/reports/attendance:
 *   get:
 *     tags: [Reports]
 *     summary: Generate attendance report
 *     description: Generate attendance statistics report for a date range
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *         description: Filter by specific member ID
 *     responses:
 *       200:
 *         description: Attendance report generated successfully
 *       400:
 *         description: Missing required parameters
 */
router.get(
  '/attendance',
  authorize('admin', 'visitation_coordinator', 'assistant_coordinator', 'president'),
  reportController.getAttendanceReport.bind(reportController)
);

/**
 * @swagger
 * /api/v1/reports/first-timers:
 *   get:
 *     tags: [Reports]
 *     summary: Generate first-timers report
 *     description: Generate first-timers statistics and follow-up report
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration end date
 *       - in: query
 *         name: contacted
 *         schema:
 *           type: boolean
 *         description: Filter by contacted status
 *     responses:
 *       200:
 *         description: First-timers report generated successfully
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
 *                     totalFirstTimers:
 *                       type: number
 *                     contacted:
 *                       type: number
 *                     notContacted:
 *                       type: number
 *                     promoted:
 *                       type: number
 *                     byMonth:
 *                       type: array
 *                     recentFirstTimers:
 *                       type: array
 */
router.get(
  '/first-timers',
  authorize('admin', 'visitation_coordinator', 'assistant_coordinator', 'president'),
  reportController.getFirstTimersReport.bind(reportController)
);

export default router;
