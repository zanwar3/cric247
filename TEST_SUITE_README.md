# Mobile API Test Suite

## Overview

This test suite comprehensively tests all mobile API endpoints for the Cric247 application. It runs tests sequentially, following a logical flow from authentication through resource creation, updates, and cleanup.

## Features

- ✅ **Sequential Testing**: Tests run in order, building on previous results
- ✅ **Full Coverage**: Tests all CRUD operations for all endpoints
- ✅ **Detailed Logging**: Captures full request/response data with timing
- ✅ **JSON Output**: Saves comprehensive results to `test-results.json`
- ✅ **Configurable**: Easy to switch between environments
- ✅ **Error Handling**: Continues testing even if individual tests fail
- ✅ **Resource Tracking**: Tracks all created resource IDs

## Test Flow

### 1. Authentication (3 tests)
- Register User
- Mobile Login
- Refresh Token

### 2. Profiles (6 tests)
- Create Profile 1
- Create Profile 2
- Get All Profiles
- Get Profile by ID
- Update Profile

### 3. Teams (7 tests)
- Create Team 1
- Create Team 2
- Get All Teams
- Get Team by ID
- Update Team
- Add Player to Team
- Remove Player from Team

### 4. Tournaments (4 tests)
- Create Tournament
- Get All Tournaments
- Get Tournament by ID
- Update Tournament

### 5. Matches (6 tests)
- Create Match
- Get All Matches
- Get Match by ID
- Update Match
- Record Ball
- Undo Last Ball

### 6. Cleanup (6 tests)
- Delete Match
- Delete Tournament
- Delete Team 1
- Delete Team 2
- Delete Profile 1
- Delete Profile 2

**Total: 32 comprehensive tests**

## Usage

### Run the Test Suite

```bash
# Using npm script
npm run test:api

# Or directly with node
node test-mobile-api.js
```

### Change Base URL

Edit the `BASE_URL` constant in `test-mobile-api.js`:

```javascript
const BASE_URL = 'https://cric247-pi.vercel.app'; // Production
// const BASE_URL = 'http://localhost:3000'; // Local development
```

## Output

### Console Output

The test suite provides real-time console output:

```
🚀 Starting Mobile API Test Suite
🌐 Base URL: https://cric247-pi.vercel.app

📝 Authentication Tests

✅ Register User - 201 (523ms)
✅ Mobile Login - 200 (412ms)
✅ Refresh Token - 200 (234ms)

👤 Profile Tests

✅ Create Profile - 201 (345ms)
...
```

### JSON Output File

Results are saved to `test-results.json` with the following structure:

```json
{
  "summary": {
    "totalTests": 32,
    "passed": 30,
    "failed": 2,
    "successRate": "93.75%",
    "totalDuration": "12345ms",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "baseUrl": "https://cric247-pi.vercel.app"
  },
  "createdResources": {
    "userId": "...",
    "profileId": "...",
    "teamId": "...",
    "tournamentId": "...",
    "matchId": "..."
  },
  "tests": [
    {
      "testName": "Register User",
      "endpoint": "/api/auth/register",
      "method": "POST",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "success",
      "statusCode": 201,
      "duration": 523,
      "request": {
        "headers": {},
        "body": { ... }
      },
      "response": {
        "headers": { ... },
        "body": { ... }
      }
    },
    ...
  ]
}
```

## Test Data

The test suite automatically generates unique test data using timestamps:

- **Email**: `test{timestamp}@example.com`
- **Player Emails**: `player{timestamp}@example.com`
- **Team Names**: `Test Team {timestamp}`
- **Tournament Names**: `Test Tournament {timestamp}`
- **Match Numbers**: `MAT{timestamp}`

This ensures tests can run multiple times without conflicts.

## Requirements

- Node.js (built-in `fetch` API, requires Node 18+)
- No external dependencies required (uses native fetch)

## Error Handling

- Individual test failures don't stop execution
- All errors are captured and logged
- Failed tests show error messages in both console and JSON output
- Network errors are handled gracefully

## Notes

- Tests create real data on the server
- Cleanup tests attempt to remove all created resources
- If cleanup fails, resources may remain on the server
- Each test run uses unique identifiers to avoid conflicts
- Token is automatically refreshed and reused across tests

## Troubleshooting

### Test Fails with "Network Error"
- Check if the BASE_URL is correct and accessible
- Verify internet connection
- Check if the server is running (for localhost)

### Authentication Tests Fail
- Verify the email doesn't already exist
- Check password requirements (min 6 characters)
- Ensure database is accessible

### Resource Creation Fails
- Check if authentication token is valid
- Verify required fields are provided
- Check server logs for detailed errors

### Cleanup Tests Fail
- Resources may have dependencies preventing deletion
- Check if resources were actually created
- Manual cleanup may be required

## Customization

### Add New Tests

Add new test blocks following the existing pattern:

```javascript
try {
  const headers = { Authorization: `Bearer ${testData.token}` };
  const response = await makeRequest('GET', '/api/your-endpoint', null, headers);
  
  logTest(
    'Your Test Name',
    'GET',
    '/api/your-endpoint',
    { headers, body: null },
    response,
    !response.success ? response.data?.error || 'Test failed' : null
  );
} catch (error) {
  logTest('Your Test Name', 'GET', '/api/your-endpoint', {}, null, error.message);
}
```

### Modify Test Data

Edit the data objects in each test block to customize test payloads.

### Change Output File

Modify the `OUTPUT_FILE` constant:

```javascript
const OUTPUT_FILE = 'test-results.json';
```

## Support

For issues or questions about the test suite, refer to the main project documentation or contact the development team.

