import { DashboardStats, AttendanceTrend, LevelDistribution, RecentActivity, UpcomingBirthday } from '../entities/Dashboard';

export interface IDashboardRepository {
  getDashboardStats(): Promise<DashboardStats>;
  getAttendanceTrends(days: number): Promise<AttendanceTrend[]>;
  getLevelDistribution(): Promise<LevelDistribution[]>;
  getRecentActivity(limit: number): Promise<RecentActivity[]>;
  getUpcomingBirthdays(days: number): Promise<UpcomingBirthday[]>;
}
