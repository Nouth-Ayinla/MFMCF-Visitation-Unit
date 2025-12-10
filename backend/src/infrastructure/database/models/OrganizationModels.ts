import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartmentDocument extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILevelDocument extends Document {
  levelNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartmentDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const LevelSchema = new Schema<ILevelDocument>(
  {
    levelNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DepartmentModel = mongoose.model<IDepartmentDocument>('Department', DepartmentSchema);
export const LevelModel = mongoose.model<ILevelDocument>('Level', LevelSchema);
