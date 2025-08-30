import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  lyzrUserId?: string; // ID from Lyzr Studio
  currentOrganization?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    avatar: {
      type: String,
      default: null,
    },
    lyzrUserId: {
      type: String,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
      unique: true,
    },
    currentOrganization: {
      type: String,
      ref: 'Organization',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ lyzrUserId: 1 });

const User: Model<IUser> = mongoose.models?.User || mongoose.model<IUser>('User', UserSchema);

export default User;
