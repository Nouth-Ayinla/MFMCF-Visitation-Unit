import { Request, Response, NextFunction } from 'express';
import { DepartmentRepository, LevelRepository } from '@infrastructure/repositories/OrganizationRepositories';

export class OrganizationController {
  private departmentRepository: DepartmentRepository;
  private levelRepository: LevelRepository;

  constructor() {
    this.departmentRepository = new DepartmentRepository();
    this.levelRepository = new LevelRepository();
  }

  // Department methods
  async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await this.departmentRepository.findAll();
      res.status(200).json({ departments });
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;

      // Check if department exists
      const existing = await this.departmentRepository.findByName(name);
      if (existing) {
        res.status(409).json({ error: 'Department already exists' });
        return;
      }

      const department = await this.departmentRepository.create({ name });
      res.status(201).json({ message: 'Department created', department });
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await this.departmentRepository.update(id, req.body);

      if (!department) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }

      res.status(200).json({ message: 'Department updated', department });
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.departmentRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }

      res.status(200).json({ message: 'Department deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Level methods
  async getLevels(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const levels = await this.levelRepository.findAll();
      res.status(200).json({ levels });
    } catch (error) {
      next(error);
    }
  }

  async createLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { levelNumber } = req.body;

      // Check if level exists
      const existing = await this.levelRepository.findByNumber(levelNumber);
      if (existing) {
        res.status(409).json({ error: 'Level already exists' });
        return;
      }

      const level = await this.levelRepository.create({ levelNumber });
      res.status(201).json({ message: 'Level created', level });
    } catch (error) {
      next(error);
    }
  }

  async updateLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const level = await this.levelRepository.update(id, req.body);

      if (!level) {
        res.status(404).json({ error: 'Level not found' });
        return;
      }

      res.status(200).json({ message: 'Level updated', level });
    } catch (error) {
      next(error);
    }
  }

  async deleteLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.levelRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Level not found' });
        return;
      }

      res.status(200).json({ message: 'Level deleted' });
    } catch (error) {
      next(error);
    }
  }
}
