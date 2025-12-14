import { Request, Response, NextFunction } from 'express';
import {
  GetUsersUseCase,
  GetUserByIdUseCase,
  ApproveUserUseCase,
  UpdateUserRoleUseCase,
  RevokeUserAccessUseCase,
} from '@domain/use-cases/UserManagementUseCases';
import { UserRepository } from '@infrastructure/repositories/UserRepository';

export class UserManagementController {
  private getUsersUseCase: GetUsersUseCase;
  private getUserByIdUseCase: GetUserByIdUseCase;
  private approveUserUseCase: ApproveUserUseCase;
  private updateUserRoleUseCase: UpdateUserRoleUseCase;
  private revokeUserAccessUseCase: RevokeUserAccessUseCase;

  constructor() {
    const userRepository = new UserRepository();
    this.getUsersUseCase = new GetUsersUseCase(userRepository);
    this.getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
    this.approveUserUseCase = new ApproveUserUseCase(userRepository);
    this.updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository);
    this.revokeUserAccessUseCase = new RevokeUserAccessUseCase(userRepository);
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, isApproved } = req.query;

      const filters: Record<string, unknown> = {};
      if (role) filters.role = role as string;
      if (isApproved !== undefined) filters.isApproved = isApproved === 'true';

      const users = await this.getUsersUseCase.execute(filters);

      res.status(200).json({
        users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.getUserByIdUseCase.execute(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async approveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const approvedBy = req.user?.userId;

      if (!approvedBy) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await this.approveUserUseCase.execute(id, approvedBy);

      res.status(200).json({
        message: 'User approved successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role, departmentId, levelId } = req.body;

      if (!role) {
        res.status(400).json({ error: 'Role is required' });
        return;
      }

      const user = await this.updateUserRoleUseCase.execute(id, role, departmentId, levelId);

      res.status(200).json({
        message: 'User role updated successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          departmentId: user.departmentId,
          levelId: user.levelId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeUserAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await this.revokeUserAccessUseCase.execute(id);

      res.status(200).json({
        message: 'User access revoked successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isApproved: user.isApproved,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
