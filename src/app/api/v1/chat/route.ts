import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Organization, User } from '@/lib/models';
import { chatWithLyzrAgent } from '@/lib/lyzr-services';
import { decrypt } from '@/lib/encryption';
import { getOrganizationDepartments } from '@/lib/organization-helpers';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { message, organizationId, userId, sessionId } = body;

    // Validate required fields
    if (!message || !organizationId || !userId) {
      return NextResponse.json(
        { error: 'Message, organization ID, and user ID are required' },
        { status: 400 }
      );
    }

    // Get the organization and verify it has a Lyzr agent
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!organization.lyzrAgentId || !organization.lyzrApiKey) {
      return NextResponse.json(
        { error: 'AI assistant not configured for this organization' },
        { status: 400 }
      );
    }

    // Get the user for context
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Decrypt the API key
    const decryptedApiKey = decrypt(organization.lyzrApiKey);

    // Get departments for the organization
    const departments = await getOrganizationDepartments(organizationId);
    const departmentsList = departments.length > 0 ? departments.join(', ') : 'HR, IT, Operations, Finance';

    // Format current date and time
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Prepare system prompt variables
    const systemPromptVariables = {
      organization_name: organization.name,
      prompt: organization.systemInstruction || 'Provide helpful and professional HR assistance.',
      departments: departmentsList,
      datetime: formattedDateTime,
      user_details: `Name: ${user.name}, Email: ${user.email}, Role: Employee requesting assistance`
    };

    // Chat with the Lyzr agent
    const chatResponse = await chatWithLyzrAgent(
      decryptedApiKey,
      organization.lyzrAgentId,
      message,
      systemPromptVariables,
      userId,
      sessionId
    );

    return NextResponse.json({
      success: true,
      response: chatResponse.response,
      sessionId: chatResponse.session_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Failed to chat with agent')) {
        return NextResponse.json(
          { error: 'AI assistant is temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
