import { Request, Response, NextFunction } from 'express';
import {
  MarkAttendanceUseCase,
  GetAttendanceByDateUseCase,
  GetAttendanceStatsUseCase,
  GetMemberAttendanceHistoryUseCase,
  DeleteAttendanceUseCase,
} from '@domain/use-cases/AttendanceUseCases';
import { AttendanceRepository } from '@infrastructure/repositories/AttendanceRepository';
import { MemberRepository } from '@infrastructure/repositories/MemberRepository';

export class AttendanceController {
  private markAttendanceUseCase: MarkAttendanceUseCase;
  private getAttendanceByDateUseCase: GetAttendanceByDateUseCase;
  private getAttendanceStatsUseCase: GetAttendanceStatsUseCase;
  private getMemberAttendanceHistoryUseCase: GetMemberAttendanceHistoryUseCase;
  private deleteAttendanceUseCase: DeleteAttendanceUseCase;

  constructor() {
    const attendanceRepository = new AttendanceRepository();
    const memberRepository = new MemberRepository();

    this.markAttendanceUseCase = new MarkAttendanceUseCase(
      attendanceRepository,
      memberRepository
    );
    this.getAttendanceByDateUseCase = new GetAttendanceByDateUseCase(attendanceRepository);
    this.getAttendanceStatsUseCase = new GetAttendanceStatsUseCase(attendanceRepository);
    this.getMemberAttendanceHistoryUseCase = new GetMemberAttendanceHistoryUseCase(
      attendanceRepository
    );
    this.deleteAttendanceUseCase = new DeleteAttendanceUseCase(attendanceRepository);
  }

  async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberIds, attendanceDate } = req.body;
      const markedBy = req.user?.userId;

      if (!markedBy) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        res.status(400).json({ error: 'memberIds must be a non-empty array' });
        return;
      }

      const result = await this.markAttendanceUseCase.execute({
        memberIds,
        attendanceDate,
        markedBy,
      });

      res.status(201).json({
        message: 'Attendance marked successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        res.status(400).json({ error: 'Date parameter is required' });
        return;
      }

      const attendance = await this.getAttendanceByDateUseCase.execute(date);

      res.status(200).json({
        attendance,
        count: attendance.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        res.status(400).json({ error: 'Date parameter is required' });
        return;
      }

      const stats = await this.getAttendanceStatsUseCase.execute(date);

      res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }

  async getMemberAttendanceHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { memberId } = req.params;
      const { limit } = req.query;

      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

      const history = await this.getMemberAttendanceHistoryUseCase.execute(
        memberId,
        parsedLimit
      );

      res.status(200).json({
        history,
        count: history.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await this.deleteAttendanceUseCase.execute(id);

      res.status(200).json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
