import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Profile from "@/models/Profile";
import Team from "@/models/Team";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Fetch only matches belonging to the authenticated user
    const matches = await Match.find({ user: user.id })
      .populate('teams.teamA')
      .populate('teams.teamB')
      .populate('matchSquad.teamA.players.player')
      .populate('matchSquad.teamB.players.player')
      .sort({ scheduledDate: -1 });
    
    // Add isStarted property and flatten player structure
    const matchesWithStartedFlag = matches.map(match => {
      const matchObj = match.toObject();
      
      // Check if innings has started (has current players set)
      const currentInnings = match.innings && match.innings.length > 0 
        ? match.innings[match.currentInnings - 1] 
        : null;
      
      matchObj.isStarted = !!(
        currentInnings && 
        (currentInnings.currentStriker || 
         currentInnings.currentNonStriker || 
         currentInnings.currentBowler)
      );
      
      // Simplify team data to just name and _id
      if (matchObj.teams?.teamA && typeof matchObj.teams.teamA === 'object') {
        matchObj.teams.teamA = {
          _id: matchObj.teams.teamA._id,
          name: matchObj.teams.teamA.name
        };
      }
      if (matchObj.teams?.teamB && typeof matchObj.teams.teamB === 'object') {
        matchObj.teams.teamB = {
          _id: matchObj.teams.teamB._id,
          name: matchObj.teams.teamB.name
        };
      }
      
      // Flatten player structure for teamA
      if (matchObj.matchSquad?.teamA?.players) {
        matchObj.matchSquad.teamA.players = matchObj.matchSquad.teamA.players.map(playerEntry => {
          if (playerEntry.player && typeof playerEntry.player === 'object') {
            return {
              _id: playerEntry.player._id,
              name: playerEntry.player.name,
              email: playerEntry.player.email,
              role: playerEntry.player.role,
              gender: playerEntry.player.gender,
              city: playerEntry.player.city,
              age: playerEntry.player.age,
              phone: playerEntry.player.phone,
              experience: playerEntry.player.experience,
              battingStyle: playerEntry.player.battingStyle,
              bowlingStyle: playerEntry.player.bowlingStyle,
              isCaptain: playerEntry.isCaptain || false,
              isKeeper: playerEntry.isKeeper || false
            };
          }
          return playerEntry;
        });
      }
      
      // Flatten player structure for teamB
      if (matchObj.matchSquad?.teamB?.players) {
        matchObj.matchSquad.teamB.players = matchObj.matchSquad.teamB.players.map(playerEntry => {
          if (playerEntry.player && typeof playerEntry.player === 'object') {
            return {
              _id: playerEntry.player._id,
              name: playerEntry.player.name,
              email: playerEntry.player.email,
              role: playerEntry.player.role,
              gender: playerEntry.player.gender,
              city: playerEntry.player.city,
              age: playerEntry.player.age,
              phone: playerEntry.player.phone,
              experience: playerEntry.player.experience,
              battingStyle: playerEntry.player.battingStyle,
              bowlingStyle: playerEntry.player.bowlingStyle,
              isCaptain: playerEntry.isCaptain || false,
              isKeeper: playerEntry.isKeeper || false
            };
          }
          return playerEntry;
        });
      }
      
      return matchObj;
    });
    
    return Response.json(matchesWithStartedFlag);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(req);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const data = await req.json();
    
    const matchData = {
      user: user.id, // Add user reference
      matchNumber: data.matchNumber || '',
      tournament: data.tournament || null,
      teams: {
        teamA: data.teams.teamA,
        teamB: data.teams.teamB
      },
      venue: data.venue || {},
      scheduledDate: new Date(data.scheduledDate),
      status: data.status || 'Scheduled',
      matchType: data.matchType || 'T20',
      officials: data.officials || {},
      notes: data.notes || ''
    };

    const newMatch = await Match.create(matchData);
    
    // Populate the created match before returning
    const populatedMatch = await Match.findById(newMatch._id)    
    return Response.json(populatedMatch, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create match' }, { status: 500 });
  }
}