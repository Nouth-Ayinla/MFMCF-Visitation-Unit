import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../repositories/IUserRepository';

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      isApproved: boolean;
    };
  }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new Error('Account pending approval');
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '30d' } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isApproved: user.isApproved,
      }
    }
  }
}