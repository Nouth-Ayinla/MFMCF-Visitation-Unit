import bcrypt from 'bcryptjs';
import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(email: string, password: string, fullName: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      role: 'user',
      isApproved: false,
    });

    return user
  }
}
