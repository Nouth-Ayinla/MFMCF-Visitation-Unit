import { Member } from '../entities/Member';

export interface IMemberRepository {
  findByPhoneNumber(phoneNumber: string): Promise<Member | null>;
  findById(id: string): Promise<Member | null>;
  create(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member>;
  update(id: string, data: Partial<Member>): Promise<Member | null>;
  findAll(filters?: {
    isFirstTimer?: boolean;
    departmentId?: string;
    levelId?: string;
  }): Promise<Member[]>;
}
