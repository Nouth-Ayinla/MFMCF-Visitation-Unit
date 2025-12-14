export interface Setting {
  id: string;
  settingKey: string;
  settingValue: string | number | boolean;
  description?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingUpdate {
  settingKey: string;
  settingValue: string | number | boolean;
  updatedBy: string;
}
