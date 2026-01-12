import { NextResponse } from "next/server";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

/**
 * Stop RTMP Push
 * 
 * This endpoint calls Agora's REST API to stop an active RTMP push.
 * 
 * Request Body:
 *   - converterId: string (required) - Returned from /api/agora/rtmp/start
 * 
 * Response:
 *   - success: boolean
 *   - message: string
 *   - converterId: string
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Parse request body
    const body = await request.json();
    const { converterId } = body;

    if (!converterId) {
      return NextResponse.json(
        { error: 'converterId is required' },
        { status: 400 }
      );
    }

    // Get Agora credentials
    const AGORA_APP_ID = process.env.AGORA_APP_ID || 'eb2e227ffd404032957fcd027e64db5d';
    const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID;
    const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET;

    if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      console.error('❌ AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET must be set');
      return NextResponse.json(
        {
          error: 'Agora REST API credentials not configured',
          message: 'Please set AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET in environment variables',
        },
        { status: 500 }
      );
    }

    console.log('🛑 Stopping RTMP push...');
    console.log(`   Converter ID: ${converterId}`);
    console.log(`   User: ${user.email || user.name || user.id}`);

    // Call Agora REST API to stop RTMP push
    const apiUrl = `https://api.agora.io/v1/projects/${AGORA_APP_ID}/rtmp-converters/${converterId}`;

    // Create Basic Auth header
    const credentials = Buffer.from(
      `${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`
    ).toString('base64');

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Agora API Error:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to stop RTMP push',
          agoraError: errorData,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    console.log('✅ RTMP push stopped successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'RTMP push stopped',
        converterId,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Stop RTMP error:', error);
    return NextResponse.json(
      {
        error: 'Failed to stop RTMP push',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
