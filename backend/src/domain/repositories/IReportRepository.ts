import { MemberReport, AttendanceReport, FirstTimersReport } from '../entities/Report';

export interface IReportRepository {
  generateMemberReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    levelId?: string;
    departmentId?: string;
  }): Promise<MemberReport>;

  generateAttendanceReport(filters: {
    startDate: Date;
    endDate: Date;
    memberId?: string;
  }): Promise<AttendanceReport>;

  generateFirstTimersReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    contacted?: boolean;
  }): Promise<FirstTimersReport>;
}
