import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, User, Organization, Department } from '@/lib/models';
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

    const body = await request.json();
    const { description, category, priority, department } = body;

    // Validate required fields
    if (!description || !category || !priority || !department) {
      return NextResponse.json(
        { error: 'Description, category, priority, and department are required' },
        { status: 400 }
      );
    }

    // Use context from validated token
    const user = await User.findById(context.userId);
    const organization = await Organization.findById(context.organizationId);

    if (!user || !organization) {
      return NextResponse.json(
        { error: 'User or organization not found' },
        { status: 404 }
      );
    }

    // Find the department by name within the organization
    let departmentId = null;
    if (department) {
      const foundDepartment = await Department.findOne({
        organizationId: organization._id,
        name: { $regex: new RegExp(`^${department}$`, 'i') } // Case-insensitive match
      });
      departmentId = foundDepartment?._id;
    }

    // Create the ticket
    const ticket = new Ticket({
      title: `${category} - ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
      description,
      category,
      priority,
      department: departmentId, // Store the department ObjectId reference
      status: 'open',
      createdBy: user._id,
      organizationId: organization._id,
      assignedTo: [], // Will be assigned later
      tags: [category.toLowerCase()],
    });

    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        id: ticket._id,
        trackingNumber: ticket.trackingNumber,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
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
