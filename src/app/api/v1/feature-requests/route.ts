import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import FeatureRequest from '@/lib/models/FeatureRequest';
import { getUserById } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      email,
      message,
      app,
      pagePath,
      userId,
    }: {
      email: string;
      message: string;
      app: string;
      pagePath?: string | null;
      userId?: string | null;
    } = body;

    if (!email || !message || !app) {
      return NextResponse.json(
        { success: false, error: 'Required fields: email, message, app' },
        { status: 400 }
      );
    }

    await dbConnect();

    let resolvedUserId = null as any;
    if (userId) {
      const user = await getUserById(userId);
      if (user) {
        resolvedUserId = user._id;
      }
    }

    const doc = new FeatureRequest({
      email: email.toLowerCase(),
      message,
      app,
      pagePath: pagePath || null,
      userId: resolvedUserId,
      status: 'open',
    });

    await doc.save();

    return NextResponse.json({ success: true, id: doc._id });
  } catch (error) {
    console.error('Error creating feature request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create feature request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true });
}

