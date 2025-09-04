import { Organization, OrganizationUser, User, Department, type IOrganization, type IOrganizationUser, type UserRole } from '@/lib/models';
import dbConnect from '@/lib/database';
import { createLyzrKnowledgeBase, createLyzrTool, createLyzrAgent, type ToolContext } from '@/lib/lyzr-services';
import { decrypt } from '@/lib/encryption';

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
      // Get the user to get their email and API key
      const user = await User.findById(data.createdBy);
      if (user) {
        // Create the organization user entry
        const organizationUser = new OrganizationUser({
          organizationId: organization._id,
          email: user.email,
          userId: data.createdBy,
          role: 'admin',
          status: 'active', // Creator is immediately active
          createdBy: data.createdBy,
          joinedAt: new Date(),
        });
        
        await organizationUser.save();

        // Store the user's API key in the organization (if available)
        if (user.lyzrApiKey) {
          organization.lyzrApiKey = user.lyzrApiKey; // Already encrypted
          
          // Create Lyzr resources
          try {
            const decryptedApiKey = decrypt(user.lyzrApiKey);
            
            console.log('Creating Lyzr resources for organization:', organization.name);
            console.log('Using userId:', user.lyzrUserId || user._id.toString());
            console.log('API key length:', decryptedApiKey?.length || 0);
            
            // Create knowledge base first
            const knowledgeBase = await createLyzrKnowledgeBase(
              decryptedApiKey,
              organization.name,
            );
            organization.lyzrKnowledgeBaseId = knowledgeBase.rag_id;
            
            // Create tools
            const toolContext: ToolContext = {
              userId: user._id.toString(),
              userEmail: user.email,
              organizationId: organization._id.toString(),
              organizationName: organization.name
            };
            
            const tool = await createLyzrTool(
              decryptedApiKey,
              organization.name,
              toolContext
            );
            console.log('Tool IDs to store in DB:', tool.tool_ids);
            organization.lyzrToolIds = tool.tool_ids;
            
            // Create agent with knowledge base and tools
            console.log('Tool IDs for agent creation:', tool.tool_ids);
            const agent = await createLyzrAgent(
              decryptedApiKey,
              organization.name,
              knowledgeBase.rag_id,
              tool.tool_ids,
              data.systemInstruction
            );
            organization.lyzrAgentId = agent.agent_id;
            
            console.log('Successfully created Lyzr resources:', {
              agentId: agent.agent_id,
              knowledgeBaseId: knowledgeBase.rag_id,
              toolIds: tool.tool_ids
            });
          } catch (lyzrError) {
            console.error('Error creating Lyzr resources:', lyzrError);
            // Don't fail organization creation if Lyzr setup fails
            // The organization can still function without AI features
          }
          
          await organization.save();
        }
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
    if (organization?.createdBy.toString() === userId) {
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

/**
 * Get all department names for an organization
 */
export async function getOrganizationDepartments(organizationId: string): Promise<string[]> {
  await dbConnect();

  try {
    const departments = await Department.find({ organizationId }, 'name');
    return departments.map(dept => dept.name);
  } catch (error) {
    console.error('Error fetching organization departments:', error);
    return [];
  }
}
