import { Router } from 'express';
import { BirthdayController } from '../controllers/birthday.controller';
import { authenticateToken } from '@application/middleware/auth.middleware';
import { authorize } from '@application/middleware/authorize.middleware';

const router = Router();
const birthdayController = new BirthdayController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/sms/send:
 *   post:
 *     tags: [SMS]
 *     summary: Send SMS
 *     description: Send a custom SMS message to a member
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - message
 *               - memberId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: '+2348012345678'
 *               message:
 *                 type: string
 *                 example: 'Thank you for visiting our fellowship!'
 *                 maxLength: 1000
 *               memberId:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439011'
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: SMS service error
 */
router.post(
  '/send',
  authorize('admin', 'visitation_coordinator', 'assistant_coordinator'),
  birthdayController.sendSMS.bind(birthdayController)
);

export default router;
