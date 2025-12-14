import { ISettingRepository } from '@domain/repositories/ISettingRepository';
import { Setting } from '@domain/entities/Setting';
import { SettingModel } from '../database/models/SettingModel';

export class SettingRepository implements ISettingRepository {
  async findAll(): Promise<Setting[]> {
    const settings = await SettingModel.find().lean();
    return settings.map(setting => this.mapToEntity(setting));
  }

  async findByKey(key: string): Promise<Setting | null> {
    const setting = await SettingModel.findOne({ settingKey: key }).lean();
    
    if (!setting) return null;
    
    return this.mapToEntity(setting);
  }

  async updateByKey(
    key: string,
    value: string | number | boolean,
    updatedBy: string
  ): Promise<Setting | null> {
    const setting = await SettingModel.findOneAndUpdate(
      { settingKey: key },
      {
        $set: {
          settingValue: value,
          updatedBy: updatedBy,
        },
      },
      { new: true, upsert: true }
    ).lean();

    if (!setting) return null;

    return this.mapToEntity(setting);
  }

  private mapToEntity(doc: Record<string, unknown> & { _id: { toString(): string } }): Setting {
    return {
      id: doc._id.toString(),
      settingKey: doc.settingKey as string,
      settingValue: doc.settingValue as string | number | boolean,
      description: doc.description as string | undefined,
      updatedBy: (doc.updatedBy as { toString(): string } | undefined)?.toString(),
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}
