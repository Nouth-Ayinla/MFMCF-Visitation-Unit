import { ActivityLog, ActivityLogFilters } from '../entities/ActivityLog';

export interface IActivityLogRepository {
  findAll(filters?: ActivityLogFilters): Promise<ActivityLog[]>;
  create(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
}
