import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket } from '@/lib/models';
import { validateToolToken } from '@/lib/middleware/tool-auth';

export async function POST(request: NextRequest) {
  try {
    // Validate tool token and extract context
    const tokenValidation = validateToolToken(request);
    if (!tokenValidation.success || !tokenValidation.context) {
      return NextResponse.json(
        { error: tokenValidation.error || 'Tool call not authorized' },
        { status: 401 }
      );
    }

    const { context } = tokenValidation;

    await dbConnect();

    // Get tickets filtered by organization from context
    // TODO: Add pagination
    const tickets = await Ticket.find({
      organizationId: context.organizationId
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('createdBy', 'name email')
      .populate('organizationId', 'name')
      .populate('assignedTo', 'name email');

    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id,
      trackingNumber: ticket.trackingNumber,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdBy: ticket.createdBy,
      organizationId: ticket.organizationId,
      assignedTo: ticket.assignedTo,
      tags: ticket.tags,
      dueDate: ticket.dueDate,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      message: 'Tickets retrieved successfully',
      tickets: formattedTickets,
      total: formattedTickets.length,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
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
