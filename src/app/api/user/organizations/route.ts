import { NextRequest, NextResponse } from 'next/server';
import { OrganizationUser, Organization, User } from '@/lib/models';
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

    // Also check by lyzrUserId if no results found
    let additionalOrgUsers = [];
    if (organizationUsers.length === 0) {
      // Find user by lyzrUserId to get their MongoDB _id
      const user = await User.findOne({ lyzrUserId: userId });
      if (user) {
        additionalOrgUsers = await OrganizationUser.find({ 
          userId: user._id.toString()
        }).populate('organizationId');
      }
    }

    // Also get organizations created by the user (they might not be in OrganizationUser table yet)
    let createdOrganizations = await Organization.find({ 
      createdBy: userId 
    });

    // If no results, try with lyzrUserId lookup
    if (createdOrganizations.length === 0) {
      const user = await User.findOne({ lyzrUserId: userId });
      if (user) {
        createdOrganizations = await Organization.find({ 
          createdBy: user._id.toString()
        });
      }
    }

    // Combine all organization users (including additional ones found by lyzrUserId)
    const allOrgUsers = [...organizationUsers, ...additionalOrgUsers];

    // Combine and deduplicate
    const allOrganizations = [
      ...allOrgUsers.map(ou => ({
        organization: ou.organizationId,
        role: ou.role,
        joinedAt: ou.joinedAt || ou.createdAt,
      })),
      ...createdOrganizations
        .filter(org => !allOrgUsers.some(ou => ou.organizationId.toString() === org._id.toString()))
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
