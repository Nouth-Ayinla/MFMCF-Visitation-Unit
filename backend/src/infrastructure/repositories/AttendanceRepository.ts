import { IAttendanceRepository } from '@domain/repositories/IAttendanceRepository';
import { Attendance, AttendanceStats } from '@domain/entities/Attendance';
import { AttendanceModel } from '../database/models/AttendanceModel';
import { MemberModel } from '../database/models/MemberModel';

export class AttendanceRepository implements IAttendanceRepository {
  async create(data: Omit<Attendance, 'id' | 'createdAt'>): Promise<Attendance> {
    const attendance = await AttendanceModel.create(data);
    return this.mapToEntity({ ...attendance.toObject(), _id: attendance._id });
  }

  async findByMemberAndDate(memberId: string, date: string): Promise<Attendance | null> {
    const attendance = await AttendanceModel.findOne({
      memberId,
      attendanceDate: date,
    }).lean();

    if (!attendance) return null;
    return this.mapToEntity(attendance);
  }

  async findByDate(date: string): Promise<Attendance[]> {
    const attendances = await AttendanceModel.find({ attendanceDate: date })
      .sort({ createdAt: -1 })
      .lean();

    return attendances.map(att => this.mapToEntity(att));
  }

  async findByMember(memberId: string, limit?: number): Promise<Attendance[]> {
    const query = AttendanceModel.find({ memberId }).sort({ attendanceDate: -1 });

    if (limit) {
      query.limit(limit);
    }

    const attendances = await query.lean();
    return attendances.map(att => this.mapToEntity(att));
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    const attendances = await AttendanceModel.find({
      attendanceDate: { $gte: startDate, $lte: endDate },
    })
      .sort({ attendanceDate: -1 })
      .lean();

    return attendances.map(att => this.mapToEntity(att));
  }

  async getStatsByDate(date: string): Promise<AttendanceStats> {
    const [attendanceCount, totalMembers, totalFirstTimers] = await Promise.all([
      this.countByDate(date),
      MemberModel.countDocuments({ isFirstTimer: false }),
      MemberModel.countDocuments({ isFirstTimer: true }),
    ]);

    const attendanceRate = totalMembers > 0 ? (attendanceCount / totalMembers) * 100 : 0;

    return {
      totalMembers,
      totalFirstTimers,
      attendanceCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      date,
    };
  }

  async countByDate(date: string): Promise<number> {
    return await AttendanceModel.countDocuments({ attendanceDate: date });
  }

  async delete(id: string): Promise<boolean> {
    const result = await AttendanceModel.findByIdAndDelete(id);
    return !!result;
  }

  private mapToEntity(doc: Record<string, unknown> & { _id: { toString(): string } }): Attendance {
    return {
      id: doc._id.toString(),
      memberId: (doc.memberId as { toString(): string }).toString(),
      attendanceDate: doc.attendanceDate as string,
      markedBy: (doc.markedBy as { toString(): string }).toString(),
      createdAt: doc.createdAt as Date,
    };
  }
}
