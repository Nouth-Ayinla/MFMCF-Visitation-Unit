import { Setting } from '../entities/Setting';

export interface ISettingRepository {
  findAll(): Promise<Setting[]>;
  findByKey(key: string): Promise<Setting | null>;
  updateByKey(key: string, value: string | number | boolean, updatedBy: string): Promise<Setting | null>;
}
