import mongoose, { Schema, Document } from 'mongoose';

export interface ISettingDocument extends Document {
  settingKey: string;
  settingValue: string | number | boolean;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISettingDocument>(
  {
    settingKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    settingValue: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const SettingModel = mongoose.model<ISettingDocument>('Setting', SettingSchema);
