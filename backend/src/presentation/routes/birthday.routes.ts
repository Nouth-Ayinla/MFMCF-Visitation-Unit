import { Router } from 'express';
import { BirthdayController } from '../controllers/birthday.controller';
import { authenticateToken } from '@application/middleware/auth.middleware';

const router = Router();
const birthdayController = new BirthdayController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/birthdays:
 *   get:
 *     tags: [Birthdays]
 *     summary: Get birthdays
 *     description: Retrieve member birthdays, optionally filtered by month
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (1-12). If omitted, returns all birthdays.
 *         example: 12
 *     responses:
 *       200:
 *         description: List of birthdays
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
 *                       phoneNumber:
 *                         type: string
 *                         example: '+2348012345678'
 *                       dateOfBirth:
 *                         type: string
 *                         example: '12-15'
 *                       month:
 *                         type: number
 *                         example: 12
 *                       day:
 *                         type: number
 *                         example: 15
 *       400:
 *         description: Invalid month parameter
 */
router.get('/', birthdayController.getBirthdays.bind(birthdayController));

/**
 * @swagger
 * /api/v1/birthdays/send-sms:
 *   post:
 *     tags: [Birthdays]
 *     summary: Send birthday SMS
 *     description: Send a birthday greeting SMS to a member
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
 *               - memberName
 *               - memberId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: '+2348012345678'
 *               memberName:
 *                 type: string
 *                 example: 'John Smith'
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
router.post('/send-sms', birthdayController.sendBirthdaySMS.bind(birthdayController));

export default router;
