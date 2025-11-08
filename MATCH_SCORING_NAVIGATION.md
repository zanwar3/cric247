# Match Scoring Navigation Flow

This document outlines the complete UI navigation flow for scoring a cricket match in the Cric247 application.

## Overview
To score a match, you need to:
1. Create a match
2. Set match status to "Live"
3. Navigate to the scoring page
4. Set up players (striker, non-striker, bowler)
5. Start scoring balls

---

## Step-by-Step Navigation Flow

### **Step 1: Create a Match**

**Route:** `/create-match`

**Navigation Options:**
- **From Home Page (`/`):**
  - Click on the **"Create Match"** card (green card with plus icon)
  - Or use the bottom navigation: Click the **"+"** button → Select **"Schedule Match"**

- **From Matches Page (`/matches`):**
  - Click **"Quick Create"** button in the header
  - Or click the **"Create Match"** tab

**What to Do:**
1. Select match type (Practice, Friendly, Tournament, or Private)
2. Configure match settings:
   - Select Game Type (T10, T20, ODI, Test, Custom)
   - Select Team 1 and Team 2
   - Select Pitch Type
   - Enter Venue Name and Location
   - Enter Date and Time
   - Select Tournament (if tournament match)
   - Adjust Powerplay settings (if applicable)
3. Review match details
4. Click **"Create Match"** button

**Result:** Match is created with status "upcoming"

---

### **Step 2: Set Match Status to "Live"**

**Route:** `/matches`

**Navigation Options:**
- **From Home Page (`/`):**
  - Click on **"Matches"** in the bottom navigation bar
  - Or click the **"Matches"** card if available

- **Direct URL:** Navigate to `/matches`

**What to Do:**
1. Find the match you created in the matches list
2. Click the **"Edit"** button on the match card
3. In the edit form, change the **Status** dropdown from "Scheduled/Upcoming" to **"Live"**
4. Click **"Update Match"** button

**Alternative:** You can also set status to "Live" when creating a match by selecting "Live" in the status dropdown during match creation.

**Result:** Match status is now "Live"

---

### **Step 3: Navigate to Scoring Page**

**Route:** `/score/[matchId]`

**Navigation Options:**

#### **Option A: From Matches Page**
1. Go to `/matches`
2. Find the match with status **"Live"**
3. Click the **"Score"** button (green button - only visible when status is "Live")
4. You will be redirected to `/score/[matchId]`

#### **Option B: From Ongoing Matches Page**
1. Navigate to `/ongoing-matches` (if available)
2. Find your live match
3. Click **"Continue Scoring"** button
4. You will be redirected to `/score/[matchId]`

#### **Option C: Direct URL**
- If you know the match ID, navigate directly to `/score/[matchId]`

**Result:** You are now on the scoring page

---

### **Step 4: Set Up Players (Initial Setup)**

**On Scoring Page (`/score/[matchId]`):**

**Before scoring, you must set up:**
1. **Striker** (batsman on strike)
2. **Non-Striker** (batsman at non-striker end)
3. **Bowler** (current bowler)

**How to Set Up Players:**
1. Click the **"Update Players"** button (orange button below the scoring buttons)
2. A **Player Management Panel** will open

**In the Player Management Panel:**
- **Select Striker:**
  - Choose from the batting team players dropdown
  - Select a player who is NOT the non-striker

- **Select Non-Striker:**
  - Choose from the batting team players dropdown
  - Select a player who is NOT the striker

- **Select Bowler:**
  - Choose from the bowling team players dropdown

3. Click **"Close"** button to return to scoring page

**Note:** You can also swap striker and non-striker using the shuffle icon (↔) between their names

---

### **Step 5: Start Scoring**

**On Scoring Page (`/score/[matchId]`):**

#### **Score Runs:**
- Click the numbered buttons (**0, 1, 2, 3, 4, 5, 6**) to record runs
- **0** = Dot ball (no runs)
- **4** = Four runs (green button)
- **6** = Six runs (purple button)
- Other numbers = 1, 2, 3, or 5 runs (blue buttons)

