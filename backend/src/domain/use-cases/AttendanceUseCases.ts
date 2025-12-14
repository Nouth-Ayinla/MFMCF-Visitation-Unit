import { IAttendanceRepository } from '../repositories/IAttendanceRepository';
import { IMemberRepository } from '../repositories/IMemberRepository';

export class MarkAttendanceUseCase {
  constructor(
    private attendanceRepository: IAttendanceRepository,
    private memberRepository: IMemberRepository
  ) {}

  async execute(data: {
    memberIds: string[];
    attendanceDate: string;
    markedBy: string;
  }): Promise<{
    marked: number;
    duplicates: number;
    invalid: number;
  }> {
    let marked = 0;
    let duplicates = 0;
    let invalid = 0;

    for (const memberId of data.memberIds) {
      // Check if member exists
      const member = await this.memberRepository.findById(memberId);
      if (!member) {
        invalid++;
        continue;
      }

      // Check for duplicate
      const existing = await this.attendanceRepository.findByMemberAndDate(
        memberId,
        data.attendanceDate
      );

      if (existing) {
        duplicates++;
        continue;
      }

      // Mark attendance
      await this.attendanceRepository.create({
        memberId,
        attendanceDate: data.attendanceDate,
        markedBy: data.markedBy,
      });

      marked++;
    }

    return { marked, duplicates, invalid };
  }
}

export class GetAttendanceByDateUseCase {
  constructor(private attendanceRepository: IAttendanceRepository) {}

  async execute(date: string) {
    return await this.attendanceRepository.findByDate(date);
  }
}

export class GetAttendanceStatsUseCase {
  constructor(private attendanceRepository: IAttendanceRepository) {}

  async execute(date: string) {
    return await this.attendanceRepository.getStatsByDate(date);
  }
}

export class GetMemberAttendanceHistoryUseCase {
  constructor(private attendanceRepository: IAttendanceRepository) {}

  async execute(memberId: string, limit?: number) {
    return await this.attendanceRepository.findByMember(memberId, limit);
  }
}

export class DeleteAttendanceUseCase {
  constructor(private attendanceRepository: IAttendanceRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.attendanceRepository.delete(id);
    if (!deleted) {
      throw new Error('Attendance record not found');
    }
  }
}
