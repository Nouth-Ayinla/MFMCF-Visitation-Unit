import { Router } from 'express';
import { UserManagementController } from '../controllers/user.controller';
import { authenticateToken } from '@application/middleware/auth.middleware';
import { authorize } from '@application/middleware/authorize.middleware';

const router = Router();
const userController = new UserManagementController();

// All routes require authentication and admin privileges
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [User Management]
 *     summary: Get all users
 *     description: Retrieve list of users with optional filters (requires admin role)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [visitation_coordinator, assistant_coordinator, president, central, level_coordinator, admin, user]
 *         description: Filter by role
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authorize('admin', 'visitation_coordinator'),
  userController.getUsers.bind(userController)
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [User Management]
 *     summary: Get user by ID
 *     description: Retrieve a specific user's details (requires admin role)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  authorize('admin', 'visitation_coordinator'),
  userController.getUserById.bind(userController)
);

/**
 * @swagger
 * /api/v1/users/{id}/approve:
 *   post:
 *     tags: [User Management]
 *     summary: Approve a user
 *     description: Approve a pending user account (requires admin role)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       404:
 *         description: User not found
 */
router.post(
  '/:id/approve',
  authorize('admin', 'visitation_coordinator'),
  userController.approveUser.bind(userController)
);

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     tags: [User Management]
 *     summary: Update user role
 *     description: Change a user's role and assignments (requires admin role)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [visitation_coordinator, assistant_coordinator, president, central, level_coordinator, admin, user]
 *                 example: level_coordinator
 *               departmentId:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439011'
 *               levelId:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439012'
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id/role',
  authorize('admin'),
  userController.updateUserRole.bind(userController)
);

/**
 * @swagger
 * /api/v1/users/{id}/revoke:
 *   post:
 *     tags: [User Management]
 *     summary: Revoke user access
 *     description: Revoke an approved user's access (requires admin role)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User access revoked successfully
 *       404:
 *         description: User not found
 */
router.post(
  '/:id/revoke',
  authorize('admin'),
  userController.revokeUserAccess.bind(userController)
);

export default router;
