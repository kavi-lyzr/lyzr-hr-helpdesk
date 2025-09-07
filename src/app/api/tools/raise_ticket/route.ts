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
    const { description, priority, department } = body;

    // Validate required fields - only description is required
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required for creating a ticket' },
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

    // Smart department matching with fuzzy search
    let departmentId = null;
    if (department && department.trim()) {
      const deptName = department.trim();
      
      // First try exact match (case-insensitive)
      let foundDepartment = await Department.findOne({
        organizationId: organization._id,
        name: { $regex: new RegExp(`^${deptName}$`, 'i') }
      });
      
      // If no exact match, try fuzzy matching (contains)
      if (!foundDepartment) {
        foundDepartment = await Department.findOne({
          organizationId: organization._id,
          name: { $regex: new RegExp(deptName, 'i') }
        });
      }
      
      // If still no match, try reverse fuzzy matching (department name contains input)
      if (!foundDepartment) {
        const allDepartments = await Department.find({
          organizationId: organization._id
        });
        
        foundDepartment = allDepartments.find(dept => 
          dept.name.toLowerCase().includes(deptName.toLowerCase()) ||
          deptName.toLowerCase().includes(dept.name.toLowerCase())
        ) || null;
      }
      
      departmentId = foundDepartment?._id;
    }

    // Set smart defaults
    const ticketPriority = priority && ['low', 'medium', 'high', 'urgent'].includes(priority.toLowerCase()) 
      ? priority.toLowerCase() 
      : 'medium';
    
    // Generate a smart title from description
    const generateTitle = (desc: string) => {
      const words = desc.split(' ').slice(0, 8); // First 8 words
      const title = words.join(' ');
      return title.length > 50 ? title.substring(0, 47) + '...' : title;
    };

    // Create the ticket
    const ticket = new Ticket({
      title: generateTitle(description),
      description,
      priority: ticketPriority,
      department: departmentId, // Store the department ObjectId reference (can be null)
      status: 'open',
      createdBy: user._id,
      organizationId: organization._id,
      assignedTo: [], // Will be assigned later
      tags: departmentId ? [] : [], // No automatic tags for now
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
        priority: ticket.priority,
        status: ticket.status,
        department: departmentId ? 'Assigned' : 'Unassigned',
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
