import { SMSRequest, SMSResponse } from '../entities/Birthday';

export interface ISMSService {
  sendSMS(request: SMSRequest): Promise<SMSResponse>;
  sendBirthdaySMS(phoneNumber: string, memberName: string): Promise<SMSResponse>;
}
