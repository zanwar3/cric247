/**
 * Mobile API Test Suite
 * Tests all mobile API endpoints sequentially and logs results to JSON file
 */

const fs = require('fs');

// Configuration
const BASE_URL = 'https://cric247-pi.vercel.app';
const OUTPUT_FILE = 'test-results.json';

// Test state
const testResults = [];
const testData = {
  token: null,
  userId: null,
  profileId: null,
  profileId2: null,
  teamId: null,
  teamId2: null,
  tournamentId: null,
  matchId: null,
  ballId: null,
};

const startTime = Date.now();

// Helper: Make HTTP request with axios-like interface using native fetch
async function makeRequest(method, endpoint, data = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        responseData = { error: 'Failed to parse JSON response', raw: await response.text() };
      }
    } else {
      const textData = await response.text();
      responseData = textData || null;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      duration,
      success: response.ok,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 0,
      statusText: 'Network Error',
      headers: {},
      data: { error: error.message, stack: error.stack },
      duration,
      success: false,
      error: error.message,
    };
  }
}

// Helper: Log test result
function logTest(testName, method, endpoint, request, response, error = null) {
  const status = error ? 'failed' : 'success';
  const result = {
    testName,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    status,
    statusCode: response?.status || 0,
    duration: response?.duration || 0,
    request: {
      headers: request.headers || {},
      body: request.body || null,
    },
    response: {
      headers: response?.headers || {},
      body: response?.data || null,
    },
  };

  if (error) {
    result.error = error;
  }

  testResults.push(result);
  
  // Console logging
  const statusIcon = status === 'success' ? '✅' : '❌';
  console.log(`${statusIcon} ${testName} - ${response?.status || 'ERROR'} (${response?.duration || 0}ms)`);
  
  if (error) {
    console.log(`   Error: ${error}`);
    // Log validation details if available
    if (response?.data?.details) {
      console.log(`   Validation errors:`, response.data.details);
    }
    // Log full error response for debugging
    if (response?.data && typeof response.data === 'object') {
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    }
  }
}

