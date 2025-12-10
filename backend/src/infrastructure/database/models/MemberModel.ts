import mongoose, { Schema, Document } from 'mongoose';

export interface IMemberDocument extends Document {
  fullName: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth: string;
  gender?: 'Male' | 'Female';
  levelId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  departmentOther?: string;
  howDidYouHear?: string;
  isFirstTimer: boolean;
  registeredAt: Date;
  promotedToMemberAt?: Date;
  contactedAt?: Date;
  contactedBy?: mongoose.Types.ObjectId;
  followUpNotes?: string;
  lastSmsSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMemberDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
    },
    levelId: {
      type: Schema.Types.ObjectId,
      ref: 'Level',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    departmentOther: {
      type: String,
      trim: true,
    },
    howDidYouHear: {
      type: String,
      trim: true,
    },
    isFirstTimer: {
      type: Boolean,
      default: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    promotedToMemberAt: {
      type: Date,
    },
    contactedAt: {
      type: Date,
    },
    contactedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    followUpNotes: {
      type: String,
    },
    lastSmsSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MemberSchema.index({ phoneNumber: 1 }, { unique: true });
MemberSchema.index({ isFirstTimer: 1 });
MemberSchema.index({ departmentId: 1 });
MemberSchema.index({ levelId: 1 });
MemberSchema.index({ registeredAt: -1 });

export const MemberModel = mongoose.model<IMemberDocument>('Member', MemberSchema);
