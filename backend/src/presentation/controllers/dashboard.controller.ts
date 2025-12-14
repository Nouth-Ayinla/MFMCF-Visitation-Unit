import { Request, Response } from 'express';
import { DashboardRepository } from '@infrastructure/repositories/DashboardRepository';
import {
  GetDashboardStatsUseCase,
  GetAttendanceTrendsUseCase,
  GetLevelDistributionUseCase,
  GetRecentActivityUseCase,
  GetUpcomingBirthdaysUseCase
} from '@domain/use-cases/DashboardUseCases';

export class DashboardController {
  private dashboardRepository: DashboardRepository;
  private getDashboardStatsUseCase: GetDashboardStatsUseCase;
  private getAttendanceTrendsUseCase: GetAttendanceTrendsUseCase;
  private getLevelDistributionUseCase: GetLevelDistributionUseCase;
  private getRecentActivityUseCase: GetRecentActivityUseCase;
  private getUpcomingBirthdaysUseCase: GetUpcomingBirthdaysUseCase;

  constructor() {
    this.dashboardRepository = new DashboardRepository();
    this.getDashboardStatsUseCase = new GetDashboardStatsUseCase(this.dashboardRepository);
    this.getAttendanceTrendsUseCase = new GetAttendanceTrendsUseCase(this.dashboardRepository);
    this.getLevelDistributionUseCase = new GetLevelDistributionUseCase(this.dashboardRepository);
    this.getRecentActivityUseCase = new GetRecentActivityUseCase(this.dashboardRepository);
    this.getUpcomingBirthdaysUseCase = new GetUpcomingBirthdaysUseCase(this.dashboardRepository);
  }

  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getDashboardStatsUseCase.execute();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
        }
      });
    }
  }

  async getAttendanceTrends(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const trends = await this.getAttendanceTrendsUseCase.execute(days);
      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid days parameter'
        }
      });
    }
  }

  async getLevelDistribution(_req: Request, res: Response): Promise<void> {
    try {
      const distribution = await this.getLevelDistributionUseCase.execute();
      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch level distribution'
        }
      });
    }
  }

  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await this.getRecentActivityUseCase.execute(limit);
      res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid limit parameter'
        }
      });
    }
  }

  async getUpcomingBirthdays(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const birthdays = await this.getUpcomingBirthdaysUseCase.execute(days);
      res.status(200).json({
        success: true,
        data: birthdays
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid days parameter'
        }
      });
    }
  }
}
