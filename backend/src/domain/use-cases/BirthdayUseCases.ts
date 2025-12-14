import { IBirthdayRepository } from '../repositories/IBirthdayRepository';
import { ISMSService } from '../services/ISMSService';
import { Birthday, SMSResponse } from '../entities/Birthday';

export class GetBirthdaysByMonthUseCase {
  constructor(private birthdayRepository: IBirthdayRepository) {}

  async execute(month?: number): Promise<Birthday[]> {
    if (month !== undefined) {
      if (month < 1 || month > 12) {
        throw new Error('Month must be between 1 and 12');
      }
      return await this.birthdayRepository.getBirthdaysByMonth(month);
    }
    return await this.birthdayRepository.getAllBirthdays();
  }
}

export class SendBirthdaySMSUseCase {
  constructor(private smsService: ISMSService) {}

  async execute(phoneNumber: string, memberName: string, memberId: string): Promise<SMSResponse> {
    if (!phoneNumber || !memberName || !memberId) {
      throw new Error('Phone number, member name, and member ID are required');
    }

    // Format phone number (basic validation)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Invalid phone number format');
    }

    return await this.smsService.sendBirthdaySMS(phoneNumber, memberName);
  }
}

export class SendSMSUseCase {
  constructor(private smsService: ISMSService) {}

  async execute(phoneNumber: string, message: string, memberId: string): Promise<SMSResponse> {
    if (!phoneNumber || !message || !memberId) {
      throw new Error('Phone number, message, and member ID are required');
    }

    if (message.length > 1000) {
      throw new Error('Message too long (max 1000 characters)');
    }

    return await this.smsService.sendSMS({ phoneNumber, message, memberId });
  }
}
