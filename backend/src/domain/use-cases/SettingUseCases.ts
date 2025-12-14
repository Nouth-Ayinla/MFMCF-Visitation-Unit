import { ISettingRepository } from '../repositories/ISettingRepository';
import { Setting, SettingUpdate } from '../entities/Setting';

export class GetSettingsUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute(): Promise<Setting[]> {
    return await this.settingRepository.findAll();
  }
}

export class UpdateSettingsUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute(updates: SettingUpdate[]): Promise<Setting[]> {
    if (!updates || updates.length === 0) {
      throw new Error('No settings to update');
    }

    const validKeys = [
      'fellowship_name',
      'contact_email',
      'attendance_reminder_enabled',
      'first_timer_follow_up_days'
    ];

    const updatedSettings: Setting[] = [];

    for (const update of updates) {
      if (!validKeys.includes(update.settingKey)) {
        throw new Error(`Invalid setting key: ${update.settingKey}`);
      }

      // Validate setting values
      if (update.settingKey === 'fellowship_name' && typeof update.settingValue !== 'string') {
        throw new Error('fellowship_name must be a string');
      }

      if (update.settingKey === 'contact_email') {
        if (typeof update.settingValue !== 'string') {
          throw new Error('contact_email must be a string');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(update.settingValue)) {
          throw new Error('Invalid email format');
        }
      }

      if (update.settingKey === 'attendance_reminder_enabled' && typeof update.settingValue !== 'boolean') {
        throw new Error('attendance_reminder_enabled must be a boolean');
      }

      if (update.settingKey === 'first_timer_follow_up_days') {
        const days = Number(update.settingValue);
        if (isNaN(days) || days < 1 || days > 365) {
          throw new Error('first_timer_follow_up_days must be between 1 and 365');
        }
        update.settingValue = days;
      }

      const updatedSetting = await this.settingRepository.updateByKey(
        update.settingKey,
        update.settingValue,
        update.updatedBy
      );

      if (!updatedSetting) {
        throw new Error(`Failed to update setting: ${update.settingKey}`);
      }

      updatedSettings.push(updatedSetting);
    }

    return updatedSettings;
  }
}
