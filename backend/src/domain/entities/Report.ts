export interface MemberReport {
  totalMembers: number;
  totalFirstTimers: number;
  byLevel: { level: string; count: number }[];
  byDepartment: { department: string; count: number }[];
  byGender: { gender: string; count: number }[];
  recentRegistrations: {
    id: string;
    fullName: string;
    phoneNumber: string;
    registeredAt: Date;
    isFirstTimer: boolean;
  }[];
}

export interface AttendanceReport {
  totalAttendance: number;
  uniqueMembers: number;
  attendanceRate: number;
  byDate: { date: string; count: number }[];
  byMember: {
    memberId: string;
    fullName: string;
    attendanceCount: number;
  }[];
}

export interface FirstTimersReport {
  totalFirstTimers: number;
  contacted: number;
  notContacted: number;
  promoted: number;
  byMonth: { month: string; count: number }[];
  recentFirstTimers: {
    id: string;
    fullName: string;
    phoneNumber: string;
    registeredAt: Date;
    contacted: boolean;
    promoted: boolean;
  }[];
}
