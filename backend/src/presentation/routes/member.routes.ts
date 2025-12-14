import { Router } from 'express';
import { MemberController } from '../controllers/member.controller';
import { validate } from '@application/middleware/validate.middleware';
import { registerMemberSchema } from '@application/validators/member.validator';
import { authenticateToken } from '@application/middleware/auth.middleware';

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

/**
 * @swagger
 * /api/v1/members:
 *   get:
 *     tags: [Members]
 *     summary: Get all members
 *     description: Retrieve list of members with optional filters
 *     parameters:
 *       - in: query
 *         name: isFirstTimer
 *         schema:
 *           type: boolean
 *         description: Filter by first-timer status
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: levelId
 *         schema:
 *           type: string
 *         description: Filter by level ID
 *     responses:
 *       200:
 *         description: List of members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 */
router.get(
  '/',
  memberController.getMembers.bind(memberController)
);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   get:
 *     tags: [Members]
 *     summary: Get member by ID
 *     description: Retrieve a specific member's details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member details
 *       404:
 *         description: Member not found
 */
router.get(
  '/:id',
  memberController.getMemberById.bind(memberController)
);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   patch:
 *     tags: [Members]
 *     summary: Update member
 *     description: Update member information (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *               levelId:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               followUpNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member updated successfully
 *       404:
 *         description: Member not found
 */
router.patch(
  '/:id',
  authenticateToken,
  memberController.updateMember.bind(memberController)
);

/**
 * @swagger
 * /api/v1/members/{id}/promote:
 *   post:
 *     tags: [Members]
 *     summary: Promote first-timer to member
 *     description: Convert a first-timer to a regular member (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: First-timer promoted successfully
 *       404:
 *         description: Member not found
 */
router.post(
  '/:id/promote',
  authenticateToken,
  memberController.promoteFirstTimer.bind(memberController)
);

/**
 * @swagger
 * /api/v1/members/{id}/follow-up:
 *   put:
 *     tags: [Members]
 *     summary: Update follow-up notes
 *     description: Update follow-up notes for a member or first-timer (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followUpNotes
 *             properties:
 *               followUpNotes:
 *                 type: string
 *                 example: 'Called and confirmed attendance for next service'
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Follow-up notes updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Follow-up notes updated successfully
 *                 member:
 *                   type: object
 *       400:
 *         description: Follow-up notes are required
 *       404:
 *         description: Member not found
 */
router.put(
  '/:id/follow-up',
  authenticateToken,
  memberController.updateFollowUpNotes.bind(memberController)
);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   delete:
 *     tags: [Members]
 *     summary: Delete member
 *     description: Permanently delete a member or first-timer (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Member deleted successfully
 *       404:
 *         description: Member not found
 */
router.delete(
  '/:id',
  authenticateToken,
  memberController.deleteMember.bind(memberController)
);

export default router;
