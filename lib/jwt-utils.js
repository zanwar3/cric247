import jwt from "jsonwebtoken";

/**
 * Generate a JWT token for mobile authentication
 * @param {Object} payload - User data to encode in token
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.name - User name
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
export function generateMobileToken(payload) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error("AUTH_SECRET is not defined");
  }

  // Create token with user data
  const token = jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      // Add NextAuth-compatible fields for compatibility with existing auth-utils
      sub: payload.id,
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    {
      expiresIn: "30d", // 30 days for dev mode - can be shortened for production
    }
  );

  return token;
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyMobileToken(token) {
  try {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    
    if (!secret) {
      throw new Error("AUTH_SECRET is not defined");
    }

    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param {Request} request - Request object
 * @returns {string|null} Token or null if not found
 */
export function extractTokenFromHeader(request) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7); // Remove "Bearer " prefix
}

