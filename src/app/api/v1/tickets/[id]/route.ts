import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import { Ticket, Department, OrganizationUser } from '@/lib/models';
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

    const ticket = await Ticket.findById(params.id)
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('department', 'name description')
      .populate('organizationId', 'name');

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if user has access to this ticket
    const organizationId = typeof ticket.organizationId === 'object' && 'name' in ticket.organizationId 
      ? ticket.organizationId._id.toString() 
      : ticket.organizationId.toString();
    const userRole = await getUserRoleInOrganization(organizationId, authResult.user._id.toString());
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Employees can only view their own tickets
    const createdById = typeof ticket.createdBy === 'object' && 'name' in ticket.createdBy 
      ? ticket.createdBy._id.toString() 
      : ticket.createdBy.toString();
    if (userRole === 'employee' && createdById !== authResult.user._id.toString()) {
      return NextResponse.json({ error: 'Access denied to this ticket' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication required' }, { status: 401 });
  }

  try {
    await dbConnect();

    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check user's role and permissions
    const organizationId = typeof ticket.organizationId === 'object' && 'name' in ticket.organizationId 
      ? ticket.organizationId._id.toString() 
      : ticket.organizationId.toString();
    const userRole = await getUserRoleInOrganization(organizationId, authResult.user._id.toString());
    if (!userRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, priority, department, status, assignedTo, tags, dueDate } = body;

    // Role-based permissions
    const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'resolver';
    const createdById = typeof ticket.createdBy === 'object' && 'name' in ticket.createdBy 
      ? ticket.createdBy._id.toString() 
      : ticket.createdBy.toString();
    const isTicketOwner = createdById === authResult.user._id.toString();

    if (!canEdit && !isTicketOwner) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this ticket' }, { status: 403 });
    }

    // Employees can only mark their own tickets as resolved
    if (userRole === 'employee') {
      if (!isTicketOwner) {
        return NextResponse.json({ error: 'You can only edit your own tickets' }, { status: 403 });
      }
      
      // Employees can only update status to resolved or closed
      if (status && !['resolved', 'closed'].includes(status)) {
        return NextResponse.json({ error: 'Employees can only mark tickets as resolved or closed' }, { status: 403 });
      }
    }

    // Build update object
    const updateFields: any = {};

    if (title !== undefined && canEdit) updateFields.title = title;
    if (description !== undefined && canEdit) updateFields.description = description;
    if (category !== undefined && canEdit) updateFields.category = category;
    if (priority !== undefined && canEdit) updateFields.priority = priority;
    if (status !== undefined) updateFields.status = status;
    if (tags !== undefined && canEdit) updateFields.tags = tags;
    if (dueDate !== undefined && canEdit) updateFields.dueDate = dueDate;

    // Handle department assignment (admin/manager only)
    if (department !== undefined && (userRole === 'admin' || userRole === 'manager')) {
      let departmentId = null;
      if (department) {
        const foundDepartment = await Department.findOne({
          organizationId: organizationId,
          name: { $regex: new RegExp(`^${department}$`, 'i') }
        });
        departmentId = foundDepartment?._id;
      }
      updateFields.department = departmentId;
    }

    // Handle assignment (admin/manager/resolver only)
    if (assignedTo !== undefined && canEdit) {
      // Verify assigned users are valid organization members
      if (Array.isArray(assignedTo)) {
        const validAssignees = await OrganizationUser.find({
          organizationId: organizationId,
          userId: { $in: assignedTo },
          role: { $in: ['resolver', 'admin', 'manager'] },
          status: 'active'
        });
        
        if (validAssignees.length !== assignedTo.length) {
          return NextResponse.json({ error: 'Some assigned users are not valid resolvers' }, { status: 400 });
        }
      }
      updateFields.assignedTo = assignedTo;
    }

    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('department', 'name description')
      .populate('organizationId', 'name');

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
