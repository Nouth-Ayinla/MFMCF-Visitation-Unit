import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@shared/errors';

type UserRole =
  | 'visitation_coordinator'
  | 'assistant_coordinator'
  | 'president'
  | 'central'
  | 'level_coordinator'
  | 'admin'
  | 'user';

export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new ForbiddenError('User not authenticated');
            }

            const userRole = req.user.role as UserRole;

            if (!allowedRoles.includes(userRole)) {
                throw new ForbiddenError('Insufficient permissions');
            }
            next();
        } catch (error) {
            if (error instanceof ForbiddenError) {
                res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: error.message,
                },
                });
            } else {
                res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Authorization failed',
                },
                });
            }
        }
    };
};