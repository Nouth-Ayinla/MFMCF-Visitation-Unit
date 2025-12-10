import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@shared/errors';

// Express type extension for custom request properties
/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/prefer-namespace-keyword */
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}
/* eslint-enable @typescript-eslint/no-namespace, @typescript-eslint/prefer-namespace-keyword */

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const token = req.cookies?.accessToken;

        if (!token) {
            throw new AuthenticationError('Access token required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            email: string;
            role: string;
        };

        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
                },
            });
        } else if (error instanceof AuthenticationError) {
            res.status(401).json({
                success: false,
                error: {
                code: 'UNAUTHORIZED',
                message: error.message,
                },
            });
        } else {
            res.status(500).json({
                success: false,
                error: {
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed',
                },
            });
        }
    }
};