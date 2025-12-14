export interface Birthday {
  memberId: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string; // MM-DD format
  month: number;
  day: number;
}

export interface BirthdaySMSRequest {
  memberId: string;
  phoneNumber: string;
  memberName: string;
}

export interface SMSRequest {
  phoneNumber: string;
  message: string;
  memberId: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
