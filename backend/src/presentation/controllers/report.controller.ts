import { Request, Response } from 'express';
import { ReportRepository } from '@infrastructure/repositories/ReportRepository';
import {
  GenerateMemberReportUseCase,
  GenerateAttendanceReportUseCase,
  GenerateFirstTimersReportUseCase
} from '@domain/use-cases/ReportUseCases';

export class ReportController {
  private reportRepository: ReportRepository;
  private generateMemberReportUseCase: GenerateMemberReportUseCase;
  private generateAttendanceReportUseCase: GenerateAttendanceReportUseCase;
  private generateFirstTimersReportUseCase: GenerateFirstTimersReportUseCase;

  constructor() {
    this.reportRepository = new ReportRepository();
    this.generateMemberReportUseCase = new GenerateMemberReportUseCase(this.reportRepository);
    this.generateAttendanceReportUseCase = new GenerateAttendanceReportUseCase(this.reportRepository);
    this.generateFirstTimersReportUseCase = new GenerateFirstTimersReportUseCase(this.reportRepository);
  }

  async getMemberReport(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        levelId: req.query.levelId as string | undefined,
        departmentId: req.query.departmentId as string | undefined
      };

      const report = await this.generateMemberReportUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate member report'
        }
      });
    }
  }

  async getAttendanceReport(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const memberId = req.query.memberId as string | undefined;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Start date and end date are required'
          }
        });
        return;
      }

      const report = await this.generateAttendanceReportUseCase.execute({
        startDate,
        endDate,
        memberId
      });

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid request parameters'
        }
      });
    }
  }

  async getFirstTimersReport(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        contacted: req.query.contacted === 'true' ? true : req.query.contacted === 'false' ? false : undefined
      };

      const report = await this.generateFirstTimersReportUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate first-timers report'
        }
      });
    }
  }
}
