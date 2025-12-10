import jwt from 'jsonwebtoken';
import { IUserRepository } from '../repositories/IUserRepository';

export class RefreshTokenUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isApproved) {
        throw new Error('Invalid token');
      }

      const accessToken = jwt.sign(
        { userId: decoded.userId, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' } as jwt.SignOptions
      );

      return accessToken;
    } catch (error) {
      throw new Error('Invalid or expired efresh token');
    }
  }
}
