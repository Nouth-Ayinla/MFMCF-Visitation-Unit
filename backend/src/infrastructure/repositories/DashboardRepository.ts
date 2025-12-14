import { IDashboardRepository } from '@domain/repositories/IDashboardRepository';
import { DashboardStats, AttendanceTrend, LevelDistribution, RecentActivity, UpcomingBirthday } from '@domain/entities/Dashboard';
import { MemberModel } from '../database/models/MemberModel';
import { AttendanceModel } from '../database/models/AttendanceModel';

export class DashboardRepository implements IDashboardRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [members, firstTimers, attendanceRecords] = await Promise.all([
      MemberModel.countDocuments({ isFirstTimer: false }),
      MemberModel.countDocuments({ isFirstTimer: true }),
      AttendanceModel.countDocuments({ 
        attendanceDate: { $gte: startOfMonth.toISOString().split('T')[0] } 
      })
    ]);

    const attendanceRate = members > 0 ? Math.round((attendanceRecords / members) * 100) : 0;

    return {
      totalMembers: members,
      totalFirstTimers: firstTimers,
      totalAttendanceThisMonth: attendanceRecords,
      attendanceRate
    };
  }

  async getAttendanceTrends(days: number): Promise<AttendanceTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const trends = await AttendanceModel.aggregate([
      {
        $match: {
          attendanceDate: { $gte: startDate.toISOString().split('T')[0] }
        }
      },
      {
        $group: {
          _id: '$attendanceDate',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create array with all dates in range, filling in zeros for missing dates
    const result: AttendanceTrend[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = trends.find((t: any) => t._id === dateStr);
      result.push({
        date: dateStr,
        count: found ? found.count : 0
      });
    }

    return result;
  }

  async getLevelDistribution(): Promise<LevelDistribution[]> {
    const distribution = await MemberModel.aggregate([
      {
        $match: { isFirstTimer: false, levelId: { $ne: null } }
      },
      {
        $lookup: {
          from: 'levels',
          localField: 'levelId',
          foreignField: '_id',
          as: 'level'
        }
      },
      {
        $unwind: '$level'
      },
      {
        $group: {
          _id: '$level.levelNumber',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return distribution.map((d: any) => ({
      level: d._id,
      count: d.count
    }));
  }

  async getRecentActivity(limit: number): Promise<RecentActivity[]> {
    const recentMembers = await MemberModel.find()
      .sort({ registeredAt: -1 })
      .limit(limit)
      .select('_id fullName registeredAt isFirstTimer')
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return recentMembers.map((m: any) => ({
      id: m._id.toString(),
      type: m.isFirstTimer ? 'New First-Timer' : 'New Member',
      name: m.fullName,
      timestamp: m.registeredAt
    }));
  }

  async getUpcomingBirthdays(days: number): Promise<UpcomingBirthday[]> {
    const today = new Date();

    // Get all members with date of birth
    const members = await MemberModel.find({
      dateOfBirth: { $ne: null }
    })
      .select('_id fullName dateOfBirth')
      .lean();

    const upcomingBirthdays: UpcomingBirthday[] = [];

    for (const member of members) {
      // Parse MM-DD format
      const [month, day] = member.dateOfBirth.split('-').map(Number);
      
      // Calculate days until birthday
      let birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
      
      if (birthdayThisYear < today) {
        // Birthday already passed this year, check next year
        birthdayThisYear = new Date(today.getFullYear() + 1, month - 1, day);
      }

      const daysUntil = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil <= days) {
        upcomingBirthdays.push({
          memberId: member._id.toString(),
          fullName: member.fullName,
          dateOfBirth: member.dateOfBirth,
          daysUntil
        });
      }
    }

    // Sort by days until birthday
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    return upcomingBirthdays;
  }
}
