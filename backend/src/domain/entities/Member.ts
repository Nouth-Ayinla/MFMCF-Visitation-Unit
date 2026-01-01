export interface Member {
  _id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth: string; // MM-DD format or full date
  gender?: 'Male' | 'Female';
  levelId?: string;
  departmentId?: string;
  departmentOther?: string;
  howDidYouHear?: string;
  isFirstTimer: boolean;
  registeredAt: Date;
  promotedToMemberAt?: Date;
  contactedAt?: Date;
  contactedBy?: string;
  followUpNotes?: string;
  lastSmsSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
