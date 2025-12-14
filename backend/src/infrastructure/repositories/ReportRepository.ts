import { IReportRepository } from '@domain/repositories/IReportRepository';
import { MemberReport, AttendanceReport, FirstTimersReport } from '@domain/entities/Report';
import { MemberModel } from '../database/models/MemberModel';
import { AttendanceModel } from '../database/models/AttendanceModel';

export class ReportRepository implements IReportRepository {
  async generateMemberReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    levelId?: string;
    departmentId?: string;
  }): Promise<MemberReport> {
    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      query.registeredAt = {};
      if (filters.startDate) query.registeredAt.$gte = filters.startDate;
      if (filters.endDate) query.registeredAt.$lte = filters.endDate;
    }
    if (filters?.levelId) query.levelId = filters.levelId;
    if (filters?.departmentId) query.departmentId = filters.departmentId;

    // Total counts
    const [totalMembers, totalFirstTimers] = await Promise.all([
      MemberModel.countDocuments({ ...query, isFirstTimer: false }),
      MemberModel.countDocuments({ ...query, isFirstTimer: true })
    ]);

    // By level
    const byLevelData = await MemberModel.aggregate([
      { $match: { ...query, isFirstTimer: false } },
      {
        $lookup: {
          from: 'levels',
          localField: 'levelId',
          foreignField: '_id',
          as: 'level'
        }
      },
      { $unwind: { path: '$level', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$level.levelNumber',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // By department
    const byDepartmentData = await MemberModel.aggregate([
      { $match: { ...query, isFirstTimer: false } },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$department.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // By gender
    const byGenderData = await MemberModel.aggregate([
      { $match: { ...query, isFirstTimer: false, gender: { $ne: null } } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent registrations
    const recentRegs = await MemberModel.find(query)
      .sort({ registeredAt: -1 })
      .limit(10)
      .select('_id fullName phoneNumber registeredAt isFirstTimer')
      .lean();

    return {
      totalMembers,
      totalFirstTimers,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byLevel: byLevelData.map((d: any) => ({
        level: d._id || 'Unassigned',
        count: d.count
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byDepartment: byDepartmentData.map((d: any) => ({
        department: d._id || 'Unassigned',
        count: d.count
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byGender: byGenderData.map((d: any) => ({
        gender: d._id,
        count: d.count
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentRegistrations: recentRegs.map((m: any) => ({
        id: m._id.toString(),
        fullName: m.fullName,
        phoneNumber: m.phoneNumber,
        registeredAt: m.registeredAt,
        isFirstTimer: m.isFirstTimer
      }))
    };
  }

  async generateAttendanceReport(filters: {
    startDate: Date;
    endDate: Date;
    memberId?: string;
  }): Promise<AttendanceReport> {
    const startDateStr = filters.startDate.toISOString().split('T')[0];
    const endDateStr = filters.endDate.toISOString().split('T')[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
      attendanceDate: { $gte: startDateStr, $lte: endDateStr }
    };

    if (filters.memberId) {
      query.memberId = filters.memberId;
    }

    const [totalAttendance, uniqueMembersData, byDateData] = await Promise.all([
      AttendanceModel.countDocuments(query),
      AttendanceModel.distinct('memberId', query),
      AttendanceModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$attendanceDate',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const uniqueMembers = uniqueMembersData.length;

    // By member
    const byMemberData = await AttendanceModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$memberId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'members',
          localField: '_id',
          foreignField: '_id',
          as: 'member'
        }
      },
      { $unwind: '$member' }
    ]);

    const totalMembers = await MemberModel.countDocuments({ isFirstTimer: false });
    const attendanceRate = totalMembers > 0 ? Math.round((uniqueMembers / totalMembers) * 100) : 0;

    return {
      totalAttendance,
      uniqueMembers,
      attendanceRate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byDate: byDateData.map((d: any) => ({
        date: d._id,
        count: d.count
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byMember: byMemberData.map((d: any) => ({
        memberId: d._id.toString(),
        fullName: d.member.fullName,
        attendanceCount: d.count
      }))
    };
  }

  async generateFirstTimersReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    contacted?: boolean;
  }): Promise<FirstTimersReport> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { isFirstTimer: true };

    if (filters?.startDate || filters?.endDate) {
      query.registeredAt = {};
      if (filters.startDate) query.registeredAt.$gte = filters.startDate;
      if (filters.endDate) query.registeredAt.$lte = filters.endDate;
    }

    if (filters?.contacted !== undefined) {
      query.contactedAt = filters.contacted ? { $ne: null } : null;
    }

    const [totalFirstTimers, contacted, notContacted, promoted] = await Promise.all([
      MemberModel.countDocuments(query),
      MemberModel.countDocuments({ ...query, contactedAt: { $ne: null } }),
      MemberModel.countDocuments({ ...query, contactedAt: null }),
      MemberModel.countDocuments({ ...query, promotedToMemberAt: { $ne: null } })
    ]);

    // By month
    const byMonthData = await MemberModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$registeredAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent first-timers
    const recentFirstTimers = await MemberModel.find(query)
      .sort({ registeredAt: -1 })
      .limit(20)
      .select('_id fullName phoneNumber registeredAt contactedAt promotedToMemberAt')
      .lean();

    return {
      totalFirstTimers,
      contacted,
      notContacted,
      promoted,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byMonth: byMonthData.map((d: any) => ({
        month: d._id,
        count: d.count
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentFirstTimers: recentFirstTimers.map((m: any) => ({
        id: m._id.toString(),
        fullName: m.fullName,
        phoneNumber: m.phoneNumber,
        registeredAt: m.registeredAt,
        contacted: !!m.contactedAt,
        promoted: !!m.promotedToMemberAt
      }))
    };
  }
}
