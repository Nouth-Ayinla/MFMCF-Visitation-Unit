import { Attendance, AttendanceStats } from '../entities/Attendance';

export interface IAttendanceRepository {
  create(data: Omit<Attendance, 'id' | 'createdAt'>): Promise<Attendance>;
  findByMemberAndDate(memberId: string, date: string): Promise<Attendance | null>;
  findByDate(date: string): Promise<Attendance[]>;
  findByMember(memberId: string, limit?: number): Promise<Attendance[]>;
  findByDateRange(startDate: string, endDate: string): Promise<Attendance[]>;
  getStatsByDate(date: string): Promise<AttendanceStats>;
  countByDate(date: string): Promise<number>;
  delete(id: string): Promise<boolean>;
}
