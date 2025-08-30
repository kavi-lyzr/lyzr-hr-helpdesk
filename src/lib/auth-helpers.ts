import { User, type IUser } from '@/lib/models';
import dbConnect from '@/lib/database';

export interface LyzrUserData {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

/**
 * Create or update user based on Lyzr authentication data
 */
export async function createOrUpdateUser(lyzrUserData: LyzrUserData): Promise<IUser> {
  await dbConnect();

  try {
    // First, try to find user by Lyzr user ID
    let user = await User.findOne({ lyzrUserId: lyzrUserData.id });

    if (user) {
      // Update existing user if needed
      const updates: Partial<IUser> = {};
      
      if (lyzrUserData.name && user.name !== lyzrUserData.name) {
        updates.name = lyzrUserData.name;
      }
      
      if (lyzrUserData.email && user.email !== lyzrUserData.email) {
        updates.email = lyzrUserData.email;
      }
      
      if (lyzrUserData.avatar && user.avatar !== lyzrUserData.avatar) {
        updates.avatar = lyzrUserData.avatar;
      }

      if (Object.keys(updates).length > 0) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
      
      return user!;
    }

    // If not found by Lyzr ID, check by email (for existing users who haven't linked Lyzr yet)
    user = await User.findOne({ email: lyzrUserData.email });

    if (user) {
      // Link existing user with Lyzr ID
      user = await User.findByIdAndUpdate(
        user._id,
        {
          lyzrUserId: lyzrUserData.id,
          name: lyzrUserData.name || user.name,
          avatar: lyzrUserData.avatar || user.avatar,
        },
        { new: true }
      );
      return user!;
    }

    // Create new user
    const newUser = new User({
      name: lyzrUserData.name || 'User',
      email: lyzrUserData.email,
      lyzrUserId: lyzrUserData.id,
      avatar: lyzrUserData.avatar,
    });

    await newUser.save();
    return newUser;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw new Error('Failed to create or update user');
  }
}

/**
 * Get user by ID (supports both MongoDB ObjectId and Lyzr user ID)
 */
export async function getUserById(userId: string): Promise<IUser | null> {
  await dbConnect();
  
  try {
    // First try to find by MongoDB ObjectId (24 character hex string)
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findById(userId);
      if (user) return user;
    }
    
    // If not found or not a valid ObjectId, try finding by lyzrUserId
    const user = await User.findOne({ lyzrUserId: userId });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  await dbConnect();
  
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Update user's current organization
 */
export async function updateUserCurrentOrganization(userId: string, organizationId: string): Promise<IUser | null> {
  await dbConnect();
  
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { currentOrganization: organizationId },
      { new: true }
    );
    return user;
  } catch (error) {
    console.error('Error updating user current organization:', error);
    return null;
  }
}
