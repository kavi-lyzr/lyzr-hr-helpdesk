import mongoose, { Document, Model, Schema } from 'mongoose';

export type FileType = 'pdf' | 'docx' | 'txt' | 'url';

export interface IKnowledgeBase extends Document {
  _id: string;
  title: string;
  fileId?: string; // Lyzr Studio file identifier
  fileName?: string;
  fileType: FileType;
  fileUrl?: string; // For URL type or file storage
  fileSize?: number; // In bytes
  organizationId: string;
  uploadedBy: string;
  isActive: boolean;
  tags?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema: Schema<IKnowledgeBase> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Knowledge base title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    fileId: {
      type: String,
      trim: true,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'txt', 'url'],
      required: [true, 'File type is required'],
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
    },
    organizationId: {
      type: String,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    uploadedBy: {
      type: String,
      ref: 'User',
      required: [true, 'Uploaded by is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
KnowledgeBaseSchema.index({ organizationId: 1, isActive: 1 });
KnowledgeBaseSchema.index({ organizationId: 1, tags: 1 });
KnowledgeBaseSchema.index({ fileId: 1 });
KnowledgeBaseSchema.index({ uploadedBy: 1 });

const KnowledgeBase: Model<IKnowledgeBase> = mongoose.models?.KnowledgeBase || mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);

export default KnowledgeBase;
