export interface User {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'visitation_coordinator' | 'assistant_coordinator' | 'president' | 'central' | 'level_coordinator' | 'admin' | 'user';
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  departmentId?: string;
  levelId?: string;
  createdAt: Date;
  updatedAt: Date;
}