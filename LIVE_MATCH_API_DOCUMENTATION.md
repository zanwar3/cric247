# Live Match Mobile API Documentation

This document provides comprehensive documentation for all live match APIs implemented for the mobile application.

## Table of Contents

1. [Match Setup APIs](#match-setup-apis)
2. [Match Start APIs](#match-start-apis)
3. [Ball Recording API](#ball-recording-api)
4. [Live Data API](#live-data-api)
5. [Match End APIs](#match-end-apis)
6. [Undo API](#undo-api)
7. [Helper APIs](#helper-apis)
8. [Data Models](#data-models)
9. [Example Workflow](#example-workflow)

---

## Match Setup APIs

### 1. POST /api/matches/:id/setup

Set up match squad, toss, and other pre-match details.

**Request Body:**
```json
{
  "tossWinner": "teamId",
  "tossDecision": "Bat" | "Bowl",
  "oversLimit": 20,
  "matchSquad": {
    "teamA": {
      "players": [
        {
          "player": "playerId",
          "isCaptain": true,
          "isKeeper": false
        }
      ]
    },
    "teamB": {
      "players": [
        {
          "player": "playerId",
          "isCaptain": false,
          "isKeeper": true
        }
      ]
    }
  }
}
```

**Validation:**
- Both teams must have the same number of players
- Each team must have exactly 1 captain
- Each team must have exactly 1 wicket keeper
- Minimum 1 player per team (flexible team size)

**Response:**
```json
{
  "success": true,
  "message": "Match setup completed successfully",
  "match": { ... }
}
```

---

### 1b. PATCH or PUT /api/matches/:id/revise-overs

Revise (update) the overs limit for a match. Allowed when match status is **Scheduled** or **Live**. When the match is Live, the new overs limit must be at least the number of overs already bowled in the current innings.

**Request Body:**
```json
{
  "oversLimit": 20
}
```

**Validation:**
- `oversLimit` (number) is required; must be between 1 and 50
- Match must be in status "Scheduled" or "Live"
- If Live: new overs cannot be less than balls already bowled (minimum overs = ceil(totalBalls / 6))

**Response:**
```json
{
  "success": true,
  "message": "Match overs revised successfully",
  "oversLimit": 20
}
```

---

## Match Start APIs

### 2. POST /api/matches/:id/start

Start the match and initialize first innings.

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Match started successfully. Please set opening batsmen and bowler.",
  "match": { ... },
  "innings": { ... },
  "battingTeam": { ... },
  "bowlingTeam": { ... },
  "needsPlayers": true
}
```

**What it does:**
- Determines batting/bowling teams based on toss
- Creates first innings with empty stats
- Sets match status to "Live"
- Records actualStartTime

---

### 3. POST /api/matches/:id/start-innings

Set opening batsmen and bowler to start scoring.

**Request Body:**
```json
{
  "striker": "playerId",
  "nonStriker": "playerId",
  "bowler": "playerId"
}
```

**Validation:**
- Striker and non-striker must be different
- All three players must be provided

**Response:**
```json
{
  "success": true,
  "message": "Innings players set successfully. Ready to start scoring.",
  "match": { ... },
  "currentInnings": { ... },
  "striker": { ... },
  "nonStriker": { ... },
  "bowler": { ... }
}
```

---

## Ball Recording API

### 4. POST /api/matches/:id/ball

Record a ball with comprehensive stat updates.

**Request Body:**
```json
{
  "runs": 0-6,
  "extras": {
    "wide": false,
    "noBall": false,
    "bye": false,
    "legBye": false
  },
  "wicket": {
    "isWicket": false,
    "dismissalType": "Bowled" | "Caught" | "LBW" | "Run Out" | "Stumped" | "Hit Wicket" | "Obstructing" | "Retired",
    "bowler": "playerId",
    "fielder": "playerId"
  }
}
```

**What it does:**
1. Validates striker, non-striker, bowler are set
2. Processes ball type (legal, wide, no-ball, bye, leg-bye)
3. Updates innings totals (runs, wickets, balls, overs)
4. Updates batsman stats (runs, balls, 4s, 6s, strike rate)
5. Updates bowler stats (runs, wickets, overs, economy)
6. Handles wickets (updates fall of wickets, clears striker)
7. Updates partnerships
8. Calculates run rates (current and required)
9. Rotates striker on odd runs or end of over
10. Saves to both Ball collection and Match.innings

**Response:**
```json
{
  "success": true,
  "ball": { ... },
  "innings": { ... },
  "needsNewBatsman": false,
  "needsNewBowler": false
}
```

**Key Rules:**
- Wide/No-ball: Do NOT increment ball count, add 1 extra run
- Bye/Leg-bye: Increment ball count, runs not credited to batsman
- Wicket on no-ball: Only run out allowed
- Striker rotation: Odd runs (1,3,5) or end of over
- Over completion: After 6 legal balls

---

## Live Data API

### 5. GET /api/matches/:id/live

Get comprehensive live match state in a single call.

**Response:**
```json
{
  "match": {
    "matchId": "...",
    "status": "Live",
    "matchType": "T20",
    "oversLimit": 20,
    "playersPerTeam": 11,
    "currentInnings": 1,
    "teams": { ... },
    "venue": { ... },
    "tossWinner": "...",
    "tossDecision": "Bat"
  },
  "innings": {
    "inningNumber": 1,
    "battingTeam": { ... },
    "bowlingTeam": { ... },
    "score": {
      "runs": 145,
      "wickets": 4,
      "overs": "15.2",
      "totalBalls": 92,
      "runRate": 9.45,
      "requiredRunRate": 8.5
    },
    "currentBatsmen": {
      "striker": {
        "_id": "...",
        "name": "Player Name",
        "runs": 45,
        "balls": 32,
        "fours": 4,
        "sixes": 2,
        "strikeRate": 140.62
      },
      "nonStriker": { ... }
    },
    "currentBowler": {
      "_id": "...",
      "name": "Bowler Name",
      "overs": 3.2,
      "maidens": 0,
      "runs": 28,
      "wickets": 1,
      "economy": 8.40
    },
    "currentOver": {
      "overNumber": 16,
      "balls": ["1", "4", "0", "W", "wd", "6"]
    },
    "partnerships": [
      {
        "batsman1": { ... },
        "batsman2": { ... },
        "runs": 45,
        "balls": 28
      }
    ],
    "fallOfWickets": [
      {
        "score": "45-1",
        "player": { ... },
        "over": 8.3
      }
    ],
    "extras": {
      "byes": 2,
      "legByes": 3,
      "wides": 5,
      "noBalls": 1,
      "penalties": 0,
      "total": 11
    }
  },
  "scorecard": {
    "batting": [ ... ],
    "bowling": [ ... ]
  },
  "target": 180,
  "toWin": "35 runs needed from 28 balls"
}
```

**Use Case:** Mobile app can call this single endpoint to get all match data for live updates.

---

## Match End APIs

### 6. POST /api/matches/:id/end-innings

Complete current innings and prepare for next or end match.

**Request Body (optional):**
```json
{ "declare": true }
```
- `declare`: When `true` (first innings only), marks the innings as **declared** (batting team voluntary closure). Response message will indicate "Innings declared."

**Response (First Innings):**
```json
{
  "success": true,
  "message": "First innings completed. Second innings ready to start.",
  "inningsSummary": { ... },
  "target": 181,
  "nextInnings": 2,
  "needsPlayers": true
}
```

**Response (Second Innings):**
```json
{
  "success": true,
  "message": "Match completed",
  "inningsSummary": { ... },
  "result": {
    "winner": "teamId",
    "winBy": "runs" | "wickets",
    "margin": 25,
    "winnerName": "Team Name"
  }
}
```

**What it does:**
- Marks innings as completed
- For 1st innings: Sets target, creates 2nd innings
- For 2nd innings: Calculates winner, updates match status to "Completed"

---

### 7. POST /api/matches/:id/end-match

Manually end match and set final result.

**Request Body:**
```json
{
  "manOfTheMatch": "playerId"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match completed successfully",
  "result": {
    "winner": "teamId",
    "winBy": "runs" | "wickets" | "tie" | "no result",
    "margin": 25,
    "manOfTheMatch": "playerId",
    "resultMessage": "Team A won by 25 runs"
  },
  "match": { ... }
}
```

**What it does:**
- Calculates winner based on scores
- Updates team statistics (matches played, won, lost)
- Sets actualEndTime
- Marks all innings as completed

---

## Undo API

### 8. POST /api/matches/:id/undo

Undo the last ball and reverse all stats.

**Request Body:** None (automatically finds latest ball)

**Response:**
```json
{
  "success": true,
  "message": "Ball undone successfully",
  "innings": { ... },
  "undoneAt": "2025-11-08T10:30:00.000Z"
}
```

**What it reverses:**
- Innings totals (runs, wickets, balls, overs)
- Batsman stats (runs, balls, 4s, 6s, strike rate)
- Bowler stats (runs, wickets, overs, economy)
- Extras (wides, no-balls, byes, leg-byes)
- Wickets (restores striker, removes from fall of wickets)
- Partnerships (runs and balls)
- Striker rotation
- Run rates

---

## Helper APIs

### 9. PATCH /api/matches/:id/change-bowler

Change the current bowler (typically at end of over).

**Request Body:**
```json
{
  "newBowler": "playerId"
}
```

**Validation:**
- Same bowler cannot bowl consecutive overs

**Response:**
```json
{
  "success": true,
  "message": "Bowler changed successfully",
  "newBowler": "playerId"
}
```

---

### 10. PATCH /api/matches/:id/change-batsman

Replace a batsman (for injury, retirement, etc.).

**Request Body:**
```json
{
  "newBatsman": "playerId",
  "position": "striker" | "nonStriker"
}
```

**Validation:**
- New batsman cannot be the same as the other batsman

**Response:**
```json
{
  "success": true,
  "message": "Striker changed successfully",
  "newBatsman": "playerId",
  "position": "striker"
}
```

**What it does:**
- Ends current partnership
- Starts new partnership with new batsman
- Updates striker or non-striker

---

### 11. GET /api/matches/:id/scorecard

Get full scorecard (for completed or ongoing matches).

**Response:**
```json
{
  "match": { ... },
  "innings": [
    {
      "inningNumber": 1,
      "battingTeam": { ... },
      "bowlingTeam": { ... },
      "score": { ... },
      "batting": [ ... ],
      "bowling": [ ... ],
      "fallOfWickets": [ ... ],
      "extras": { ... }
    }
  ],
  "result": { ... }
}
```

---

## Data Models

### Match Model Updates

New fields added:
```javascript
{
  oversLimit: Number,           // 20 for T20, 50 for ODI
  playersPerTeam: Number,       // Flexible: 5, 7, 9, 11, etc.
  currentInnings: Number,       // 0, 1, or 2
  matchSquad: {
    teamA: {
      players: [{ player, isCaptain, isKeeper }],
      captain: ObjectId,
      keeper: ObjectId
    },
    teamB: { ... }
  }
}
```

### Innings Schema Updates

New fields added:
```javascript
{
  currentStriker: ObjectId,
  currentNonStriker: ObjectId,
  currentBowler: ObjectId,
  runRate: Number,
  requiredRunRate: Number,
  partnerships: [{
    batsman1: ObjectId,
    batsman2: ObjectId,
    runs: Number,
    balls: Number
  }],
  fallOfWickets: [{
    runs: Number,
    wickets: Number,
    player: ObjectId,
    over: Number
  }]
}
```

---

## Example Workflow

### Complete Match Flow

```javascript
// 1. Create match (existing API)
POST /api/matches
{
  "teams": { "teamA": "...", "teamB": "..." },
  "matchType": "T20",
  "scheduledDate": "..."
}

// 2. Setup match
POST /api/matches/:id/setup
{
  "tossWinner": "teamA",
  "tossDecision": "Bat",
  "oversLimit": 20,
  "matchSquad": { ... }
}

// 3. Start match
POST /api/matches/:id/start

// 4. Set opening players
POST /api/matches/:id/start-innings
{
  "striker": "player1",
  "nonStriker": "player2",
  "bowler": "player3"
}

// 5. Record balls
POST /api/matches/:id/ball
{ "runs": 4, "extras": {}, "wicket": {} }

POST /api/matches/:id/ball
{ "runs": 1, "extras": {}, "wicket": {} }

POST /api/matches/:id/ball
{ "runs": 0, "extras": { "wide": true }, "wicket": {} }

// 6. Get live data (anytime)
GET /api/matches/:id/live

// 7. Undo if needed
POST /api/matches/:id/undo

// 8. Change bowler after over
PATCH /api/matches/:id/change-bowler
{ "newBowler": "player4" }

// 9. Record wicket
POST /api/matches/:id/ball
{
  "runs": 0,
  "extras": {},
  "wicket": {
    "isWicket": true,
    "dismissalType": "Caught",
    "bowler": "player3",
    "fielder": "player5"
  }
}

// 10. Set new batsman after wicket
POST /api/matches/:id/start-innings
{
  "striker": "player6",
  "nonStriker": "player2",
  "bowler": "player4"
}

// 11. End first innings
POST /api/matches/:id/end-innings

// 12. Start second innings
POST /api/matches/:id/start-innings
{
  "striker": "player7",
  "nonStriker": "player8",
  "bowler": "player1"
}

// 13. Continue scoring...

// 14. End match
POST /api/matches/:id/end-match
{ "manOfTheMatch": "player1" }

// 15. Get final scorecard
GET /api/matches/:id/scorecard
```

---

## Testing Tips

1. **Use Postman Collection**: Import the existing `Cric247_API_Collection.postman_collection.json` and add these new endpoints.

2. **Test Sequence**: Always follow the proper sequence:
   - Create → Setup → Start → Start Innings → Record Balls

3. **Validate Extras**: Test wide, no-ball, bye, leg-bye separately and in combination.

4. **Test Wickets**: Verify wicket handling, fall of wickets, and striker clearing.

5. **Test Undo**: Record several balls, then undo them one by one to verify reversal.

6. **Test Striker Rotation**: 
   - Score 1 run → striker should swap
   - Score 2 runs → striker should NOT swap
   - Complete over → striker should swap

7. **Test Run Rates**: Verify current run rate and required run rate calculations.

8. **Test Flexible Team Size**: Try with 5v5, 7v7, 9v9, 11v11.

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

---

## Notes

1. **Authentication**: All endpoints require authentication via JWT token.

2. **User Scoping**: All data is scoped to the authenticated user.

3. **Real-time Updates**: Mobile apps should poll `/api/matches/:id/live` every 5-10 seconds for live updates.

4. **Performance**: The live endpoint is optimized with proper population and indexing.

5. **Flexibility**: Team size is now flexible (not rigid 11 players).

6. **Data Integrity**: Ball collection stores history, Match.innings stores aggregated state.

---

## Support

For issues or questions, refer to:
- Main README: `/README.md`
- Test Suite: `/TEST_SUITE_README.md`
- Mobile API Curls: `/MOBILE_API_CURLS.txt`

