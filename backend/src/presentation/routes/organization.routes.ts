import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticateToken } from '@application/middleware/auth.middleware';

const router = Router();
const orgController = new OrganizationController();

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     tags: [Organization]
 *     summary: Get all departments
 *     description: Retrieve list of all departments
 *     responses:
 *       200:
 *         description: List of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/departments', orgController.getDepartments.bind(orgController));

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     tags: [Organization]
 *     summary: Create a new department
 *     description: Add a new department (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ushering Department
 *     responses:
 *       201:
 *         description: Department created successfully
 *       409:
 *         description: Department already exists
 */
router.post(
  '/departments',
  authenticateToken,
  orgController.createDepartment.bind(orgController)
);

router.patch(
  '/departments/:id',
  authenticateToken,
  orgController.updateDepartment.bind(orgController)
);

router.delete(
  '/departments/:id',
  authenticateToken,
  orgController.deleteDepartment.bind(orgController)
);

/**
 * @swagger
 * /api/v1/levels:
 *   get:
 *     tags: [Organization]
 *     summary: Get all levels
 *     description: Retrieve list of all levels
 *     responses:
 *       200:
 *         description: List of levels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 levels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       levelNumber:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/levels', orgController.getLevels.bind(orgController));

/**
 * @swagger
 * /api/v1/levels:
 *   post:
 *     tags: [Organization]
 *     summary: Create a new level
 *     description: Add a new level (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - levelNumber
 *             properties:
 *               levelNumber:
 *                 type: string
 *                 example: '100'
 *     responses:
 *       201:
 *         description: Level created successfully
 *       409:
 *         description: Level already exists
 */
router.post(
  '/levels',
  authenticateToken,
  orgController.createLevel.bind(orgController)
);

router.patch(
  '/levels/:id',
  authenticateToken,
  orgController.updateLevel.bind(orgController)
);

router.delete(
  '/levels/:id',
  authenticateToken,
  orgController.deleteLevel.bind(orgController)
);

export default router;
