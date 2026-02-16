import mongoose, { Document, Schema } from 'mongoose';

export type ChatMessageRole = 'user' | 'assistant';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: ChatMessageRole;
  content: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching messages in order
MessageSchema.index({ conversationId: 1, timestamp: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema);
