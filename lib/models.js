/**
 * Central model registry
 * Import this file instead of individual models to ensure all models are registered
 * This prevents "Schema hasn't been registered" errors when using populate()
 */

import User from "@/models/User";
import Profile from "@/models/Profile";
import Team from "@/models/Team";
import Match from "@/models/Match";
import Ball from "@/models/Ball";
import Tournament from "@/models/Tournament";

export { User, Profile, Team, Match, Ball, Tournament };

