import { Birthday } from '../entities/Birthday';

export interface IBirthdayRepository {
  getBirthdaysByMonth(month: number): Promise<Birthday[]>;
  getAllBirthdays(): Promise<Birthday[]>;
}
