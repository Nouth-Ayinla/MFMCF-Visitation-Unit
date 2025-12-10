import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User } from '@domain/entities/User';
import { UserModel } from '../database/models/UserModel';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }).lean();

    if (!user) return null;

    return this.mapToEntity(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id).lean();

    if (!user) return null;

    return this.mapToEntity(user);
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await UserModel.create(userData);
    
    return this.mapToEntity({ ...user.toObject(), _id: user._id });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true } 
    ).lean();

    if (!user) return null;

    return this.mapToEntity(user);
  }

  private mapToEntity(doc: Record<string, unknown> & { _id: unknown }): User {
    return {
      id: (doc._id as { toString(): string }).toString(),
      email: doc.email as string,
      password: doc.password as string,
      fullName: doc.fullName as string,
      role: doc.role as User['role'],
      isApproved: doc.isApproved as boolean,
      approvedBy: doc.approvedBy ? (doc.approvedBy as { toString(): string }).toString() : undefined,
      approvedAt: doc.approvedAt as Date | undefined,
      departmentId: doc.departmentId ? (doc.departmentId as { toString(): string }).toString() : undefined,
      levelId: doc.levelId ? (doc.levelId as { toString(): string }).toString() : undefined,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}