import { Organization, OrganizationUser, User, type IOrganization, type IOrganizationUser, type UserRole } from '@/lib/models';
import dbConnect from '@/lib/database';

export interface CreateOrganizationData {
  name: string;
  createdBy: string;
  systemInstruction?: string;
  avatar?: string;
}

/**
 * Create a new organization and add the creator as admin
 */
export async function createOrganization(data: CreateOrganizationData): Promise<IOrganization> {
  await dbConnect();

  try {
    // Create the organization
    const organization = new Organization({
      name: data.name,
      createdBy: data.createdBy,
      systemInstruction: data.systemInstruction,
      avatar: data.avatar,
    });

    await organization.save();

    // Add the creator as an admin in the OrganizationUser table
    try {
      // Get the user to get their email
      const user = await User.findById(data.createdBy);
      if (user) {
        const organizationUser = new OrganizationUser({
          organizationId: organization._id,
          email: user.email,
          userId: data.createdBy,
          role: 'admin',
          createdBy: data.createdBy,
          joinedAt: new Date(),
        });
        
        await organizationUser.save();
      }
    } catch (error) {
      console.error('Error adding creator to OrganizationUser:', error);
      // Don't fail the organization creation if this fails
    }

    return organization;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw new Error('Failed to create organization');
  }
}

/**
 * Get organization by ID with creator info
 */
export async function getOrganizationById(organizationId: string): Promise<IOrganization | null> {
  await dbConnect();

  try {
    const organization = await Organization.findById(organizationId).populate('createdBy');
    return organization;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(organizationId: string): Promise<IOrganizationUser[]> {
  await dbConnect();

  try {
    const members = await OrganizationUser.find({ 
      organizationId 
    }).populate('userId').populate('createdBy');
    
    return members;
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return [];
  }
}

/**
 * Add a user to an organization by email
 */
export async function addUserToOrganization(
  organizationId: string,
  email: string,
  role: UserRole,
  createdBy: string
): Promise<IOrganizationUser> {
  await dbConnect();

  try {
    // Check if user is already in the organization
    const existingMember = await OrganizationUser.findOne({
      organizationId,
      email: email.toLowerCase(),
    });

    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    // Create the organization user entry
    const organizationUser = new OrganizationUser({
      organizationId,
      email: email.toLowerCase(),
      role,
      createdBy,
      // userId will be populated when the user accepts the invitation
    });

    await organizationUser.save();
    return organizationUser;
  } catch (error) {
    console.error('Error adding user to organization:', error);
    throw error;
  }
}

/**
 * Update user role in organization
 */
export async function updateUserRoleInOrganization(
  organizationId: string,
  userId: string,
  newRole: UserRole
): Promise<IOrganizationUser | null> {
  await dbConnect();

  try {
    const updatedMember = await OrganizationUser.findOneAndUpdate(
      { organizationId, userId },
      { role: newRole },
      { new: true }
    );

    return updatedMember;
  } catch (error) {
    console.error('Error updating user role:', error);
    return null;
  }
}

/**
 * Check if user has access to organization and get their role
 */
export async function getUserRoleInOrganization(
  organizationId: string,
  userId: string
): Promise<UserRole | null> {
  await dbConnect();

  try {
    // First check if user is the creator
    const organization = await Organization.findById(organizationId);
    if (organization?.createdBy === userId) {
      return 'admin';
    }

    // Then check OrganizationUser table
    const organizationUser = await OrganizationUser.findOne({
      organizationId,
      userId,
    });

    return organizationUser?.role || null;
  } catch (error) {
    console.error('Error checking user role:', error);
    return null;
  }
}
