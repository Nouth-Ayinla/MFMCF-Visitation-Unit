export interface DashboardStats {
  totalMembers: number;
  totalFirstTimers: number;
  totalAttendanceThisMonth: number;
  attendanceRate: number;
}

export interface AttendanceTrend {
  date: string;
  count: number;
}

export interface LevelDistribution {
  level: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  name: string;
  timestamp: Date;
}

export interface UpcomingBirthday {
  memberId: string;
  fullName: string;
  dateOfBirth: string;
  daysUntil: number;
}