#### **Record Wickets:**
- Click the **"OUT"** button (red button)
- Select dismissal type:
  - Bowled
  - Caught
  - LBW
  - Stumped
  - Run Out
  - Hit Wicket
  - Obstructing
- If required, enter fielder name
- Click **"Record Wicket"**

#### **Record Extras:**
- Click the **"Extras"** button (gray button at bottom)
- Select extra type:
  - Wide
  - No Ball
  - Bye
  - Leg Bye
- Select number of runs (1-5)
- Click **"Record Extra"**

#### **Other Actions:**
- **Swap Striker/Non-Striker:** Click the shuffle icon (↔) between player names
- **Update Players:** Click "Update Players" button (opens after every 6 balls or manually)
- **Undo Last Ball:** Click "UNDO" button (yellow button)
- **Switch Teams (Innings Change):** Click "Switch Teams" button in Player Management Panel

---

## Quick Reference: Button Locations

### **Home Page (`/`)**
- **Create Match Card** → Green card with plus icon

### **Matches Page (`/matches`)**
- **Quick Create Button** → Header (top right)
- **Create Match Tab** → Tab navigation
- **Score Button** → On match card (only when status is "Live")

### **Scoring Page (`/score/[matchId]`)**
- **Run Buttons (0-6)** → Top section, 4x2 grid
- **OUT Button** → Red button, bottom right of run buttons
- **Update Players Button** → Orange button, below run buttons
- **UNDO Button** → Yellow button, next to Update Players
- **Extras Button** → Gray button, bottom section
- **Shuffle Icon (↔)** → Between striker and non-striker names

---

## Visual Flow Diagram

```
┌─────────────────┐
│   Home Page (/) │
└────────┬────────┘
         │
         │ Click "Create Match"
         ▼
┌─────────────────────┐
│ /create-match       │
│ 1. Select Match Type│
│ 2. Configure Match  │
│ 3. Create Match     │
└────────┬────────────┘
         │
         │ Match Created (status: "upcoming")
         ▼
┌─────────────────┐
│ /matches        │
│ Edit Match      │
│ Set Status: Live│
└────────┬────────┘
         │
         │ Click "Score" Button
         ▼
┌─────────────────────┐
│ /score/[matchId]     │
│ 1. Update Players    │
│    - Striker         │
│    - Non-Striker     │
│    - Bowler          │
│ 2. Start Scoring    │
│    - Runs (0-6)      │
│    - Wickets (OUT)   │
│    - Extras          │
└─────────────────────┘
```

---

## Important Notes

1. **Match Status:** Only matches with status "Live" show the "Score" button on the matches page
2. **Player Setup:** You must set striker, non-striker, and bowler before scoring
3. **Auto Player Panel:** Player management panel opens automatically after every 6 balls (completion of an over)
4. **Team Switching:** Use "Switch Teams" button in Player Management Panel when changing innings
5. **Undo Feature:** The UNDO button allows you to remove the last scored ball
6. **Live Updates:** Score updates in real-time as you record balls

---

## Troubleshooting

**Q: I don't see the "Score" button on my match**
- **Solution:** Make sure the match status is set to "Live". Edit the match and change status to "Live".

**Q: I can't score runs**
- **Solution:** Make sure you have selected striker, non-striker, and bowler. Click "Update Players" button to set them up.

**Q: I need to change players mid-over**
- **Solution:** Click "Update Players" button at any time to change players, even mid-over.

**Q: I scored a ball incorrectly**
- **Solution:** Use the "UNDO" button to remove the last ball, then score it correctly.

---

## Related Routes

- `/` - Home page
- `/create-match` - Create new match
- `/matches` - View and manage all matches
- `/score/[matchId]` - Score a match
- `/live/[matchId]` - View live match (view-only)
- `/ongoing-matches` - View ongoing/live matches

