import { Department, Level } from '../entities/Organization';

export interface IDepartmentRepository {
  findAll(): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  findByName(name: string): Promise<Department | null>;
  create(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department>;
  update(id: string, data: Partial<Department>): Promise<Department | null>;
  delete(id: string): Promise<boolean>;
}

export interface ILevelRepository {
  findAll(): Promise<Level[]>;
  findById(id: string): Promise<Level | null>;
  findByNumber(levelNumber: string): Promise<Level | null>;
  create(data: Omit<Level, 'id' | 'createdAt' | 'updatedAt'>): Promise<Level>;
  update(id: string, data: Partial<Level>): Promise<Level | null>;
  delete(id: string): Promise<boolean>;
}
