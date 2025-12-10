import { IMemberRepository } from '../repositories/IMemberRepository';

export class RegisterMemberUseCase {
  constructor(private memberRepository: IMemberRepository) {}

  async execute(data: {
    fullName: string;
    phoneNumber: string;
    address?: string;
    birthMonth: string;
    birthDay: string;
    gender?: 'Male' | 'Female';
    levelId: string;
    departmentId: string;
    departmentOther?: string;
    howDidYouHear?: string;
    isFirstTimer: boolean;
  }): Promise<{
    id: string;
    fullName: string;
    phoneNumber: string;
    isFirstTimer: boolean;
  }> {
    // Check if phone number already exists
    const existingMember = await this.memberRepository.findByPhoneNumber(data.phoneNumber);
    if (existingMember) {
      throw new Error('Phone number already registered');
    }

    // Create date of birth in MM-DD format
    const dateOfBirth = `${data.birthMonth.padStart(2, '0')}-${data.birthDay.padStart(2, '0')}`;

    // Create member
    const member = await this.memberRepository.create({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      address: data.address,
      dateOfBirth,
      gender: data.gender,
      levelId: data.levelId,
      departmentId: data.departmentId,
      departmentOther: data.departmentOther,
      howDidYouHear: data.howDidYouHear,
      isFirstTimer: data.isFirstTimer,
      registeredAt: new Date(),
    });

    return {
      id: member.id,
      fullName: member.fullName,
      phoneNumber: member.phoneNumber,
      isFirstTimer: member.isFirstTimer,
    };
  }
}
