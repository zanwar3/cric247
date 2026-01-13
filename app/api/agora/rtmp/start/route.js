import { NextResponse } from "next/server";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

/**
 * Start RTMP Push to external platform (YouTube, Twitch, etc.)
 * 
 * This endpoint calls Agora's REST API to start pushing the channel stream
 * to an RTMP destination.
 * 
 * Request Body:
 *   - channelName: string (required)
 *   - uid: number (required)
 *   - rtmpUrl: string (required) - e.g., "rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY"
 * 
 * Response:
 *   - success: boolean
 *   - converter: object - Agora converter details (includes ID)
 *   - channelName: string
 *   - uid: number
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
    const { channelName, uid, rtmpUrl } = body;

    // Validate inputs
    if (!channelName || uid === undefined || !rtmpUrl) {
      return NextResponse.json(
        {
          error: 'channelName, uid, and rtmpUrl are required',
          received: { channelName, uid, rtmpUrl },
        },
        { status: 400 }
      );
    }

    // Validate RTMP URL format
    if (!rtmpUrl.startsWith('rtmp://')) {
      return NextResponse.json(
        {
          error: 'Invalid RTMP URL format. Must start with rtmp://',
          received: rtmpUrl,
        },
        { status: 400 }
      );
    }

    // Get Agora credentials
    const AGORA_APP_ID = process.env.AGORA_APP_ID || '4b6e6e59522a436eb93310633ad2b51d';
    const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID ||'7986fb36ca964687b172e54c0dffd938';
    const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET || '5d338b3a4b21407ca4a34cb1a6fa7a19';

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

    console.log('🎥 Starting RTMP push...');
    console.log(`   Channel: ${channelName}`);
    console.log(`   UID: ${uid} (type: ${typeof uid})`);
    console.log(`   RTMP URL: ${rtmpUrl.split('/').slice(0, -1).join('/')}/***`);
    console.log(`   User: ${user.email || user.name || user.id}`);
    console.log(`   ⚠️  CRITICAL: Ensure publisher is already in channel with UID ${uid}`);
    console.log(`   ⚠️  If UID mismatch, video will be black!`);

    // Call Agora REST API to start RTMP push
    const apiUrl = `https://api.agora.io/v1/projects/${AGORA_APP_ID}/rtmp-converters`;

    const requestBody = {
      converter: {
        name: `rtmp_${channelName}_${uid}_${Date.now()}`,
        transcodeOptions: {
          rtcChannel: channelName,
          audioOptions: {
            codecProfile: 'HE-AAC',
            sampleRate: 48000,
            bitrate: 128,
            audioChannels: 2,
          },
          videoOptions: {
            canvas: {
              width: 1280,
              height: 720,
              color: 0,
            },
            layout: [
              {
                // CRITICAL: This UID must match the actual publisher UID in the channel
                // If UID is 0, Agora auto-assigned it - check actual UID from onJoinChannelSuccess
                rtcStreamUid: uid,
                region: {
                  xPos: 0,
                  yPos: 0,
                  zIndex: 1,
                  width: 1280,
                  height: 720,
                },
                // Removed placeholderImageUrl - let Agora use the actual video stream
                // If stream is not immediately available, Agora will wait for it
              },
            ],
            bitrate: 2000,
            frameRate: 30,
            gop: 2,
            codecProfile: 'high',
          },
        },
        rtmpUrl: rtmpUrl,
      },
    };

    console.log('📡 Calling Agora REST API...');
    console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));

    // Create Basic Auth header
    const credentials = Buffer.from(
      `${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`
    ).toString('base64');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📡 Agora API Response Status:', response.status);

    const responseData = await response.json();
    console.log('📡 Agora API Response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('❌ Agora API Error:', responseData);
      console.error('   Status:', response.status);
      console.error('   Channel:', channelName);
      console.error('   UID:', uid);
      return NextResponse.json(
        {
          error: 'Failed to start RTMP push',
          agoraError: responseData,
          statusCode: response.status,
          details: `Channel: ${channelName}, UID: ${uid}`,
        },
        { status: response.status }
      );
    }

    console.log('✅ RTMP push started successfully');
    console.log('   Converter ID:', responseData.converter?.id);
    console.log('   Channel:', channelName);
    console.log('   UID:', uid);
    console.log('   ⚠️  Note: Video stream must be active in channel for RTMP to work');
    console.log('   ⚠️  If video is black, ensure screen capture is publishing to channel');

    return NextResponse.json(
      {
        success: true,
        message: 'RTMP push started',
        converter: responseData.converter,
        channelName,
        uid,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Start RTMP error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start RTMP push',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
