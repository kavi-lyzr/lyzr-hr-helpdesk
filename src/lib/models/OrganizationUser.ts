import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'employee' | 'resolver' | 'manager' | 'admin';

export interface IOrganizationUser extends Document {
  _id: string;
  organizationId: string;
  email: string;
  userId?: string; // null if user hasn't accepted invitation yet
  role: UserRole;
  createdBy: string;
  inviteToken?: string; // For invitation flow
  invitedAt?: Date;
  joinedAt?: Date;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationUserSchema: Schema<IOrganizationUser> = new Schema(
  {
    organizationId: {
      type: String,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    userId: {
      type: String,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      enum: ['employee', 'resolver', 'manager', 'admin'],
      required: [true, 'Role is required'],
      default: 'employee',
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    inviteToken: {
      type: String,
      default: null,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    joinedAt: {
      type: Date,
      default: null,
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

// Ensure unique combination of organization and email
OrganizationUserSchema.index({ organizationId: 1, email: 1 }, { unique: true });
OrganizationUserSchema.index({ organizationId: 1, userId: 1 });
OrganizationUserSchema.index({ email: 1 });
OrganizationUserSchema.index({ inviteToken: 1 });

const OrganizationUser: Model<IOrganizationUser> = mongoose.models?.OrganizationUser || mongoose.model<IOrganizationUser>('OrganizationUser', OrganizationUserSchema);

export default OrganizationUser;
