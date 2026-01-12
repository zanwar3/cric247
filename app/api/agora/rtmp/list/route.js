import { NextResponse } from "next/server";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

/**
 * List all active RTMP converters
 * 
 * Response:
 *   - success: boolean
 *   - converters: array - List of active converters
 *   - total: number
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
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

    console.log('📋 Listing all RTMP converters...');
    console.log(`   User: ${user.email || user.name || user.id}`);

    const apiUrl = `https://api.agora.io/v1/projects/${AGORA_APP_ID}/rtmp-converters`;

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
          error: 'Failed to list RTMP converters',
          agoraError: errorData,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const listData = await response.json();
    console.log(`✅ Found ${listData.converters?.length || 0} active converters`);

    return NextResponse.json(
      {
        success: true,
        converters: listData.converters || [],
        total: listData.converters?.length || 0,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ List RTMP converters error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list RTMP converters',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
