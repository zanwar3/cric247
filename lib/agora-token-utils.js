/**
 * Agora Token Generator with RTMP Streaming and Screen Capture Privileges
 * 
 * Uses the official Agora Token SDK to generate RTC tokens with necessary privileges for:
 * - RTMP streaming (Media Push) to external platforms like YouTube
 * - Screen capture and sharing
 * - Full media publishing capabilities
 * 
 * This implementation uses the official 'agora-token' package which properly encodes
 * tokens according to Agora's specification, ensuring compatibility with Agora RTC Engine.
 * 
 * For RTMP streaming, we use buildTokenWithUidAndPrivilege to set explicit privilege
 * expiration times for all publishing capabilities, which is required for co-host
 * authentication and Media Push functionality.
 */

import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;

/**
 * Generate an Agora RTC token with RTMP streaming privileges
 * 
 * This method generates a token with explicit privileges for:
 * - Joining the RTC channel
 * - Publishing audio streams (required for RTMP)
 * - Publishing video streams (required for RTMP and screen capture)
 * - Publishing data streams
 * 
 * These explicit privileges ensure that RTMP streaming (Media Push) works correctly,
 * especially when co-host authentication is enabled in your Agora project.
 * 
 * @param {string} appId - Agora App ID
 * @param {string} appCertificate - Agora App Certificate (32 characters)
 * @param {string} channelName - Channel name to join
 * @param {number} uid - User ID (0 for Agora server to assign)
 * @param {number} expireTimestamp - Token expiration timestamp (seconds since epoch, default: 24 hours from now)
 * @returns {string} Generated Agora token (properly encoded)
 */
function generateAgoraToken({
  appId,
  appCertificate,
  channelName,
  uid = 0,
  expireTimestamp = null,
}) {
  // Validate inputs
  if (!appId || !channelName) {
    throw new Error('appId and channelName are required');
  }

  // If no certificate provided, return null (client can join without token in testing mode)
  if (!appCertificate) {
    console.log('No certificate provided, returning null token (testing mode)');
    return null;
  }

  // Validate App Certificate format (should be 32 characters)
  if (appCertificate.length !== 32) {
    console.warn(`⚠️ App Certificate length is ${appCertificate.length}, expected 32 characters`);
  }

  // Set expiration time (default: 24 hours from now)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = expireTimestamp || (currentTimestamp + 3600 * 24);
  
  // Calculate token expiration (same as privilege expiration)
  const tokenExpireTime = privilegeExpireTime - currentTimestamp;

  console.log('🔐 Generating Agora token with explicit RTMP/Media Push privileges...');
  console.log(`   Channel: "${channelName}"`);
  console.log(`   UID: ${uid}`);
  console.log(`   Privileges: Join, PublishAudio, PublishVideo, PublishData`);
  console.log(`   Expires in: ${Math.floor(tokenExpireTime / 3600)} hours`);

  try {
    // CRITICAL FIX for RTMP Streaming (Media Push):
    // Use buildTokenWithUidAndPrivilege to explicitly set privilege expiration times
    // This is REQUIRED for RTMP streaming (Media Push) to external platforms like YouTube
    // Explicit privilege expiration ensures Media Push works correctly
    
    // All privilege expiration times are in seconds (relative to now), not timestamps
    // They should match the token expiration time
    const token = RtcTokenBuilder.buildTokenWithUidAndPrivilege(
      appId,
      appCertificate,
      channelName,
      uid,
      tokenExpireTime,             // Token expiration in seconds from now
      tokenExpireTime,             // Join channel privilege expiration in seconds
      tokenExpireTime,             // Publish audio privilege expiration in seconds
      tokenExpireTime,             // Publish video privilege expiration in seconds
      tokenExpireTime              // Publish data stream privilege expiration in seconds
    );

    console.log('✅ Token generated successfully with explicit RTMP/Media Push privileges');
    console.log(`   Token length: ${token.length} characters`);
    console.log(`   Token preview: ${token.substring(0, 50)}...`);
    console.log(`   Token format: ${token.startsWith('007') || token.startsWith('006') ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Privilege expiration: ${Math.floor(tokenExpireTime / 3600)} hours from now`);
    console.log(`   RTMP Streaming: ✅ Enabled (with explicit privileges)`);
    console.log(`   Note: Media Push must be enabled in Agora Console for RTMP to work`);

    return token;
  } catch (error) {
    console.error('❌ Failed to generate Agora token:', error.message);
    console.error('Error details:', error);
    
    // Fallback: Try buildTokenWithUid if buildTokenWithUidAndPrivilege is not available
    if (error.message && (error.message.includes('buildTokenWithUidAndPrivilege') || error.message.includes('is not a function'))) {
      console.warn('⚠️ buildTokenWithUidAndPrivilege not available, falling back to buildTokenWithUid');
      try {
        const fallbackToken = RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          channelName,
          uid,
          RtcRole.PUBLISHER,
          tokenExpireTime
        );
        console.log('✅ Fallback token generated (may not support RTMP if Media Push requires explicit privileges)');
        console.log('⚠️ WARNING: Using fallback token. RTMP streaming may fail if Media Push requires explicit privileges.');
        return fallbackToken;
      } catch (fallbackError) {
        throw new Error(`Token generation failed: ${fallbackError.message}. Please verify App ID and App Certificate.`);
      }
    }
    
    throw new Error(`Token generation failed: ${error.message}. Please verify App ID and App Certificate.`);
  }
}

export { generateAgoraToken };

