import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceDocument extends Document {
  memberId: mongoose.Types.ObjectId;
  attendanceDate: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    attendanceDate: {
      type: String,
      required: true,
      index: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index to prevent duplicate attendance on same date
AttendanceSchema.index({ memberId: 1, attendanceDate: 1 }, { unique: true });
AttendanceSchema.index({ attendanceDate: -1 });
AttendanceSchema.index({ memberId: 1, createdAt: -1 });

export const AttendanceModel = mongoose.model<IAttendanceDocument>('Attendance', AttendanceSchema);
