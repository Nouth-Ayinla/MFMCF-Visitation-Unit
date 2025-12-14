import { IMemberRepository } from '../repositories/IMemberRepository';
import { Member } from '../entities/Member';

export class GetMembersUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(filters?: {
    isFirstTimer?: boolean;
    departmentId?: string;
    levelId?: string;
  }): Promise<Member[]> {
    return await this.memberRepository.findAll(filters);
  }
}

export class GetMemberByIdUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(id: string): Promise<Member | null> {
    return await this.memberRepository.findById(id);
  }
}

export class UpdateMemberUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(id: string, data: Partial<Member>): Promise<Member> {
    const member = await this.memberRepository.findById(id);
    if (!member) {
      throw new Error('Member not found');
    }

    // If updating phone number, check for duplicates
    if (data.phoneNumber && data.phoneNumber !== member.phoneNumber) {
      const existing = await this.memberRepository.findByPhoneNumber(data.phoneNumber);
      if (existing) {
        throw new Error('Phone number already in use');
      }
    }

    const updated = await this.memberRepository.update(id, data);
    if (!updated) {
      throw new Error('Failed to update member');
    }

    return updated;
  }
}

export class PromoteFirstTimerUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(id: string): Promise<Member> {
    const member = await this.memberRepository.findById(id);
    if (!member) {
      throw new Error('Member not found');
    }

    if (!member.isFirstTimer) {
      throw new Error('Member is already promoted');
    }

    const updated = await this.memberRepository.update(id, {
      isFirstTimer: false,
      promotedToMemberAt: new Date(),
    });

    if (!updated) {
      throw new Error('Failed to promote member');
    }

    return updated;
  }
}

export class UpdateFollowUpNotesUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(id: string, note: string): Promise<Member> {
    const member = await this.memberRepository.findById(id);
    if (!member) {
      throw new Error('Member not found');
    }

    const updated = await this.memberRepository.update(id, {
      followUpNotes: note,
      contactedAt: new Date(),
    });

    if (!updated) {
      throw new Error('Failed to update follow-up notes');
    }

    return updated;
  }
}

export class DeleteMemberUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(id: string): Promise<boolean> {
    const member = await this.memberRepository.findById(id);
    if (!member) {
      throw new Error('Member not found');
    }

    return await this.memberRepository.delete(id);
  }
}
