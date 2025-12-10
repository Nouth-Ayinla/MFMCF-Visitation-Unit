import { Router } from 'express';
import { MemberController } from '../controllers/member.controller';
import { validate } from '@application/middleware/validate.middleware';
import { registerMemberSchema } from '@application/validators/member.validator';

const router = Router();
const memberController = new MemberController();

/**
 * @swagger
 * /api/v1/members/register:
 *   post:
 *     tags: [Members]
 *     summary: Register a new member or first-timer
 *     description: Register a church member with all required details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phoneNumber
 *               - birthMonth
 *               - birthDay
 *               - levelId
 *               - departmentId
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *                 minLength: 2
 *                 maxLength: 100
 *               phoneNumber:
 *                 type: string
 *                 example: '08012345678'
 *                 description: Nigerian phone number
 *               address:
 *                 type: string
 *                 example: '123 Main Street, Lagos'
 *                 maxLength: 200
 *               birthMonth:
 *                 type: string
 *                 example: '12'
 *                 description: Birth month (1-12)
 *               birthDay:
 *                 type: string
 *                 example: '25'
 *                 description: Birth day (1-31)
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *                 example: Male
 *               levelId:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439011'
 *                 description: MongoDB ObjectId of the level
 *               departmentId:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: MongoDB ObjectId of the department
 *               departmentOther:
 *                 type: string
 *                 example: 'Custom Department Name'
 *                 maxLength: 100
 *               howDidYouHear:
 *                 type: string
 *                 example: 'Friend invitation'
 *                 maxLength: 200
 *               isFirstTimer:
 *                 type: boolean
 *                 example: true
 *                 default: true
 *     responses:
 *       201:
 *         description: Member registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Member registered successfully
 *                 member:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     isFirstTimer:
 *                       type: boolean
 *       400:
 *         description: Validation error or phone number already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  validate(registerMemberSchema),
  memberController.register.bind(memberController)
);

export default router;