// Helper: Save results to JSON file
function saveResults() {
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  const passed = testResults.filter(r => r.status === 'success').length;
  const failed = testResults.filter(r => r.status === 'failed').length;
  
  const output = {
    summary: {
      totalTests: testResults.length,
      passed,
      failed,
      successRate: `${((passed / testResults.length) * 100).toFixed(2)}%`,
      totalDuration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
    },
    createdResources: {
      userId: testData.userId,
      profileId: testData.profileId,
      profileId2: testData.profileId2,
      teamId: testData.teamId,
      teamId2: testData.teamId2,
      tournamentId: testData.tournamentId,
      matchId: testData.matchId,
      ballId: testData.ballId,
    },
    tests: testResults,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n📄 Results saved to ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary: ${passed}/${testResults.length} tests passed (${output.summary.successRate})`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Mobile API Test Suite');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;

  // ============================================
  // 1. AUTHENTICATION TESTS
  // ============================================
  console.log('📝 Authentication Tests\n');

  // Test 1: Register User
  try {
    const registerData = {
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      confirmPassword: 'password123',
    };
    
    const response = await makeRequest('POST', '/api/auth/register', registerData);
    
    logTest(
      'Register User',
      'POST',
      '/api/auth/register',
      { headers: {}, body: registerData },
      response,
      !response.success ? response.data?.error || 'Registration failed' : null
    );

    if (response.success && response.data?.user?._id) {
      testData.userId = response.data.user._id;
    }
  } catch (error) {
    logTest('Register User', 'POST', '/api/auth/register', {}, null, error.message);
  }

  // Test 2: Mobile Login
  try {
    const loginData = {
      email: testEmail,
      password: 'password123',
    };
    
    const response = await makeRequest('POST', '/api/auth/mobile/login', loginData);
    
    logTest(
      'Mobile Login',
      'POST',
      '/api/auth/mobile/login',
      { headers: {}, body: loginData },
      response,
      !response.success ? response.data?.error || 'Login failed' : null
    );

    if (response.success && response.data?.token) {
      testData.token = response.data.token;
    }
  } catch (error) {
    logTest('Mobile Login', 'POST', '/api/auth/mobile/login', {}, null, error.message);
  }

  // Test 3: Refresh Token
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', '/api/auth/mobile/refresh', null, headers);
    
    logTest(
      'Refresh Token',
      'POST',
      '/api/auth/mobile/refresh',
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Token refresh failed' : null
    );

    if (response.success && response.data?.token) {
      testData.token = response.data.token;
    }
  } catch (error) {
    logTest('Refresh Token', 'POST', '/api/auth/mobile/refresh', {}, null, error.message);
  }

  // ============================================
  // 2. PROFILES TESTS
  // ============================================
  console.log('\n👤 Profile Tests\n');

  // Test 4: Create Profile
  try {
    const profileData = {
      name: 'Test Player One',
      gender: 'Male',
      city: 'Test City',
      phone: '+1234567890',
      email: `player${timestamp}@example.com`,
      role: 'Batsman',
      battingStyle: 'Right-Handed',
      bowlingStyle: 'Right-arm fast',
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', '/api/profiles', profileData, headers);
    
    logTest(
      'Create Profile',
      'POST',
      '/api/profiles',
      { headers, body: profileData },
      response,
      !response.success ? response.data?.error || 'Profile creation failed' : null
    );

    if (response.success && response.data?._id) {
      testData.profileId = response.data._id;
    }
  } catch (error) {
    logTest('Create Profile', 'POST', '/api/profiles', {}, null, error.message);
  }

  // Test 5: Create Second Profile (for team player management)
  try {
    const profileData = {
      name: 'Test Player Two',
      gender: 'Male',
      city: 'Test City',
      phone: '+1234567891',
      email: `player2${timestamp}@example.com`,
      role: 'Bowler',
      battingStyle: 'Left-Handed',
      bowlingStyle: 'Left-arm spin',
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', '/api/profiles', profileData, headers);
    
    logTest(
      'Create Second Profile',
      'POST',
      '/api/profiles',
      { headers, body: profileData },
      response,
      !response.success ? response.data?.error || 'Second profile creation failed' : null
    );

    if (response.success && response.data?._id) {
      testData.profileId2 = response.data._id;
    }
  } catch (error) {
    logTest('Create Second Profile', 'POST', '/api/profiles', {}, null, error.message);
  }

  // Test 6: Get All Profiles
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', '/api/profiles', null, headers);
    
    logTest(
      'Get All Profiles',
      'GET',
      '/api/profiles',
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get profiles failed' : null
    );
  } catch (error) {
    logTest('Get All Profiles', 'GET', '/api/profiles', {}, null, error.message);
  }

  // Test 7: Get Profile by ID
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', `/api/profiles/${testData.profileId}`, null, headers);
    
    logTest(
      'Get Profile by ID',
      'GET',
      `/api/profiles/${testData.profileId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get profile by ID failed' : null
    );
  } catch (error) {
    logTest('Get Profile by ID', 'GET', `/api/profiles/${testData.profileId}`, {}, null, error.message);
  }

  // Test 8: Update Profile
  try {
    const updateData = {
      name: 'Test Player One Updated',
      city: 'Updated City',
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('PUT', `/api/profiles/${testData.profileId}`, updateData, headers);
    
    logTest(
      'Update Profile',
      'PUT',
      `/api/profiles/${testData.profileId}`,
      { headers, body: updateData },
      response,
      !response.success ? response.data?.error || 'Profile update failed' : null
    );
  } catch (error) {
    logTest('Update Profile', 'PUT', `/api/profiles/${testData.profileId}`, {}, null, error.message);
  }

  // ============================================
  // 3. TEAMS TESTS
  // ============================================
  console.log('\n🏏 Team Tests\n');

  // Test 9: Create Team
  try {
    const teamData = {
      name: `Test Team ${timestamp}`,
      slug: 'TT1',
      city: 'Test City',
      captain: 'Test Captain One',
      coach: 'Test Coach',
      founded: '2024',
      description: 'Test team for API testing',
      homeGround: 'Test Ground',
      isActive: true,
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', '/api/teams', teamData, headers);
    
    logTest(
      'Create Team',
      'POST',
      '/api/teams',
      { headers, body: teamData },
      response,
      !response.success ? response.data?.error || 'Team creation failed' : null
    );

    if (response.success && response.data?._id) {
      testData.teamId = response.data._id;
    }
  } catch (error) {
    logTest('Create Team', 'POST', '/api/teams', {}, null, error.message);
  }

  // Test 10: Create Second Team (for match)
  try {
    const teamData = {
      name: `Test Team Two ${timestamp}`,
      slug: 'TT2',
      city: 'Test City Two',
      captain: 'Test Captain Two',
      coach: 'Test Coach Two',
      founded: '2024',
      description: 'Second test team for API testing',
      homeGround: 'Test Ground Two',
      isActive: true,
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', '/api/teams', teamData, headers);
    
    logTest(
      'Create Second Team',
      'POST',
      '/api/teams',
      { headers, body: teamData },
      response,
      !response.success ? response.data?.error || 'Second team creation failed' : null
    );

    if (response.success && response.data?._id) {
      testData.teamId2 = response.data._id;
    }
  } catch (error) {
    logTest('Create Second Team', 'POST', '/api/teams', {}, null, error.message);
  }

  // Test 11: Get All Teams
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', '/api/teams', null, headers);
    
    logTest(
      'Get All Teams',
      'GET',
      '/api/teams',
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get teams failed' : null
    );
  } catch (error) {
    logTest('Get All Teams', 'GET', '/api/teams', {}, null, error.message);
  }

  // Test 12: Get Team by ID
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', `/api/teams/${testData.teamId}`, null, headers);
    
    logTest(
      'Get Team by ID',
      'GET',
      `/api/teams/${testData.teamId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get team by ID failed' : null
    );
  } catch (error) {
    logTest('Get Team by ID', 'GET', `/api/teams/${testData.teamId}`, {}, null, error.message);
  }

  // Test 13: Update Team
  try {
    const updateData = {
      name: `Test Team Updated ${timestamp}`,
      slug: 'TTU',
      description: 'Updated test team description',
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('PUT', `/api/teams/${testData.teamId}`, updateData, headers);
    
    logTest(
      'Update Team',
      'PUT',
      `/api/teams/${testData.teamId}`,
      { headers, body: updateData },
      response,
      !response.success ? response.data?.error || 'Team update failed' : null
    );
  } catch (error) {
    logTest('Update Team', 'PUT', `/api/teams/${testData.teamId}`, {}, null, error.message);
  }

  // Test 14: Add Player to Team
  try {
    const playerData = {
      playerId: testData.profileId2,
      role: 'Bowler',
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', `/api/teams/${testData.teamId}/players`, playerData, headers);
    
    logTest(
      'Add Player to Team',
      'POST',
      `/api/teams/${testData.teamId}/players`,
      { headers, body: playerData },
      response,
      !response.success ? response.data?.error || 'Add player failed' : null
    );
  } catch (error) {
    logTest('Add Player to Team', 'POST', `/api/teams/${testData.teamId}/players`, {}, null, error.message);
  }

  // Test 15: Remove Player from Team
  try {
    const playerData = {
      playerId: testData.profileId2,
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('DELETE', `/api/teams/${testData.teamId}/players`, playerData, headers);
    
    logTest(
      'Remove Player from Team',
      'DELETE',
      `/api/teams/${testData.teamId}/players`,
      { headers, body: playerData },
      response,
      !response.success ? response.data?.error || 'Remove player failed' : null
    );
  } catch (error) {
    logTest('Remove Player from Team', 'DELETE', `/api/teams/${testData.teamId}/players`, {}, null, error.message);
  }

  // ============================================
  // 4. TOURNAMENTS TESTS
  // ============================================
  console.log('\n🏆 Tournament Tests\n');

  // Test 16: Create Tournament
  try {
    const tournamentData = {
      name: `Test Tournament ${timestamp}`,
      description: 'Test tournament for API testing',
      format: 'T20',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Test Venue',
      organizer: {
        name: 'Test Organizer',
        email: `organizer${timestamp}@example.com`,
        phone: '+1234567890',
      },
      prizePool: 'Winner: $5000, Runner-up: $3000, Best Player: $1000',
      entryFee: 100,
      maxTeams: 16,
      minTeams: 4,
      status: 'Draft',
      rules: {
        oversPerMatch: 20,
        playersPerTeam: 11,
        powerplayOvers: 6,
        duckworthLewis: false,
        supersOver: false,
      },
      isPublic: true,
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', '/api/tournaments', tournamentData, headers);
    
    logTest(
      'Create Tournament',
      'POST',
      '/api/tournaments',
      { headers, body: tournamentData },
      response,
      !response.success ? response.data?.error || 'Tournament creation failed' : null
    );

    if (response.success && response.data?._id) {
      testData.tournamentId = response.data._id;
    }
  } catch (error) {
    logTest('Create Tournament', 'POST', '/api/tournaments', {}, null, error.message);
  }

  // Test 17: Get All Tournaments
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', '/api/tournaments', null, headers);
    
    logTest(
      'Get All Tournaments',
      'GET',
      '/api/tournaments',
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get tournaments failed' : null
    );
  } catch (error) {
    logTest('Get All Tournaments', 'GET', '/api/tournaments', {}, null, error.message);
  }

  // Test 18: Get Tournament by ID
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', `/api/tournaments/${testData.tournamentId}`, null, headers);
    
    logTest(
      'Get Tournament by ID',
      'GET',
      `/api/tournaments/${testData.tournamentId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get tournament by ID failed' : null
    );
  } catch (error) {
    logTest('Get Tournament by ID', 'GET', `/api/tournaments/${testData.tournamentId}`, {}, null, error.message);
  }

  // Test 19: Update Tournament
  try {
    const updateData = {
      name: `Test Tournament Updated ${timestamp}`,
      description: 'Updated tournament description',
      status: 'Registration Open',
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('PUT', `/api/tournaments/${testData.tournamentId}`, updateData, headers);
    
    logTest(
      'Update Tournament',
      'PUT',
      `/api/tournaments/${testData.tournamentId}`,
      { headers, body: updateData },
      response,
      !response.success ? response.data?.error || 'Tournament update failed' : null
    );
  } catch (error) {
    logTest('Update Tournament', 'PUT', `/api/tournaments/${testData.tournamentId}`, {}, null, error.message);
  }

  // ============================================
  // 5. MATCHES TESTS
  // ============================================
  console.log('\n⚡ Match Tests\n');

  // Test 20: Create Match
  try {
    const matchData = {
      matchNumber: `MAT${timestamp}`,
      tournament: testData.tournamentId,
      teams: {
        teamA: testData.teamId,
        teamB: testData.teamId2,
      },
      venue: {
        name: 'Test Stadium',
        city: 'Test City',
        capacity: 50000,
      },
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Scheduled',
      matchType: 'T20',
      officials: {
        umpire1: 'Umpire One',
        umpire2: 'Umpire Two',
        thirdUmpire: 'Third Umpire',
        matchReferee: 'Match Referee',
      },
      notes: 'Test match for API testing',
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', '/api/matches', matchData, headers);
    
    logTest(
      'Create Match',
      'POST',
      '/api/matches',
      { headers, body: matchData },
      response,
      !response.success ? response.data?.error || 'Match creation failed' : null
    );

    if (response.success && response.data?._id) {
      testData.matchId = response.data._id;
    }
  } catch (error) {
    logTest('Create Match', 'POST', '/api/matches', {}, null, error.message);
  }

  // Test 21: Get All Matches
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', '/api/matches', null, headers);
    
    logTest(
      'Get All Matches',
      'GET',
      '/api/matches',
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get matches failed' : null
    );
  } catch (error) {
    logTest('Get All Matches', 'GET', '/api/matches', {}, null, error.message);
  }

  // Test 22: Get Match by ID
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('GET', `/api/matches/${testData.matchId}`, null, headers);
    
    logTest(
      'Get Match by ID',
      'GET',
      `/api/matches/${testData.matchId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Get match by ID failed' : null
    );
  } catch (error) {
    logTest('Get Match by ID', 'GET', `/api/matches/${testData.matchId}`, {}, null, error.message);
  }

  // Test 23: Update Match
  try {
    // Note: API requires teams to be sent even for partial updates due to line 58 in route.js
    const updateData = {
      status: 'Live',
      notes: 'Updated match notes',
      matchType: 'T20',
      teams: {
        teamA: testData.teamId,
        teamB: testData.teamId2,
      },
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('PUT', `/api/matches/${testData.matchId}`, updateData, headers);
    
    logTest(
      'Update Match',
      'PUT',
      `/api/matches/${testData.matchId}`,
      { headers, body: updateData },
      response,
      !response.success ? response.data?.error || 'Match update failed' : null
    );
  } catch (error) {
    logTest('Update Match', 'PUT', `/api/matches/${testData.matchId}`, {}, null, error.message);
  }

  // Test 24: Record Ball
  try {
    const ballData = {
      innings_id: '1',
      ballNumber: 1,
      over: 1,
      bowler: 'Test Bowler',
      striker: 'Test Batsman',
      nonStriker: 'Test Non-Striker',
      battingTeam: testData.teamId,
      bowlingTeam: testData.teamId2,
      runs: 4,
      totalRuns: 4,
      totalBalls: 1,
      isValidBall: true,
      extras: {
        wide: false,
        noBall: false,
        bye: false,
        legBye: false,
      },
      wicket: {
        isWicket: false,
        dismissalType: null,
        batsmanOut: null,
      },
      commentary: 'Four runs scored - Test ball',
      batting: [{
        player: 'Test Batsman',
        runs: 4,
        balls: 1
      }],
      bowling: {
        bowler: 'Test Bowler',
        totalRuns: 4,
        totalBallBowled: 1,
        currentOverStats: {}
      },
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', `/api/matches/${testData.matchId}/ball`, ballData, headers);
    
    logTest(
      'Record Ball',
      'POST',
      `/api/matches/${testData.matchId}/ball`,
      { headers, body: ballData },
      response,
      !response.success ? response.data?.error || 'Record ball failed' : null
    );

    if (response.success && response.data?.ball?._id) {
      testData.ballId = response.data.ball._id;
    }
  } catch (error) {
    logTest('Record Ball', 'POST', `/api/matches/${testData.matchId}/ball`, {}, null, error.message);
  }

  // Test 25: Undo Last Ball
  try {
    const undoData = {
      _id: testData.ballId,
    };
    
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('POST', `/api/matches/${testData.matchId}/undo`, undoData, headers);
    
    logTest(
      'Undo Last Ball',
      'POST',
      `/api/matches/${testData.matchId}/undo`,
      { headers, body: undoData },
      response,
      !response.success ? response.data?.error || 'Undo ball failed' : null
    );
  } catch (error) {
    logTest('Undo Last Ball', 'POST', `/api/matches/${testData.matchId}/undo`, {}, null, error.message);
  }

  // ============================================
  // 6. CLEANUP TESTS
  // ============================================
  console.log('\n🧹 Cleanup Tests\n');

  // Test 26: Delete Match
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('DELETE', `/api/matches/${testData.matchId}`, null, headers);
    
    logTest(
      'Delete Match',
      'DELETE',
      `/api/matches/${testData.matchId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Delete match failed' : null
    );
  } catch (error) {
    logTest('Delete Match', 'DELETE', `/api/matches/${testData.matchId}`, {}, null, error.message);
  }

  // Test 27: Delete Tournament
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('DELETE', `/api/tournaments/${testData.tournamentId}`, null, headers);
    
    logTest(
      'Delete Tournament',
      'DELETE',
      `/api/tournaments/${testData.tournamentId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Delete tournament failed' : null
    );
  } catch (error) {
    logTest('Delete Tournament', 'DELETE', `/api/tournaments/${testData.tournamentId}`, {}, null, error.message);
  }

  // Test 28: Delete Team 1
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('DELETE', `/api/teams/${testData.teamId}`, null, headers);
    
    logTest(
      'Delete Team 1',
      'DELETE',
      `/api/teams/${testData.teamId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Delete team 1 failed' : null
    );
  } catch (error) {
    logTest('Delete Team 1', 'DELETE', `/api/teams/${testData.teamId}`, {}, null, error.message);
  }

  // Test 29: Delete Team 2
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('DELETE', `/api/teams/${testData.teamId2}`, null, headers);
    
    logTest(
      'Delete Team 2',
      'DELETE',
      `/api/teams/${testData.teamId2}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Delete team 2 failed' : null
    );
  } catch (error) {
    logTest('Delete Team 2', 'DELETE', `/api/teams/${testData.teamId2}`, {}, null, error.message);
  }

  // Test 30: Delete Profile 1
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('DELETE', `/api/profiles/${testData.profileId}`, null, headers);
    
    logTest(
      'Delete Profile 1',
      'DELETE',
      `/api/profiles/${testData.profileId}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Delete profile 1 failed' : null
    );
  } catch (error) {
    logTest('Delete Profile 1', 'DELETE', `/api/profiles/${testData.profileId}`, {}, null, error.message);
  }

  // Test 31: Delete Profile 2
  try {
    const headers = { Authorization: `Bearer ${testData.token}` };
    const response = await makeRequest('DELETE', `/api/profiles/${testData.profileId2}`, null, headers);
    
    logTest(
      'Delete Profile 2',
      'DELETE',
      `/api/profiles/${testData.profileId2}`,
      { headers, body: null },
      response,
      !response.success ? response.data?.error || 'Delete profile 2 failed' : null
    );
  } catch (error) {
    logTest('Delete Profile 2', 'DELETE', `/api/profiles/${testData.profileId2}`, {}, null, error.message);
  }

  // Save results
  console.log('\n' + '='.repeat(50));
  saveResults();
  console.log('='.repeat(50) + '\n');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  saveResults();
  process.exit(1);
});

