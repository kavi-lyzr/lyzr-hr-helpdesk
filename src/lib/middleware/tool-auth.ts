import { NextRequest } from 'next/server';
import { decrypt } from '@/lib/encryption';
import { ToolContext } from '@/lib/lyzr-services';

export interface ToolAuthResult {
  success: boolean;
  context?: ToolContext;
  error?: string;
}

/**
 * Extract and validate the x-token header from tool calls
 * Returns the decrypted context if valid, or error information if invalid
 */
export function validateToolToken(request: NextRequest): ToolAuthResult {
  try {
    // Extract x-token from headers
    const xToken = request.headers.get('x-token');
    
    if (!xToken) {
      return {
        success: false,
        error: 'Missing x-token header. Tool call not authorized.'
      };
    }

    // Decrypt the token
    const decryptedToken = decrypt(xToken);
    
    if (!decryptedToken || decryptedToken === xToken) {
      // If decryption failed or returned the same value, it's invalid
      return {
        success: false,
        error: 'Invalid x-token header. Tool call not authorized.'
      };
    }

    // Parse the context
    let context: ToolContext;
    try {
      context = JSON.parse(decryptedToken);
    } catch (parseError) {
      return {
        success: false,
        error: 'Malformed x-token header. Tool call not authorized.'
      };
    }

    // Validate required context fields
    if (!context.userId || !context.userEmail || !context.organizationId || !context.organizationName) {
      return {
        success: false,
        error: 'Incomplete context in x-token header. Tool call not authorized.'
      };
    }

    return {
      success: true,
      context
    };

  } catch (error) {
    console.error('Error validating tool token:', error);
    return {
      success: false,
      error: 'Failed to validate tool authorization.'
    };
  }
}
