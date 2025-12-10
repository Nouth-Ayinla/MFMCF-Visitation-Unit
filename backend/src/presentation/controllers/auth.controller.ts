import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '@domain/use-cases/RegisterUser';
import { LoginUserUseCase } from '@domain/use-cases/LoginUser';
import { RefreshTokenUseCase } from '@domain/use-cases/RefreshToken';
import { UserRepository } from '@infrastructure/repositories/UserRepository';
import { ConflictError, AuthenticationError } from '@shared/errors';

// Initialize repository and use cases
const userRepository = new UserRepository();
const registerUserUseCase = new RegisterUserUseCase(userRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository);

export class AuthController {
  // Register new user
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName } = req.body;

      const user = await registerUserUseCase.execute(email, password, fullName);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Awaiting approval.',
        data: {
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          isApproved: user.isApproved,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        next(new ConflictError('Email already registered'));
      } else {
        next(error);
      }
    }
  }

  // Login user
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await loginUserUseCase.execute(email, password);

      // Set tokens in HTTP-only cookies
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/v1/auth/refresh',
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid credentials' ||
          error.message === 'Account pending approval'
        ) {
          next(new AuthenticationError(error.message));
        } else {
          next(error);
        }
      }
    }
  }

  // Refresh access token
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new AuthenticationError('Refresh token required');
      }

      const accessToken = await refreshTokenUseCase.execute(refreshToken);

      // Set new access token
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        next(new AuthenticationError('Invalid or expired refresh token'));
      } else {
        next(error);
      }
    }
  }

  // Logout user
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Find full user details
      const user = await userRepository.findById(req.user.userId);

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isApproved: user.isApproved,
          departmentId: user.departmentId,
          levelId: user.levelId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
