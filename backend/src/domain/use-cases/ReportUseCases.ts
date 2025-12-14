import { IReportRepository } from '../repositories/IReportRepository';
import { MemberReport, AttendanceReport, FirstTimersReport } from '../entities/Report';

export class GenerateMemberReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(filters?: {
    startDate?: string;
    endDate?: string;
    levelId?: string;
    departmentId?: string;
  }): Promise<MemberReport> {
    const processedFilters = filters ? {
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      levelId: filters.levelId,
      departmentId: filters.departmentId
    } : undefined;

    return await this.reportRepository.generateMemberReport(processedFilters);
  }
}

export class GenerateAttendanceReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(filters: {
    startDate: string;
    endDate: string;
    memberId?: string;
  }): Promise<AttendanceReport> {
    if (!filters.startDate || !filters.endDate) {
      throw new Error('Start date and end date are required');
    }

    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    return await this.reportRepository.generateAttendanceReport({
      startDate,
      endDate,
      memberId: filters.memberId
    });
  }
}

export class GenerateFirstTimersReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(filters?: {
    startDate?: string;
    endDate?: string;
    contacted?: boolean;
  }): Promise<FirstTimersReport> {
    const processedFilters = filters ? {
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      contacted: filters.contacted
    } : undefined;

    return await this.reportRepository.generateFirstTimersReport(processedFilters);
  }
}
