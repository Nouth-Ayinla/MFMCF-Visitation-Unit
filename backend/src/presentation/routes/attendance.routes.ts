import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticateToken } from '@application/middleware/auth.middleware';

const router = Router();
const attendanceController = new AttendanceController();

/**
 * @swagger
 * /api/v1/attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark attendance for multiple members
 *     description: Record attendance for one or more members (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberIds
 *               - attendanceDate
 *             properties:
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
 *                 description: Array of member IDs
 *               attendanceDate:
 *                 type: string
 *                 format: date
 *                 example: '2025-12-10'
 *                 description: Date in YYYY-MM-DD format
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 marked:
 *                   type: number
 *                   description: Number of attendances successfully marked
 *                 duplicates:
 *                   type: number
 *                   description: Number of duplicate entries skipped
 *                 invalid:
 *                   type: number
 *                   description: Number of invalid member IDs
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateToken,
  attendanceController.markAttendance.bind(attendanceController)
);

/**
 * @swagger
 * /api/v1/attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance records by date
 *     description: Retrieve all attendance records for a specific date
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: '2025-12-10'
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: List of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendance:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 *       400:
 *         description: Date parameter is required
 */
router.get(
  '/',
  attendanceController.getAttendanceByDate.bind(attendanceController)
);

/**
 * @swagger
 * /api/v1/attendance/stats:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance statistics for a date
 *     description: Retrieve attendance statistics including count, rate, total members
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: '2025-12-10'
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Attendance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalMembers:
 *                       type: number
 *                     totalFirstTimers:
 *                       type: number
 *                     attendanceCount:
 *                       type: number
 *                     attendanceRate:
 *                       type: number
 *                     date:
 *                       type: string
 */
router.get(
  '/stats',
  attendanceController.getAttendanceStats.bind(attendanceController)
);

/**
 * @swagger
 * /api/v1/attendance/member/{memberId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get member attendance history
 *     description: Retrieve attendance history for a specific member
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Limit number of records returned
 *     responses:
 *       200:
 *         description: Member attendance history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 */
router.get(
  '/member/:memberId',
  attendanceController.getMemberAttendanceHistory.bind(attendanceController)
);

/**
 * @swagger
 * /api/v1/attendance/{id}:
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete attendance record
 *     description: Remove an attendance record (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
 *       404:
 *         description: Attendance record not found
 */
router.delete(
  '/:id',
  authenticateToken,
  attendanceController.deleteAttendance.bind(attendanceController)
);

export default router;
