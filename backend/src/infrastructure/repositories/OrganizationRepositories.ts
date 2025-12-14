import { IDepartmentRepository, ILevelRepository } from '@domain/repositories/IOrganizationRepositories';
import { Department, Level } from '@domain/entities/Organization';
import { DepartmentModel, LevelModel } from '../database/models/OrganizationModels';

export class DepartmentRepository implements IDepartmentRepository {
  async findAll(): Promise<Department[]> {
    const departments = await DepartmentModel.find().sort({ name: 1 }).lean();
    return departments.map(dept => this.mapToEntity(dept));
  }

  async findById(id: string): Promise<Department | null> {
    const department = await DepartmentModel.findById(id).lean();
    if (!department) return null;
    return this.mapToEntity(department);
  }

  async findByName(name: string): Promise<Department | null> {
    const department = await DepartmentModel.findOne({ name }).lean();
    if (!department) return null;
    return this.mapToEntity(department);
  }

  async create(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    const department = await DepartmentModel.create(data);
    return this.mapToEntity({ ...department.toObject(), _id: department._id });
  }

  async update(id: string, data: Partial<Department>): Promise<Department | null> {
    const department = await DepartmentModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean();
    if (!department) return null;
    return this.mapToEntity(department);
  }

  async delete(id: string): Promise<boolean> {
    const result = await DepartmentModel.findByIdAndDelete(id);
    return !!result;
  }

  private mapToEntity(doc: Record<string, unknown> & { _id: { toString(): string } }): Department {
    return {
      id: doc._id.toString(),
      name: doc.name as string,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}

export class LevelRepository implements ILevelRepository {
  async findAll(): Promise<Level[]> {
    const levels = await LevelModel.find().sort({ levelNumber: 1 }).lean();
    return levels.map(level => this.mapToEntity(level));
  }

  async findById(id: string): Promise<Level | null> {
    const level = await LevelModel.findById(id).lean();
    if (!level) return null;
    return this.mapToEntity(level);
  }

  async findByNumber(levelNumber: string): Promise<Level | null> {
    const level = await LevelModel.findOne({ levelNumber }).lean();
    if (!level) return null;
    return this.mapToEntity(level);
  }

  async create(data: Omit<Level, 'id' | 'createdAt' | 'updatedAt'>): Promise<Level> {
    const level = await LevelModel.create(data);
    return this.mapToEntity({ ...level.toObject(), _id: level._id });
  }

  async update(id: string, data: Partial<Level>): Promise<Level | null> {
    const level = await LevelModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean();
    if (!level) return null;
    return this.mapToEntity(level);
  }

  async delete(id: string): Promise<boolean> {
    const result = await LevelModel.findByIdAndDelete(id);
    return !!result;
  }

  private mapToEntity(doc: Record<string, unknown> & { _id: { toString(): string } }): Level {
    return {
      id: doc._id.toString(),
      levelNumber: doc.levelNumber as string,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}
