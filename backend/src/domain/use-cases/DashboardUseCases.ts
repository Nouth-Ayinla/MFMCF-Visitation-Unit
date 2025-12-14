import { IDashboardRepository } from '../repositories/IDashboardRepository';
import { DashboardStats, AttendanceTrend, LevelDistribution, RecentActivity, UpcomingBirthday } from '../entities/Dashboard';

export class GetDashboardStatsUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(): Promise<DashboardStats> {
    return await this.dashboardRepository.getDashboardStats();
  }
}

export class GetAttendanceTrendsUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(days: number = 7): Promise<AttendanceTrend[]> {
    if (days < 1 || days > 90) {
      throw new Error('Days must be between 1 and 90');
    }
    return await this.dashboardRepository.getAttendanceTrends(days);
  }
}

export class GetLevelDistributionUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(): Promise<LevelDistribution[]> {
    return await this.dashboardRepository.getLevelDistribution();
  }
}

export class GetRecentActivityUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(limit: number = 10): Promise<RecentActivity[]> {
    if (limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }
    return await this.dashboardRepository.getRecentActivity(limit);
  }
}

export class GetUpcomingBirthdaysUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute(days: number = 7): Promise<UpcomingBirthday[]> {
    if (days < 1 || days > 60) {
      throw new Error('Days must be between 1 and 60');
    }
    return await this.dashboardRepository.getUpcomingBirthdays(days);
  }
}
