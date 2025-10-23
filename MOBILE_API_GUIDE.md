# Mobile API Integration Guide

This guide explains how to use the Cric247 APIs in your mobile application.

## Overview

The Cric247 API supports both web and mobile authentication:
- **Web**: NextAuth with cookie-based sessions (for Next.js web app)
- **Mobile**: JWT token-based authentication (for mobile apps)

All existing API endpoints work seamlessly with mobile authentication once you have a valid JWT token.

## Quick Start

### 1. Register a New User

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response** (201 Created):
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Login (Mobile)

**Endpoint**: `POST /api/auth/mobile/login`

**Request**:
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "avatar": null,
    "profile": {
      "phone": "",
      "bio": "",
      "location": ""
    },
    "lastLogin": "2024-01-01T00:00:00.000Z"
  }
}
```

**Important**: Save the `token` securely in your mobile app (use Keychain on iOS or Keystore on Android).

### 3. Using the Token

For all subsequent API calls, include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Refresh Token (Optional)

**Endpoint**: `POST /api/auth/mobile/refresh`

**Headers**:
```
Authorization: Bearer <your_current_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

## Available API Endpoints

All endpoints require authentication (except registration and login).

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create a match
- `GET /api/matches/:id` - Get match by ID
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match
- `POST /api/matches/:id/ball` - Record a ball
- `POST /api/matches/:id/undo` - Undo last ball

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `POST /api/teams/:id/players` - Add player to team
- `DELETE /api/teams/:id/players` - Remove player from team

### Profiles (Players)
- `GET /api/profiles` - Get all player profiles
- `POST /api/profiles` - Create a profile
- `GET /api/profiles/:id` - Get profile by ID
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create a tournament
- `GET /api/tournaments/:id` - Get tournament by ID
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### User Profile
- `GET /api/user/profile` - Get current user profile

## Example: Creating a Match

**Request**:
```http
POST /api/matches
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "matchNumber": "MAT001",
  "teams": {
    "teamA": "team_a_id",
    "teamB": "team_b_id"
  },
  "venue": {
    "name": "Stadium Name",
    "city": "City Name"
  },
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "status": "Scheduled",
  "matchType": "T20"
}
```

**Response** (201 Created):
```json
{
  "_id": "match_id",
  "matchNumber": "MAT001",
  "teams": { ... },
  "venue": { ... },
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "status": "Scheduled",
  "matchType": "T20",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Mobile Implementation Examples

### React Native (JavaScript)

```javascript
// Store token after login
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login
const login = async (email, password) => {
  const response = await fetch('https://cric247-pi.vercel.app/api/auth/mobile/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store token securely
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }
  
  throw new Error(data.error);
};

// Make authenticated API call
const getMatches = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  
  const response = await fetch('https://cric247-pi.vercel.app/api/matches', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};
```

### Flutter (Dart)

```dart
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

final storage = FlutterSecureStorage();

// Login
Future<Map<String, dynamic>> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('https://cric247-pi.vercel.app/api/auth/mobile/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );
  
  final data = jsonDecode(response.body);
  
  if (data['success']) {
    // Store token securely
    await storage.write(key: 'auth_token', value: data['token']);
    await storage.write(key: 'user', value: jsonEncode(data['user']));
    return data;
  }
  
  throw Exception(data['error']);
}

// Make authenticated API call
Future<List<dynamic>> getMatches() async {
  final token = await storage.read(key: 'auth_token');
  
  final response = await http.get(
    Uri.parse('https://cric247-pi.vercel.app/api/matches'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  return jsonDecode(response.body);
}
```

## Token Expiration

- Tokens are valid for **30 days** (development mode)
- Before production, reduce this to 7-15 days and implement refresh token rotation
- Handle 401 responses by redirecting to login

## Error Handling

Common HTTP status codes:
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `500` - Internal server error

## Security Notes (Development Mode)

⚠️ **Current Setup (Dev Mode)**:
- CORS allows all origins (`*`)
- Token expiration is 30 days
- Simple JWT without refresh token rotation

✅ **Before Production**:
1. Restrict CORS to specific mobile app domains
2. Reduce token expiration to 7-15 days
3. Implement refresh token rotation
4. Add rate limiting
5. Enable HTTPS only
6. Add request signing for sensitive operations

## Testing with Postman

Import the `Cric247_API_Collection.postman_collection.json` file into Postman:
1. Open the "Mobile Authentication" folder
2. Run "Mobile Login" - token is automatically saved
3. All other requests will use the saved token automatically

## Support

For issues or questions, refer to the main README.md or check the API documentation in the Postman collection.

