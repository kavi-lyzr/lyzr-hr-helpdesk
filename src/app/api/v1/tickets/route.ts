import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, User, Organization, Department, OrganizationUser } from '@/lib/models';
import { getUserRoleInOrganization } from '@/lib/organization-helpers';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const createdBy = searchParams.get('createdBy');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'Organization ID and User ID are required' }, { status: 400 });
    }

    // Get user's role in the organization
    const userRole = await getUserRoleInOrganization(organizationId, userId);
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
    }

    // Build filter based on user role
    let filter: any = { organizationId };

    // Get the user document to get the MongoDB _id
    const user = await User.findOne({ lyzrUserId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role-based filtering
    if (userRole === 'employee') {
      // Employees can only see their own tickets
      filter.createdBy = user._id;
    }
    // Other roles (resolver, manager, admin) can see all organization tickets

    // Apply additional filters
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy && userRole !== 'employee') filter.createdBy = createdBy;

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { trackingNumber: parseInt(search) || 0 }
      ];
    }

    // Get tickets with pagination
    const skip = (page - 1) * limit;
    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('department', 'name')
      .populate('organizationId', 'name');

    // Get total count for pagination
    const totalTickets = await Ticket.countDocuments(filter);

    // Get ticket statistics
    const stats = await Ticket.aggregate([
      { $match: { organizationId: organizationId, ...(userRole === 'employee' ? { createdBy: user._id } : {}) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total: totalTickets,
        totalPages: Math.ceil(totalTickets / limit)
      },
      statistics: statusCounts
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { title, description, category, priority, department, organizationId, userId } = body;

    if (!title || !description || !organizationId || !userId) {
      return NextResponse.json(
        { error: 'Title, description, organization ID, and user ID are required' },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const userRole = await getUserRoleInOrganization(organizationId, userId);
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
    }

    // Get the user document to get the MongoDB _id
    const user = await User.findOne({ lyzrUserId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find department if provided
    let departmentId = null;
    if (department) {
      const foundDepartment = await Department.findOne({
        organizationId,
        name: { $regex: new RegExp(`^${department}$`, 'i') }
      });
      departmentId = foundDepartment?._id;
    }

    const ticket = new Ticket({
      title,
      description,
      category: category || 'General',
      priority: priority || 'medium',
      department: departmentId,
      status: 'open',
      createdBy: user._id,
      organizationId,
      assignedTo: [],
      tags: category ? [category.toLowerCase()] : [],
    });

    await ticket.save();

    // Populate the ticket before returning
    await ticket.populate('createdBy', 'name email avatar');
    await ticket.populate('department', 'name');

    return NextResponse.json({
      success: true,
      message: 'Ticket created successfully',
      ticket
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
