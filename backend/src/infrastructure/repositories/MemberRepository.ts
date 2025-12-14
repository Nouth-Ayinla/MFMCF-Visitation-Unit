import { IMemberRepository } from '@domain/repositories/IMemberRepository';
import { Member } from '@domain/entities/Member';
import { MemberModel } from '../database/models/MemberModel';

export class MemberRepository implements IMemberRepository {
  async findByPhoneNumber(phoneNumber: string): Promise<Member | null> {
    const member = await MemberModel.findOne({ phoneNumber }).lean();

    if (!member) return null;

    return this.mapToEntity(member);
  }

  async findById(id: string): Promise<Member | null> {
    const member = await MemberModel.findById(id).lean();

    if (!member) return null;

    return this.mapToEntity(member);
  }

  async create(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    const member = await MemberModel.create(memberData);
    
    return this.mapToEntity({ ...member.toObject(), _id: member._id });
  }

  async update(id: string, data: Partial<Member>): Promise<Member | null> {
    const member = await MemberModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true } 
    ).lean();

    if (!member) return null;

    return this.mapToEntity(member);
  }

  async findAll(filters?: {
    isFirstTimer?: boolean;
    departmentId?: string;
    levelId?: string;
  }): Promise<Member[]> {
    const query: Record<string, unknown> = {};

    if (filters?.isFirstTimer !== undefined) {
      query.isFirstTimer = filters.isFirstTimer;
    }

    if (filters?.departmentId) {
      query.departmentId = filters.departmentId;
    }

    if (filters?.levelId) {
      query.levelId = filters.levelId;
    }

    const members = await MemberModel.find(query).lean();

    return members.map(member => this.mapToEntity(member));
  }

  async delete(id: string): Promise<boolean> {
    const result = await MemberModel.findByIdAndDelete(id);
    return result !== null;
  }

  private mapToEntity(doc: Record<string, unknown> & { _id: { toString(): string } }): Member {
    return {
      id: doc._id.toString(),
      fullName: doc.fullName as string,
      phoneNumber: doc.phoneNumber as string,
      address: doc.address as string | undefined,
      dateOfBirth: doc.dateOfBirth as string,
      gender: doc.gender as 'Male' | 'Female' | undefined,
      levelId: (doc.levelId as { toString(): string } | undefined)?.toString(),
      departmentId: (doc.departmentId as { toString(): string } | undefined)?.toString(),
      departmentOther: doc.departmentOther as string | undefined,
      howDidYouHear: doc.howDidYouHear as string | undefined,
      isFirstTimer: doc.isFirstTimer as boolean,
      registeredAt: doc.registeredAt as Date,
      promotedToMemberAt: doc.promotedToMemberAt as Date | undefined,
      contactedAt: doc.contactedAt as Date | undefined,
      contactedBy: (doc.contactedBy as { toString(): string } | undefined)?.toString(),
      followUpNotes: doc.followUpNotes as string | undefined,
      lastSmsSentAt: doc.lastSmsSentAt as Date | undefined,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}
