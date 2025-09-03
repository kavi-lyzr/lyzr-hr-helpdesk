import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, Department } from '@/lib/models';
import { authMiddleware } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Apply auth middleware
    const authResult = await authMiddleware(request);
    if (authResult) {
      return authResult; // Return error response if auth fails
    }

    await dbConnect();

    const body = await request.json();
    const { ticket_id, description, category, priority, department, status } = body;

    // Validate required fields
    if (!ticket_id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Find the ticket
    const ticket = await Ticket.findById(ticket_id);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update only provided fields
    const updateFields: any = {};
    if (description !== undefined) {
      updateFields.description = description;
      // Update title if description changes
      updateFields.title = `${ticket.category || category} - ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`;
    }
    if (category !== undefined) {
      updateFields.category = category;
      // Update title if category changes
      updateFields.title = `${category} - ${ticket.description.substring(0, 50)}${ticket.description.length > 50 ? '...' : ''}`;
    }
    if (priority !== undefined) updateFields.priority = priority;
    if (status !== undefined) updateFields.status = status;
    
    // Handle department by finding the department by name
    if (department !== undefined) {
      let departmentId = null;
      if (department) {
        const foundDepartment = await Department.findOne({
          organizationId: ticket.organizationId,
          name: { $regex: new RegExp(`^${department}$`, 'i') } // Case-insensitive match
        });
        departmentId = foundDepartment?._id;
      }
      updateFields.department = departmentId;
    }

    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticket_id,
      updateFields,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: {
        id: updatedTicket!._id,
        trackingNumber: updatedTicket!.trackingNumber,
        title: updatedTicket!.title,
        description: updatedTicket!.description,
        category: updatedTicket!.category,
        priority: updatedTicket!.priority,
        status: updatedTicket!.status,
        updatedAt: updatedTicket!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
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
