import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, TicketMessage } from '@/lib/models';
import { authMiddleware } from '@/lib/middleware/auth';
import { getUserRoleInOrganization } from '@/lib/organization-helpers';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication required' }, { status: 401 });
  }

  try {
    await dbConnect();

    // First, verify the ticket exists and user has access
    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check user's role and access to ticket
    const organizationId = typeof ticket.organizationId === 'object' && 'name' in ticket.organizationId 
      ? ticket.organizationId._id.toString() 
      : ticket.organizationId.toString();
    const userRole = await getUserRoleInOrganization(organizationId, authResult.user._id.toString());
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Employees can only view messages for their own tickets
    const createdById = typeof ticket.createdBy === 'object' && 'name' in ticket.createdBy 
      ? ticket.createdBy._id.toString() 
      : ticket.createdBy.toString();
    const isTicketOwner = createdById === authResult.user._id.toString();
    const canViewAllMessages = userRole === 'admin' || userRole === 'manager' || userRole === 'resolver';
    
    if (!canViewAllMessages && !isTicketOwner) {
      return NextResponse.json({ error: 'Access denied to this ticket' }, { status: 403 });
    }

    // Build message filter
    const messageFilter: any = { ticketId: params.id };
    
    // If user is an employee and not the ticket owner, they can't see internal messages
    if (userRole === 'employee') {
      messageFilter.isInternal = { $ne: true };
    }

    const messages = await TicketMessage.find(messageFilter)
      .sort({ createdAt: 1 })
      .populate('userId', 'name email avatar');

    return NextResponse.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication required' }, { status: 401 });
  }

  try {
    await dbConnect();

    // First, verify the ticket exists and user has access
    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check user's role and access to ticket
    const organizationId = typeof ticket.organizationId === 'object' && 'name' in ticket.organizationId 
      ? ticket.organizationId._id.toString() 
      : ticket.organizationId.toString();
    const userRole = await getUserRoleInOrganization(organizationId, authResult.user._id.toString());
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { content, isInternal } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Determine message role and permissions
    let messageRole = 'user';
    let canAddMessage = false;
    const createdById = typeof ticket.createdBy === 'object' && 'name' in ticket.createdBy 
      ? ticket.createdBy._id.toString() 
      : ticket.createdBy.toString();
    const isTicketOwner = createdById === authResult.user._id.toString();

    switch (userRole) {
      case 'employee':
        canAddMessage = isTicketOwner; // Employees can only comment on their own tickets
        messageRole = 'user';
        break;
      case 'resolver':
        canAddMessage = true;
        messageRole = 'resolver';
        break;
      case 'manager':
      case 'admin':
        canAddMessage = true;
        messageRole = 'agent';
        break;
    }

    if (!canAddMessage) {
      return NextResponse.json({ error: 'You cannot add messages to this ticket' }, { status: 403 });
    }

    // Employees cannot create internal messages
    const shouldBeInternal = isInternal && userRole !== 'employee';

    const message = new TicketMessage({
      ticketId: params.id,
      role: messageRole,
      content: content.trim(),
      userId: authResult.user._id,
      isInternal: shouldBeInternal || false
    });

    await message.save();

    // Populate the message before returning
    await message.populate('userId', 'name email avatar');

    // Update ticket's updatedAt timestamp
    await Ticket.findByIdAndUpdate(params.id, { updatedAt: new Date() });

    return NextResponse.json({
      success: true,
      message: 'Message added successfully',
      data: message
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding ticket message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
