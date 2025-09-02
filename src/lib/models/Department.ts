import mongoose, { Document, Model, Schema } from 'mongoose';
import { IOrganization } from './Organization';

export interface IDepartment extends Document {
  _id: string;
  name: string;
  organizationId: Schema.Types.ObjectId | IOrganization;
  description?: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema<IDepartment> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    schemaVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique department name within organization
DepartmentSchema.index({ organizationId: 1, name: 1 }, { unique: true });
DepartmentSchema.index({ organizationId: 1 });

const Department: Model<IDepartment> = mongoose.models?.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;
