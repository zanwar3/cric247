import { getToken } from "next-auth/jwt";

/**
 * Get the authenticated user from the request
 * @param {Request} request - The request object
 * @returns {Promise<{user: object, error: string|null}>}
 */
export async function getAuthenticatedUser(request) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET 
    });
    
    if (!token || !token.id) {
      return {
        user: null,
        error: "Authentication required. Please log in."
      };
    }

    return {
      user: {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role
      },
      error: null
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return {
      user: null,
      error: "Authentication failed. Please try again."
    };
  }
}

/**
 * Create an unauthorized response
 * @param {string} message - Error message
 * @returns {Response}
 */
export function createUnauthorizedResponse(message = "Authentication required") {
  return Response.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Create a forbidden response
 * @param {string} message - Error message
 * @returns {Response}
 */
export function createForbiddenResponse(message = "Access denied") {
  return Response.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Middleware to check if user owns the resource
 * @param {string} resourceUserId - The user ID from the resource
 * @param {string} currentUserId - The current authenticated user ID
 * @returns {boolean}
 */
export function checkResourceOwnership(resourceUserId, currentUserId) {
  return resourceUserId === currentUserId;
}