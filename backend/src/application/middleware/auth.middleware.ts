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
        console.log('🍪 Cookies received:', req.cookies);
        console.log('🔑 Access token:', req.cookies?.accessToken ? 'Present' : 'Missing');
        
        const token = req.cookies?.accessToken;

        if (!token) {
            console.log('❌ No access token in cookies');
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Access token required',
                },
            });
            return;
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
            return;
        } else if (error instanceof AuthenticationError) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: error.message,
                },
            });
            return;
        } else {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Authentication failed',
                },
            });
            return;
        }
    }
};

export const requireRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new AuthenticationError('User not authenticated');
            }

            if (!allowedRoles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Insufficient permissions',
                    },
                });
                return;
            }

            next();
        } catch (error) {
            if (error instanceof AuthenticationError) {
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
                        message: 'Authorization failed',
                    },
                });
            }
        }
    };
};
