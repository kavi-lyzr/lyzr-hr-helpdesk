import { NextRequest, NextResponse } from 'next/server';
import { OrganizationUser, Organization } from '@/lib/models';
import dbConnect from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get all organizations where the user is a member
    const organizationUsers = await OrganizationUser.find({ 
      userId: userId 
    }).populate('organizationId');

    // Also get organizations created by the user (they might not be in OrganizationUser table yet)
    const createdOrganizations = await Organization.find({ 
      createdBy: userId 
    });

    // Combine and deduplicate
    const allOrganizations = [
      ...organizationUsers.map(ou => ({
        organization: ou.organizationId,
        role: ou.role,
        joinedAt: ou.joinedAt || ou.createdAt,
      })),
      ...createdOrganizations
        .filter(org => !organizationUsers.some(ou => ou.organizationId.toString() === org._id.toString()))
        .map(org => ({
          organization: org,
          role: 'admin' as const,
          joinedAt: org.createdAt,
        }))
    ];

    return NextResponse.json({
      success: true,
      organizations: allOrganizations,
    });
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
