
# 🧤 Goalkeeper Training App – Plan

A self-training app for goalkeepers with video-based workouts, structured feedback, and Duolingo-style daily gamification.

## 🎯 Core concept
Goalkeepers sign up, pick training sessions matched to their experience level, watch/perform them, log their results, and get automated feedback + skill scoring. A streak system and full gamification keep them coming back daily.

## 👤 Authentication & profile
- Email/password sign-up & login (Lovable Cloud)
- Profile: name, avatar, experience level (Beginner / Intermediate / Advanced / Pro), age group, dominant hand, training goals
- Profile stats: total XP, current level, longest streak, current streak, badges earned

## 📚 Training library
- Browse trainings by **category** (Reflexes, Positioning, Footwork, Diving, Distribution, High Balls, 1v1)
- Filter by **experience level** and **duration**
- Each training contains:
  - Title, description, difficulty, estimated duration, XP reward
  - **Video** – uploaded MP4 (cloud storage) **or** embedded YouTube/Vimeo link
  - Step-by-step instructions / drills checklist
  - Equipment needed

## 🗓️ Daily training flow
- Home screen shows **"Today's recommended session"** based on level + recent activity
- Mark drills as completed as they go
- After finishing → self-assessment form → submit

## 📝 Feedback & scoring system (per completed session)
- Free-text notes (how it went)
- Overall 1–5 star rating
- **Skill scores** (0–10 sliders) for the categories trained: Reflexes, Positioning, Footwork, Diving, Distribution, etc.
- **Automated feedback engine** generates personalised tips based on submitted scores (e.g. "Your footwork score has dropped — try the Ladder Drill series next")
- Progress charts over time per skill

## 🎮 Full gamification (Duolingo-style)
- **XP & Levels** – earn XP per training; level up at thresholds with celebratory animation
- **Daily streak** – fire icon counter, freeze tokens (1 missed day allowed/week), streak-saver reminders
- **Badges / Achievements** – e.g. "First Save", "7-Day Streak", "30-Day Streak", "10 Reflex Sessions", "Level 10 Reached", "All Categories Tried"
- **Leaderboard** – global + by experience level (weekly + all-time)
- **Weekly challenges** – e.g. "Complete 5 footwork sessions this week → bonus 200 XP"
- **Daily goal** – customisable XP target with progress ring

## 📊 Progress dashboard
- Streak calendar (heatmap of trained days)
- Skill radar chart (current scores across categories)
- XP timeline graph
- Trainings completed counter, total time trained
- Badge collection grid

## 🧭 Navigation (mobile-first)
Bottom tab bar: **Home · Trainings · Progress · Leaderboard · Profile**

## 🎨 Design direction
- Sporty, energetic, mobile-first
- Dark theme with vibrant accent (electric green / orange) – goalkeeper glove vibes
- Bold typography, clear iconography (Lucide), smooth micro-animations on XP gain & streak updates
- Card-based layout, large touch targets

## 🛠️ Tech setup
- **Lovable Cloud** for auth, database, file storage (uploaded videos), edge functions
- Tables: `profiles`, `trainings`, `categories`, `completed_sessions`, `skill_scores`, `badges`, `user_badges`, `streaks`, `challenges`
- RLS so each user only sees/edits their own data
- Seed library with ~15 starter training sessions across categories & levels

## 🚀 Build phases
1. Auth + profile setup with experience level
2. Training library + video player (upload + embed)
3. Session completion flow with feedback & skill scoring
4. XP, levels, streaks & daily goal
5. Badges, leaderboard, weekly challenges
6. Progress dashboard with charts
7. Seed content + polish
