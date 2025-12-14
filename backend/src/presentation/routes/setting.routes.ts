import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticateToken, requireRoles } from '@application/middleware/auth.middleware';

const router = Router();
const settingController = new SettingController();

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get all system settings
 *     description: Retrieve all system configuration settings (requires admin or coordinator role)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of system settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       settingKey:
 *                         type: string
 *                         example: fellowship_name
 *                       settingValue:
 *                         oneOf:
 *                           - type: string
 *                           - type: number
 *                           - type: boolean
 *                         example: MFM Christ's Foundation
 *                       description:
 *                         type: string
 *                       updatedBy:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/',
  authenticateToken,
  requireRoles(['admin', 'visitation_coordinator']),
  settingController.getSettings.bind(settingController)
);

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     tags: [Settings]
 *     summary: Update system settings
 *     description: Update one or more system configuration settings (requires admin or coordinator role)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - settingKey
 *                     - settingValue
 *                   properties:
 *                     settingKey:
 *                       type: string
 *                       enum: [fellowship_name, contact_email, attendance_reminder_enabled, first_timer_follow_up_days]
 *                       example: fellowship_name
 *                     settingValue:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                         - type: boolean
 *                       example: MFM Christ's Foundation
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Settings updated successfully
 *                 settings:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid settings data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put(
  '/',
  authenticateToken,
  requireRoles(['admin', 'visitation_coordinator']),
  settingController.updateSettings.bind(settingController)
);

export default router;
