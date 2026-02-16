import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Organization, OrganizationUser, Conversation, Message } from '@/lib/models';
import { streamChatWithAgent, updateLyzrAgent, createLyzrAgent, createVersionedTools, type ToolContext } from '@/lib/lyzr-services';
import { decrypt } from '@/lib/encryption';
import { getOrganizationDepartments } from '@/lib/organization-helpers';
import { getUserById } from '@/lib/auth-helpers';
import { LATEST_AGENT_VERSION, LATEST_TOOL_VERSION } from '@/lib/agent-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { message, organizationId, userId, conversationId } = body;

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

    // Get the user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the user's OrganizationUser record
    const organizationUser = await OrganizationUser.findOne({
      organizationId,
      userId: user._id,
    });

    if (!organizationUser) {
      return NextResponse.json(
        { error: 'User not found in this organization' },
        { status: 404 }
      );
    }

    const userToken = organizationUser._id.toString();
    const decryptedApiKey = decrypt(organization.lyzrApiKey);

    // --- Tool version check & auto-update ---
    // Tools are recreated (not updated) with a version suffix, then the agent is updated with new tool IDs
    const currentToolVersion = organization.toolVersion || '0.0.0';
    let toolsUpdated = false;
    if (currentToolVersion !== LATEST_TOOL_VERSION) {
      console.log(`Tool version mismatch for org "${organization.name}": ${currentToolVersion} → ${LATEST_TOOL_VERSION}`);
      try {
        const toolContext: ToolContext = {
          userId: user._id.toString(),
          userEmail: user.email,
          organizationId: organizationId,
          organizationName: organization.name,
        };
        const newTools = await createVersionedTools(
          decryptedApiKey,
          organization.name,
          toolContext,
          LATEST_TOOL_VERSION,
        );
        organization.lyzrToolIds = newTools.tool_ids;
        organization.toolVersion = LATEST_TOOL_VERSION;
        toolsUpdated = true;
        await organization.save();
        console.log(`Tools updated to v${LATEST_TOOL_VERSION} for org "${organization.name}":`, newTools.tool_ids);
      } catch (toolError) {
        console.error('Failed to update tools (continuing with current):', toolError);
      }
    }

    // --- Agent version check & auto-update ---
    // Also re-update agent if tools changed (so it picks up new tool IDs)
    const currentAgentVersion = organization.agentVersion || '0.0.0';
    if ((currentAgentVersion !== LATEST_AGENT_VERSION || toolsUpdated) && organization.lyzrAgentId) {
      console.log(`Agent version mismatch for org "${organization.name}": ${currentAgentVersion} → ${LATEST_AGENT_VERSION}${toolsUpdated ? ' (tools also updated)' : ''}`);
      try {
        await updateLyzrAgent(
          decryptedApiKey,
          organization.lyzrAgentId,
          organization.name,
          organization.lyzrKnowledgeBaseId || '',
          organization.lyzrToolIds || [],
        );
        organization.agentVersion = LATEST_AGENT_VERSION;
        await organization.save();
        console.log(`Agent updated to version ${LATEST_AGENT_VERSION} for org "${organization.name}"`);
      } catch (updateError: any) {
        if (updateError.code === 'AGENT_NOT_FOUND') {
          console.log(`Agent not found, recreating for org "${organization.name}"`);
          try {
            const newAgent = await createLyzrAgent(
              decryptedApiKey,
              organization.name,
              organization.lyzrKnowledgeBaseId || '',
              organization.lyzrToolIds || [],
              organization.systemInstruction,
            );
            organization.lyzrAgentId = newAgent.agent_id;
            organization.agentVersion = LATEST_AGENT_VERSION;
            await organization.save();
            console.log(`Agent recreated with ID ${newAgent.agent_id}`);
          } catch (createError) {
            console.error('Failed to recreate agent:', createError);
          }
        } else {
          console.error('Failed to update agent (continuing with current):', updateError);
        }
      }
    }

    // Get departments
    const departments = await getOrganizationDepartments(organizationId);
    const departmentsList = departments.length > 0 ? departments.join(', ') : 'HR, IT, Operations, Finance';

    // Format datetime
    const formattedDateTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const systemPromptVariables = {
      organization_name: organization.name,
      prompt: organization.systemInstruction || 'Provide helpful and professional HR assistance.',
      departments: departmentsList,
      datetime: formattedDateTime,
      user_details: `Name: ${user.name}, Email: ${user.email}, Role: ${organizationUser.role} requesting assistance`,
      user_token: userToken,
    };

    // --- Conversation & Message persistence ---
    let conversation;
    let isNewConversation = false;

    if (conversationId) {
      // Existing conversation
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: user._id,
        organizationId,
      });
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // New conversation — generate sessionId server-side
      isNewConversation = true;
      const sessionId = `${organization.lyzrAgentId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;

      conversation = new Conversation({
        userId: user._id,
        organizationId,
        title,
        sessionId,
        lastMessageAt: new Date(),
      });
      await conversation.save();
    }

    // Save user message to DB immediately
    const userMessage = new Message({
      conversationId: conversation._id,
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    await userMessage.save();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // --- Stream from Lyzr and relay as SSE ---
    const lyzrStream = await streamChatWithAgent(
      decryptedApiKey,
      organization.lyzrAgentId,
      message,
      user.email,
      conversation.sessionId,
      systemPromptVariables,
    );

    let collectedResponse = '';
    let isStreamClosed = false;

    const combinedStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = lyzrStream.getReader();
        let buffer = ''; // Buffer for partial SSE lines from Lyzr

        const safeEnqueue = (data: Uint8Array) => {
          if (isStreamClosed) return false;
          try {
            controller.enqueue(data);
            return true;
          } catch {
            isStreamClosed = true;
            return false;
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Lyzr stream returns SSE format: "data: token\n"
            // Split by newlines and process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete last line in buffer

            for (const line of lines) {
              // Use trimStart to preserve trailing spaces in token content
              const stripped = line //.trimStart();
              if (!stripped || stripped === '[DONE]') continue;

              if (stripped.startsWith('data: ')) {
                const token = stripped.slice(6);
                if (token === '' || token === '[DONE]') continue;

                // Unescape the token from Lyzr's SSE encoding
                const unescaped = token.replace(/\\n/g, '\n').replace(/\\\\/g, '\\');

                // Collect clean text for DB
                collectedResponse += unescaped;

                // Re-emit as our SSE (forward the token as-is, already escaped)
                if (!safeEnqueue(encoder.encode(`data: ${token}\n\n`))) break;
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trimStart()) {
            const stripped = buffer.trimStart();
            if (stripped.startsWith('data: ')) {
              const token = stripped.slice(6);
              if (token !== '' && token !== '[DONE]') {
                const unescaped = token.replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
                collectedResponse += unescaped;
                safeEnqueue(encoder.encode(`data: ${token}\n\n`));
              }
            }
          }

          // Send done marker
          safeEnqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          console.error('Error reading Lyzr stream:', err);
          safeEnqueue(encoder.encode('data: [ERROR]\n\n'));
        }

        if (!isStreamClosed) {
          controller.close();
        }
      },
    });

    // Use TransformStream to save assistant message after stream completes
    const saveTransform = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      async flush() {
        try {
          if (collectedResponse.trim()) {
            const assistantMessage = new Message({
              conversationId: conversation._id,
              role: 'assistant',
              content: collectedResponse,
              timestamp: new Date(),
            });
            await assistantMessage.save();
            conversation.lastMessageAt = new Date();
            await conversation.save();
            console.log('Saved assistant message to DB, length:', collectedResponse.length);
          }
        } catch (err) {
          console.error('Error saving assistant message to DB:', err);
        }
      },
    });

    const finalStream = combinedStream.pipeThrough(saveTransform);

    return new Response(finalStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Conversation-Id': conversation._id.toString(),
        'X-Is-New': isNewConversation.toString(),
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);

    if (error instanceof Error && error.message.includes('Failed to stream chat with agent')) {
      return NextResponse.json(
        { error: 'AI assistant is temporarily unavailable', details: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat message', details: error instanceof Error ? error.message : 'Unknown error' },
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
