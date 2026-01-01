import { apiClient } from '@/lib/api-client';

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  firstTimers: number;
  todayAttendance: number;
  weekAttendance: number;
  monthAttendance: number;
  upcomingBirthdays: number;
}

export interface ReportData {
  type: string;
  data: unknown;
  generatedAt: string;
}

export const dashboardApi = {
  // Get dashboard stats
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    return apiClient.get('/dashboard/stats');
  },

  // Get reports
  getReport: async (type: string, params?: Record<string, string>): Promise<{ success: boolean; data: ReportData }> => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.get(`/reports/${type}${queryString}`);
  },
};
