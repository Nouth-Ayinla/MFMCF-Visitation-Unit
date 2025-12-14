export interface Attendance {
  id: string;
  memberId: string;
  attendanceDate: string; // YYYY-MM-DD format
  markedBy: string; // User ID who marked the attendance
  createdAt: Date;
}

export interface AttendanceStats {
  totalMembers: number;
  totalFirstTimers: number;
  attendanceCount: number;
  attendanceRate: number;
  date: string;
}
