import mongoose, { Document, Model, Schema } from 'mongoose';

export type TicketStatus = 'open' | 'in_progress' | 'pending_information' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITicket extends Document {
  _id: string;
  trackingNumber: number;
  title: string;
  description: string;
  category?: string;
  department?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string[]; // Array of user IDs
  createdBy: string;
  organizationId: string;
  tags?: string[];
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema<ITicket> = new Schema(
  {
    trackingNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    department: {
      type: String,
      ref: 'Department',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: [true, 'Priority is required'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'pending_information', 'resolved', 'closed'],
      required: [true, 'Status is required'],
      default: 'open',
    },
    assignedTo: [{
      type: String,
      ref: 'User',
    }],
    createdBy: {
      type: String,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    organizationId: {
      type: String,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    dueDate: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-increment tracking number
TicketSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const lastTicket = await mongoose.model('Ticket').findOne().sort({ trackingNumber: -1 });
      this.trackingNumber = lastTicket ? lastTicket.trackingNumber + 1 : 1000;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Update resolved/closed timestamps
TicketSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

// Create indexes for better performance
TicketSchema.index({ trackingNumber: 1 });
TicketSchema.index({ organizationId: 1, status: 1 });
TicketSchema.index({ organizationId: 1, createdBy: 1 });
TicketSchema.index({ organizationId: 1, assignedTo: 1 });
TicketSchema.index({ organizationId: 1, department: 1 });
TicketSchema.index({ createdAt: -1 });

const Ticket: Model<ITicket> = mongoose.models?.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;
