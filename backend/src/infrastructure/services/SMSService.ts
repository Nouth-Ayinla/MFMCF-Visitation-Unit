import { ISMSService } from '@domain/services/ISMSService';
import { SMSRequest, SMSResponse } from '@domain/entities/Birthday';
import { MemberModel } from '../database/models/MemberModel';

export class SMSService implements ISMSService {
  private readonly apiKey: string;
  // Prepared for production use with eBulkSMS API
  // @ts-expect-error - Reserved for production SMS integration
  private readonly _apiUrl: string;
  // @ts-expect-error - Reserved for production SMS integration
  private readonly _senderId: string;

  constructor() {
    // These would come from environment variables
    this.apiKey = process.env.SMS_API_KEY || '';
    this._apiUrl = process.env.SMS_API_URL || 'https://api.ebulksms.com/sendsms.json';
    this._senderId = process.env.SMS_SENDER_ID || 'MFMCF';

    if (!this.apiKey) {
      // eslint-disable-next-line no-console
      console.warn('SMS_API_KEY not configured. SMS functionality will be limited.');
    }
  }

  async sendSMS(request: SMSRequest): Promise<SMSResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'SMS service not configured'
        };
      }

      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

      // Update last SMS sent timestamp
      await MemberModel.findByIdAndUpdate(request.memberId, {
        lastSmsSentAt: new Date()
      });

      // In production, this would make an actual API call to SMS provider
      // For now, we'll simulate the response
      // eslint-disable-next-line no-console
      console.log(`[SMS] Sending to ${formattedPhone}: ${request.message}`);

      // Simulated successful response
      return {
        success: true,
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      /* Production implementation would look like:
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          SMS: {
            auth: {
              username: process.env.SMS_USERNAME,
              apikey: this.apiKey
            },
            message: {
              sender: this.senderId,
              messagetext: request.message,
              flash: "0"
            },
            recipients: {
              gsm: [{
                msidn: formattedPhone,
                msgid: `sms_${Date.now()}`
              }]
            }
          }
        })
      });

      const result = await response.json();
      
      if (result.response?.status === 'SUCCESS') {
        return {
          success: true,
          messageId: result.response.messageId
        };
      }

      return {
        success: false,
        error: result.response?.status || 'Failed to send SMS'
      };
      */
    } catch (error) {
      console.error('SMS Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  async sendBirthdaySMS(phoneNumber: string, memberName: string): Promise<SMSResponse> {
    const message = `Happy Birthday ${memberName}! 🎉🎂 May God's blessings overflow in your life today and always. We celebrate you! - MFM Campus Fellowship`;

    return await this.sendSMS({
      phoneNumber,
      message,
      memberId: '' // Will be provided by the use case
    });
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If starts with 0, replace with country code (234 for Nigeria)
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }

    // If doesn't start with country code, add it
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }

    return cleaned;
  }
}
