import { Request, Response } from 'express';
import { BirthdayRepository } from '@infrastructure/repositories/BirthdayRepository';
import { SMSService } from '@infrastructure/services/SMSService';
import { GetBirthdaysByMonthUseCase, SendBirthdaySMSUseCase, SendSMSUseCase } from '@domain/use-cases/BirthdayUseCases';

export class BirthdayController {
  private birthdayRepository: BirthdayRepository;
  private smsService: SMSService;
  private getBirthdaysByMonthUseCase: GetBirthdaysByMonthUseCase;
  private sendBirthdaySMSUseCase: SendBirthdaySMSUseCase;
  private sendSMSUseCase: SendSMSUseCase;

  constructor() {
    this.birthdayRepository = new BirthdayRepository();
    this.smsService = new SMSService();
    this.getBirthdaysByMonthUseCase = new GetBirthdaysByMonthUseCase(this.birthdayRepository);
    this.sendBirthdaySMSUseCase = new SendBirthdaySMSUseCase(this.smsService);
    this.sendSMSUseCase = new SendSMSUseCase(this.smsService);
  }

  async getBirthdays(req: Request, res: Response): Promise<void> {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const birthdays = await this.getBirthdaysByMonthUseCase.execute(month);
      
      res.status(200).json({
        success: true,
        data: birthdays
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid request'
        }
      });
    }
  }

  async sendBirthdaySMS(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, memberName, memberId } = req.body;

      if (!phoneNumber || !memberName || !memberId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Phone number, member name, and member ID are required'
          }
        });
        return;
      }

      const result = await this.sendBirthdaySMSUseCase.execute(phoneNumber, memberName, memberId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Birthday SMS sent successfully',
          data: {
            messageId: result.messageId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'SMS_ERROR',
            message: result.error || 'Failed to send SMS'
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send birthday SMS'
        }
      });
    }
  }

  async sendSMS(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, message, memberId } = req.body;

      if (!phoneNumber || !message || !memberId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Phone number, message, and member ID are required'
          }
        });
        return;
      }

      const result = await this.sendSMSUseCase.execute(phoneNumber, message, memberId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'SMS sent successfully',
          data: {
            messageId: result.messageId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'SMS_ERROR',
            message: result.error || 'Failed to send SMS'
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send SMS'
        }
      });
    }
  }
}
