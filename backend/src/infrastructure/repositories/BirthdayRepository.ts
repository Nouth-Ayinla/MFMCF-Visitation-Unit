import { IBirthdayRepository } from '@domain/repositories/IBirthdayRepository';
import { Birthday } from '@domain/entities/Birthday';
import { MemberModel } from '../database/models/MemberModel';

export class BirthdayRepository implements IBirthdayRepository {
  async getBirthdaysByMonth(month: number): Promise<Birthday[]> {
    const members = await MemberModel.find({
      dateOfBirth: { $ne: null, $exists: true }
    })
      .select('_id fullName phoneNumber dateOfBirth')
      .lean();

    const birthdays: Birthday[] = [];

    for (const member of members) {
      if (member.dateOfBirth) {
        const [birthMonth, day] = member.dateOfBirth.split('-').map(Number);
        
        if (birthMonth === month) {
          birthdays.push({
            memberId: member._id.toString(),
            fullName: member.fullName,
            phoneNumber: member.phoneNumber,
            dateOfBirth: member.dateOfBirth,
            month: birthMonth,
            day
          });
        }
      }
    }

    // Sort by day
    birthdays.sort((a, b) => a.day - b.day);

    return birthdays;
  }

  async getAllBirthdays(): Promise<Birthday[]> {
    const members = await MemberModel.find({
      dateOfBirth: { $ne: null, $exists: true }
    })
      .select('_id fullName phoneNumber dateOfBirth')
      .lean();

    const birthdays: Birthday[] = [];

    for (const member of members) {
      if (member.dateOfBirth) {
        const [month, day] = member.dateOfBirth.split('-').map(Number);
        
        birthdays.push({
          memberId: member._id.toString(),
          fullName: member.fullName,
          phoneNumber: member.phoneNumber,
          dateOfBirth: member.dateOfBirth,
          month,
          day
        });
      }
    }

    // Sort by month, then day
    birthdays.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

    return birthdays;
  }
}
