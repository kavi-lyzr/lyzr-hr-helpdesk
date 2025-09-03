import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket } from '@/lib/models';
import { authMiddleware } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Apply auth middleware
    const authResult = await authMiddleware(request);
    if (authResult) {
      return authResult; // Return error response if auth fails
    }

    await dbConnect();

    // Get all tickets (in production, this should be filtered by user/organization)
    // For now, we'll return the most recent 10 tickets
    const tickets = await Ticket.find({})
      .sort({ createdAt: -1 })
      .limit(10)
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
