import { Router } from 'express';
import { ActivityLogController } from '../controllers/activityLog.controller';
import { authenticateToken, requireRoles } from '@application/middleware/auth.middleware';

const router = Router();
const activityLogController = new ActivityLogController();

/**
 * @swagger
 * /api/v1/activity-logs:
 *   get:
 *     tags: [Activity Logs]
 *     summary: Get activity logs
 *     description: Retrieve user activity logs with optional filters (requires admin/coordinator role)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type (e.g., role_assigned, role_updated)
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., user, member)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs until this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: List of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       performedBy:
 *                         type: string
 *                       action:
 *                         type: string
 *                       entityType:
 *                         type: string
 *                       entityId:
 *                         type: string
 *                       oldData:
 *                         type: object
 *                       newData:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       userEmail:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       performerEmail:
 *                         type: string
 *                       performerName:
 *                         type: string
 *                 count:
 *                   type: number
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticateToken,
  requireRoles(['admin', 'visitation_coordinator']),
  activityLogController.getActivityLogs.bind(activityLogController)
);

export default router;
