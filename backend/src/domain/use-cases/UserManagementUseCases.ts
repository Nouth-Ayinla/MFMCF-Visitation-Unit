import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';

export class GetUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(filters?: {
    role?: string;
    isApproved?: boolean;
  }): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findAll(filters);
    
    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password, ...user }) => user);
  }
}

export class GetUserByIdUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findById(id);
    
    if (!user) return null;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export class ApproveUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, approvedBy: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isApproved) {
      throw new Error('User is already approved');
    }

    const updated = await this.userRepository.update(userId, {
      isApproved: true,
      approvedBy,
      approvedAt: new Date(),
    });

    if (!updated) {
      throw new Error('Failed to approve user');
    }

    return updated;
  }
}

export class UpdateUserRoleUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    role: User['role'],
    departmentId?: string,
    levelId?: string
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updated = await this.userRepository.update(userId, {
      role,
      departmentId,
      levelId,
    });

    if (!updated) {
      throw new Error('Failed to update user role');
    }

    return updated;
  }
}

export class RevokeUserAccessUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updated = await this.userRepository.update(userId, {
      isApproved: false,
      approvedBy: undefined,
      approvedAt: undefined,
    });

    if (!updated) {
      throw new Error('Failed to revoke user access');
    }

    return updated;
  }
}
