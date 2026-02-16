import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Conversation } from '@/lib/models';
import { getUserById } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: 'organizationId and userId are required' },
        { status: 400 }
      );
    }

    // Resolve userId (could be Lyzr ID string or MongoDB ObjectId)
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const conversations = await Conversation.find({
      organizationId,
      userId: user._id,
    })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
