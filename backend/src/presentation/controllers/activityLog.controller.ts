import { Request, Response, NextFunction } from 'express';
import { GetActivityLogsUseCase } from '@domain/use-cases/ActivityLogUseCases';
import { ActivityLogRepository } from '@infrastructure/repositories/ActivityLogRepository';

export class ActivityLogController {
  private getActivityLogsUseCase: GetActivityLogsUseCase;

  constructor() {
    const activityLogRepository = new ActivityLogRepository();
    this.getActivityLogsUseCase = new GetActivityLogsUseCase(activityLogRepository);
  }

  async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, action, entityType, startDate, endDate, limit } = req.query;

      const filters = {
        userId: userId as string | undefined,
        action: action as string | undefined,
        entityType: entityType as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const logs = await this.getActivityLogsUseCase.execute(filters);

      res.status(200).json({
        logs,
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }
}
