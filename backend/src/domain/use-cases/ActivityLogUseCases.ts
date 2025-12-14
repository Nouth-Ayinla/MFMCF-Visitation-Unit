import { IActivityLogRepository } from '../repositories/IActivityLogRepository';
import { ActivityLog, ActivityLogFilters } from '../entities/ActivityLog';

export class GetActivityLogsUseCase {
  constructor(private activityLogRepository: IActivityLogRepository) {}

  async execute(filters?: ActivityLogFilters): Promise<ActivityLog[]> {
    // Validate limit
    if (filters?.limit && (filters.limit < 1 || filters.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }

    // Validate date range
    if (filters?.startDate && filters?.endDate && filters.startDate > filters.endDate) {
      throw new Error('Start date must be before end date');
    }

    return await this.activityLogRepository.findAll(filters);
  }
}

export class CreateActivityLogUseCase {
  constructor(private activityLogRepository: IActivityLogRepository) {}

  async execute(logData: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    // Validate required fields
    if (!logData.userId) {
      throw new Error('User ID is required');
    }

    if (!logData.action) {
      throw new Error('Action is required');
    }

    if (!logData.entityType) {
      throw new Error('Entity type is required');
    }

    return await this.activityLogRepository.create(logData);
  }
}
