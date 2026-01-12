import { NextResponse } from "next/server";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";
import { generateAgoraToken } from "@/lib/agora-token-utils";

/**
 * Agora Token Generation Endpoint
 * 
 * Generates Agora RTC tokens with RTMP streaming and screen capture privileges for authenticated users.
 * This endpoint requires authentication via Bearer token.
 * 
 * The generated token includes privileges for:
 * - Joining channels
 * - Publishing audio streams (required for RTMP streaming)
 * - Publishing video streams (required for RTMP streaming and screen capture)
 * - Publishing data streams
 * 
 * These privileges enable:
 * - Screen capture and sharing
 * - RTMP streaming to YouTube and other external platforms
 * - Full media publishing capabilities
 * 
 * Request Body:
 *   - channelName: string (required) - Channel name for the Agora stream
 *   - uid: number (optional) - User ID (default: 0, server assigns)
 *   - expireTimestamp: number (optional) - Token expiration timestamp in seconds (default: 24 hours)
 * 
 * Response:
 *   - token: string - Generated Agora token with RTMP and screen capture privileges
 *   - channelName: string - Channel name used
 *   - uid: number - User ID used
 *   - expiresAt: number - Token expiration timestamp
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }
      // Get Agora credentials from environment variables
      const appId = process.env.AGORA_APP_ID || 'eb2e227ffd404032957fcd027e64db5d';
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;

      // CRITICAL: Validate Agora credentials
      if (!appId || appId === 'YOUR_AGORA_APP_ID') {
        console.error('❌ AGORA_APP_ID not configured or using default placeholder');
        return NextResponse.json(
          { 
            error: "Agora App ID not configured",
            message: "Please set AGORA_APP_ID in your environment variables or update the default value"
          },
          { status: 500 }
        );
      }

    // Parse request body
    const body = await request.json();
    const { channelName, uid = 0, expireTimestamp } = body;

    // Validation
    if (!channelName || typeof channelName !== 'string' || channelName.trim() === '') {
      return NextResponse.json(
        { error: "channelName is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // IMPORTANT: Trim and normalize channel name to ensure consistency
    const normalizedChannelName = channelName.trim();
    // For Agora, UID can be 0 (server assigns) or a specific number
    // If UID is provided and > 0, use it; otherwise use 0 for auto-assignment
    let normalizedUid = typeof uid === 'number' ? uid : parseInt(uid, 10);
    if (isNaN(normalizedUid) || normalizedUid < 0) {
      normalizedUid = 0; // Agora will auto-assign UID
    }
    
    console.log('========== GENERATING AGORA TOKEN ==========');
    console.log('Channel name received:', `"${normalizedChannelName}"`);
    console.log('Channel name length:', normalizedChannelName.length);
    console.log('UID received:', normalizedUid);
    console.log('App ID:', appId.substring(0, 8) + '...');
    if (appCertificate) {
      console.log('App Certificate:', appCertificate.substring(0, 4) + '...' + appCertificate.substring(appCertificate.length - 4));
      console.log('App Certificate length:', appCertificate.length, appCertificate.length === 32 ? '✅' : '⚠️ Should be 32 chars');
    } else {
      console.log('App Certificate: Not set');
    }
    console.log('User:', user.email || user.name || user.id);
    console.log('============================================');

  
    if (!appId) {
      console.error("Agora App ID not configured. Please set AGORA_APP_ID environment variable.");
      return NextResponse.json(
        { error: "Agora service not configured" },
        { status: 500 }
      );
    }

    // Calculate expiration time if not provided (default: 24 hours from now)
    const expiresAt = expireTimestamp || Math.floor(Date.now() / 1000) + 3600 * 24;

    // Generate Agora token with RTMP streaming privileges
    // Includes privileges for: Join Channel, Publish Audio, Publish Video, Publish Data Stream
    // These privileges enable RTMP streaming (Media Push) and screen capture
    // IMPORTANT: Use normalized channel name and UID to ensure token matches what client uses
    let token;
    try {
      token = generateAgoraToken({
        appId,
        appCertificate,
        channelName: normalizedChannelName, // Use normalized (trimmed) channel name
        uid: normalizedUid, // Use normalized UID
        expireTimestamp: expiresAt,
      });
      
      // If no certificate, token will be null (no token needed)
      if (token === null) {
        console.log("No certificate provided, returning null token");
        return NextResponse.json(
          {
            success: true,
            token: null,
            channelName: normalizedChannelName,
            uid: normalizedUid,
            expiresAt: null,
            appId: appId.substring(0, 8) + '...',
          },
          { status: 200 }
        );
      }
      
      console.log("✅ Agora token generated successfully");
      console.log("   Token length:", token.length);
      console.log("   Token for channel:", `"${normalizedChannelName}"`);
      console.log("   Token for UID:", normalizedUid);
      console.log("   Token preview:", token.substring(0, 60) + '...');
      
      // Validate token format
      const isValidFormat = token.startsWith('007') || token.startsWith('006');
      console.log("   Token format:", isValidFormat ? '✅ Valid' : '❌ Invalid');
      
      if (!isValidFormat) {
        throw new Error('Generated token has invalid format. Please check App Certificate.');
      }
    } catch (tokenError) {
      console.error("❌ Error generating Agora token:", tokenError);
      console.error("Error details:", {
        message: tokenError.message,
        stack: tokenError.stack,
        appId: appId.substring(0, 8) + '...',
        channelName: normalizedChannelName,
        uid: normalizedUid,
      });
      return NextResponse.json(
        { 
          error: `Failed to generate token: ${tokenError.message}`,
        },
        { status: 500 }
      );
    }

    // Return token and metadata
    // IMPORTANT: Return the exact channel name and UID used to generate the token
    return NextResponse.json(
      {
        success: true,
        token,
        channelName: normalizedChannelName, // Return normalized channel name
        uid: normalizedUid, // Return normalized UID
        expiresAt,
        appId: appId.substring(0, 8) + '...', // Partially mask App ID for security
        // Debug info for troubleshooting
        _debug: {
          tokenLength: token.length,
          tokenFormat: (token.startsWith('007') || token.startsWith('006')) ? 'valid' : 'invalid',
          channelNameLength: normalizedChannelName.length,
          uidType: typeof normalizedUid,
          generatedAt: new Date().toISOString(),
          expiresIn: `${Math.floor((expiresAt - Math.floor(Date.now() / 1000)) / 3600)} hours`,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Agora token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

