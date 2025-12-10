import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  password: string;
  fullName: string;
  role: 'visitation_coordinator' | 'assistant_coordinator' | 'president' | 'central' | 'level_coordinator' | 'admin' | 'user';
  isApproved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  departmentId?: mongoose.Types.ObjectId;
  levelId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['visitation_coordinator', 'assistant_coordinator', 'president', 'central', 'level_coordinator', 'admin', 'user'],
      default: 'user',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    levelId: {
      type: Schema.Types.ObjectId,
      ref: 'Level',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isApproved: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);