import { NextResponse } from "next/server";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

/**
 * Get RTMP Push Status
 * 
 * Query the status of an active RTMP converter.
 * 
 * URL Parameters:
 *   - converterId: string - The converter ID to check
 * 
 * Response:
 *   - success: boolean
 *   - converter: object - Converter details including state
 */
export async function GET(request, { params }) {
  try {
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { converterId } = params;

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
        },
        { status: 500 }
      );
    }

    console.log('🔍 Checking RTMP push status...');
    console.log(`   Converter ID: ${converterId}`);

    const apiUrl = `https://api.agora.io/v1/projects/${AGORA_APP_ID}/rtmp-converters/${converterId}`;

    // Create Basic Auth header
    const credentials = Buffer.from(
      `${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`
    ).toString('base64');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Agora API Error:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to get RTMP status',
          agoraError: errorData,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const statusData = await response.json();
    console.log('✅ RTMP status retrieved:', statusData.converter?.state);

    return NextResponse.json(
      {
        success: true,
        converter: statusData.converter,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Get RTMP status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get RTMP status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
