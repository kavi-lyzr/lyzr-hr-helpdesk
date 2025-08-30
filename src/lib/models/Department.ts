import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDepartment extends Document {
  _id: string;
  name: string;
  organizationId: string;
  description?: string;
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
      type: String,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
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
