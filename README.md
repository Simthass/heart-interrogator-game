<div align="center">
  <img src="public/Logo.png" alt="The Heart Interrogator Logo" width="200"/>

  <h1>🤖 The Heart Interrogator</h1>

  <p><em>A browser-based detective game built on top of the Heart Game API - can you outsmart the AI?</em></p>

  <br/>

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

  <br/>

> **CIS045-3 Distributed Service Architectures - Assignment 1**
> Simthass Mohammed | Student ID: 2540927 | University of Bedfordshire

</div>

---

## 📋 Table of Contents

- [What Is This Game?](#what-is-this-game)
- [How To Play](#how-to-play)
- [Features](#features)
- [Project Structure](#project-structure)
- [The Four Assignment Themes](#the-four-assignment-themes)
- [How To Setup & Run](#how-to-setup--run)
- [API Reference](#api-reference)
- [Pages Overview](#pages-overview)
- [Known Issues](#known-issues)
- [References & Credits](#references--credits)

---

## 🎮 What Is This Game?

**The Heart Interrogator** is a game where you play as a detective trying to interrogate a lying AI robot. Every round, the Heart API sends you a puzzle image showing hearts. The AI looks at the image and then tells you a number - but the AI might be lying!

Your job is to either:

- **TRUST** the AI's answer (if you think its telling the truth)
- **VERIFY** yourself by counting the hearts in the image (if you think its lying)

You have 10 rounds per game. Each round has a timer. If you run out of 3 lives, the game is over. The game saves your scores to a database so you can track your progress.

This project was built for the DSA module to demonstrate interoperability, event-driven programming, authentication (virtual identity), and good software design principles.

---

## 🕹️ How To Play

1. **Register or Login** - create an account first (or play as guest but your scores wont save)
2. **Start a game** - click Play Now on the home page
3. **Each round:**
   - A heart puzzle image loads from the Heart API
   - The AI robot claims a number (it might be lying!)
   - You see the AI's confidence meter
   - Decide: **TRUST** the robot or **VERIFY** it yourself
4. **Scoring:**
   - TRUST and correct → **+20 points**
   - VERIFY and correct → **+10 points**
   - Wrong answer → lose a **life ❤️**
5. Survive all 10 rounds to win the case!

---

## ✨ Features

| Feature           | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| 🤖 AI Suspect     | Robot that lies randomly with a fake confidence meter                         |
| ⏱️ Timer          | Countdown timer that gets harder based on your rank                           |
| 🏆 Ranking System | 10 ranks from Rookie Cadet to Director, unlocked by wins                      |
| 🧠 Robot Memory   | The AI remembers which numbers you got wrong before and uses them against you |
| 🔊 AI Voice       | Text-to-speech for the robot (using Web Speech API)                           |
| 📊 Stats Page     | Your total score, accuracy, wins, recent games                                |
| 🥇 Leaderboard    | Global rankings sorted by total score                                         |
| 🏅 Achievements   | 20 unlockable badges based on gameplay milestones                             |
| ⚙️ Settings       | Toggle sounds, change password, choose difficulty                             |
| 🔐 Auth System    | Register/login with JWT tokens stored in cookies                              |

---

## 📁 Project Structure

```
heart-interrogator/
│
├── models/
│   ├── User.js                   ← Mongoose schema for user accounts
│   └── Game.js                   ← Mongoose schema for game sessions
│
├── routes/
│   ├── auth.js                   ← POST /api/reg and POST /api/log
│   ├── game.js                   ← save-game, my-stats, recent-games, leaderboard, global-data
│   └── user.js                   ← user-info, update-pass, delete-account
│
├── middleware/
│   └── auth.js                   ← JWT verification middleware for protected routes
│
├── js/
│   ├── cookies.js                ← getCookie / setCookie / deleteCookie helpers
│   ├── header.js                 ← header auth display and active nav highlighting
│   ├── modal.js                  ← showLogin / showRegister / closeModals
│   ├── login.js                  ← login form submit and JWT cookie storage
│   ├── register.js               ← register form validation and password strength bar
│   ├── account.js                ← delete account modal and confirmation
│   ├── pages.js                  ← rank grid and 20 achievements for stats page
│   ├── results.js                ← reads localStorage and builds results table
│   ├── gameState.js              ← all shared game variables in one place
│   ├── gameUI.js                 ← all DOM updates during game (HUD, flash, notifications)
│   ├── gameTimer.js              ← countdown timer and switcheroo mechanic
│   ├── gameAPI.js                ← Heart API and YesNo API calls
│   ├── gameAudio.js              ← robot speech synthesis and drum roll sound
│   ├── gameRank.js               ← fetches win count from DB and sets rank level
│   ├── gameSave.js               ← saves results to localStorage and backend DB
│   └── game.js                   ← main game orchestrator (round flow, decisions)
│
├── css/
│   ├── style.css                 ← global styles, header, footer, modals
│   ├── game.css                  ← game page layout and in-game components
│   ├── pages.css                 ← stats and settings pages
│   └── results.css               ← results page
│
├── public/
│   └── Logo.png                  ← game logo
│
├── index.html                    ← home/landing page
├── game.html                     ← main game page (interrogation room)
├── results.html                  ← results screen after game ends
├── stats.html                    ← my stats and achievements
├── settings.html                 ← account and game settings
├── header.html                   ← shared header component (loaded via fetch)
│
├── server.js                     ← Node/Express entry point, mounts all route files
├── .env                          ← environment variables (not committed!)
├── .env.example                  ← safe template showing required variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🎓 The Four Assignment Themes

This section explains how each of the four themes from the assignment is implemented in my code. This is important for understanding the video submission.

---

### 1. 🧩 Software Design Principles - Low Coupling & High Cohesion

The backend was refactored from a single large server.js into separate files by concern:

- `models/User.js` - only the user data schema, no logic
- `models/Game.js` - only the game session data schema
- `routes/auth.js` - only register and login routes
- `routes/game.js` - only game-related routes (save, stats, leaderboard)
- `routes/user.js` - only account management routes (profile, password, delete)
- `middleware/auth.js` - single reusable JWT check function used by all protected routes
- `server.js` - now just three app.use() calls, nothing else

The frontend is split into 16 JavaScript files each with one clear responsibility:

- `gameState.js` - only the shared game variables (score, lives, round, etc)
- `gameAPI.js` - only the external API calls, no DOM touching
- `gameTimer.js` - only the countdown and difficulty mechanics
- `gameUI.js` - only DOM updates during the game
- `gameAudio.js` - only robot voice and sound effects
- `gameRank.js` - only fetching rank from database
- `gameSave.js` - only saving results at game end
- `game.js` - only the round flow and player decisions (orchestrator)
- `cookies.js` - only getCookie, setCookie, deleteCookie (no more duplication)
- `account.js` - delete account (moved out of register.js where it did not belong)

The frontend and backend only communicate through the REST API using HTTP and JSON. Neither side knows about the internals of the other. If the server changes how data is stored, the frontend does not break.

> Low coupling example: game.js calls saveGameToDB() from gameSave.js and does not know anything about how the database works. It just calls the function and moves on.

> High cohesion example: gameAPI.js contains everything related to external API calls - fetching the puzzle, fetching the yes/no decision, and the fallback if an API is unavailable. All related things in one place.

---

### 2. ⚡ Event-Driven Programming

The whole game is built around events. Nothing happens unless something triggers it:

**DOM Events (user interaction):**

- Clicking **TRUST** button → fires `trustSuspect()`
- Clicking **VERIFY** button → fires `showVerifyInput()` which shows the number input box
- Clicking **GO** (submit verify) → fires `submitVerification()` which checks if answer is correct
- Clicking **ABORT** button → immediately redirects to results page
- `input` event on number box → the input field reacts when user types

**Timer Events (gameTimer.js):**

- `setInterval()` in `startTimer()` counts down every second
- At 5 seconds with rank 3+, the Switcheroo mechanic fires and swaps the Trust/Verify button positions
- At 3 seconds the warning animation and red screen pulse starts
- At 0 the `handleTimeOut()` fires and the player loses a life

**Image Load Event (game.js):**

- `apiImage.onload` is the event that actually starts each round - the timer does not begin until the puzzle image has fully loaded so the player can see it

**Window/Page Events:**

- `window.onload` - initialises all game variables and fetches rank from DB before round 1 starts
- `DOMContentLoaded` - used in login.js and register.js to set up form listeners after HTML is ready

**Cross-Page Events (via localStorage):**

- gameSave.js writes round history, score, lives, and accuracy to localStorage when the game ends
- results.js reads from localStorage on DOMContentLoaded - the results page does not know when the game ended, it just reacts to what it finds in storage

---

### 3. 🌐 Interoperability

The game communicates with multiple independent external systems:

**Heart Game API (External Web Service):**

```
https://marcconrad.com/uob/heart/api.php?out=json
```

This is the main interoperability example. My JavaScript code in gameAPI.js sends an HTTP GET request to this external API using fetch(). The API runs on a completely different server. Both communicate using standard HTTP and JSON format.

The response looks like:

```json
{
  "question": "https://marcconrad.com/uob/heart/q/...",
  "solution": 4
}
```

My code takes the `question` (image URL) and `solution` (correct answer) and uses them in the game.

**YesNo API (External Randomness Service):**

```
https://yesno.wtf/api
```

Every round, after fetching the Heart puzzle, the game also calls the YesNo API to randomly decide whether the AI robot should lie or tell the truth. In gameAPI.js both APIs are called simultaneously using Promise.all:

```javascript
let [heartRes, yesnoRes] = await Promise.all([
  fetch("https://marcconrad.com/uob/heart/api.php?out=json"),
  fetch("https://yesno.wtf/api"),
]);
```

I used an external API for the lying decision instead of just Math.random() because it demonstrates real interoperability - the decision comes from an independent system over HTTP. The YesNo API returns JSON with an answer field of "yes" or "no" and my code uses that to control core game logic. There is also a getFallbackAiAnswer() function in gameAPI.js that falls back to local randomness if the YesNo API goes down.

In every single round, fetchRoundData() in gameAPI.js is simultaneously talking to two different external servers and combining both responses to build the game state.

**My Own Backend API (Node.js + Express):**
The frontend HTML/JS pages communicate with my own Node server at localhost:3000. The frontend sends POST requests with JSON body, the server processes them and responds with JSON. This is also interoperability - the frontend and backend are separate systems talking through HTTP.

**Text-to-Speech (Web Speech API):**
The `robotSpeak()` function in gameAudio.js uses the browser built-in `window.speechSynthesis` API. This is another form of interoperability - my code calls a browser-provided interface to access the device text-to-speech engine.

---

### 4. 🔐 Virtual Identity / Authentication

User identity in this game works through a proper authentication flow:

**Registration:**

1. User fills in the register form on index.html
2. Frontend sends the data to `POST /api/reg` (routes/auth.js)
3. Server validates input (checks if username/email already exists, checks password length)
4. Password is hashed using **bcrypt** with salt rounds of 10 before storing in MongoDB - the raw password is never saved anywhere
5. Server creates a **JWT token** using `jwt.sign()` with the user ID and username inside it, expires in 15 days
6. Token is sent back to frontend and stored in a **browser cookie** (`authToken`) using setCookie() in cookies.js

**Login:**

1. User submits username or email and password
2. Server in routes/auth.js first looks up by username, then by email if not found
3. Compares entered password against the stored bcrypt hash using `bcrypt.compare()`
4. If valid → creates a new JWT token and sends back
5. Token stored in authToken cookie, username stored in loggedUser cookie

**Protected Routes (JWT Middleware):**
All the important game routes use the checkToken function in middleware/auth.js:

```javascript
function checkToken(req, res, next) {
  let authHead = req.headers.authorization;
  if (!authHead) {
    return res.status(401).json({ msg: "no token, access denied" });
  }
  let tokenOnly = authHead.split(" ")[1];
  jwt.verify(tokenOnly, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "token invalid or expired" });
    }
    req.userData = decoded;
    next();
  });
}
```

The frontend sends the token with every protected request using the Authorization Bearer header. The server determines identity from the verified token - the client cannot fake who a game belongs to because the user ID comes from req.userData, not the request body.

**Cookie Usage:**

- `authToken` cookie stores the JWT for session persistence
- `loggedUser` cookie stores the username for display purposes
- Both cookies are managed using getCookie(), setCookie(), deleteCookie() in cookies.js
- Remember me login gives 15 day expiry, normal login gives 1 day

---

## 🚀 How To Setup & Run

### What You Need First

- Node.js (v18 or newer)
- MongoDB (local or MongoDB Atlas free tier)
- A modern browser (Chrome recommended)

### Step 1 - Clone the repo

```bash
git clone https://github.com/Simthass/heart-interrogator-game.git
cd heart-interrogator
```

### Step 2 - Install backend packages

```bash
npm install
```

This installs: express, mongoose, bcrypt, jsonwebtoken, cors, dotenv

### Step 3 - Create the .env file

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit .env:

```
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=any_random_secret_string_you_choose
PORT=3000
```

> Note: never commit the .env file to GitHub - it is already in .gitignore

### Step 4 - Start the backend server

```bash
node server.js
```

You should see:

```
mongodb connected
server running on http://localhost:3000
```

### Step 5 - Open the frontend

Open `index.html` in your browser (or use Live Server in VS Code). The game will connect to the local server automatically.

> If using VS Code, right click index.html → Open with Live Server

---

## 🔌 API Reference

The game uses the **Heart Game API** by Marc Conrad:

```
GET https://marcconrad.com/uob/heart/api.php?out=json
```

Returns:

```json
{
  "question": "image URL of heart puzzle",
  "solution": 4
}
```

Documentation: https://marcconrad.com/uob/heart/doc.php

My code calls this in `fetchRoundData()` inside `js/gameAPI.js`. The `solution` value is the correct answer that gets compared against what the player decides.

---

## 📄 Pages Overview

| Page     | File            | What it does                                                  |
| -------- | --------------- | ------------------------------------------------------------- |
| Home     | `index.html`    | Landing page, login/register modals, leaderboard, how to play |
| Game     | `game.html`     | The actual interrogation game screen                          |
| Results  | `results.html`  | Shows performance summary after each game                     |
| Stats    | `stats.html`    | Personal stats, rank progression, all achievements            |
| Settings | `settings.html` | Account info, change password, game settings, delete account  |

---

## 🎯 Dynamic Difficulty System

The game automatically gets harder based on how many cases you have solved (wins). There are 10 rank levels and the timer shrinks as your rank goes up:

| Wins Needed | Rank                | Timer  |
| ----------- | ------------------- | ------ |
| 0           | Rookie Cadet        | 12 sec |
| 2+          | Patrol Officer      | 11 sec |
| 5+          | Junior Detective    | 10 sec |
| 10+         | Senior Detective    | 9 sec  |
| 15+         | Lead Investigator   | 8 sec  |
| 20+         | Inspector           | 7 sec  |
| 30+         | Chief Inspector     | 6 sec  |
| 40+         | Deputy Director     | 5 sec  |
| 50+         | Master Interrogator | 4 sec  |
| 75+         | Director of Intel   | 3 sec  |

At rank 3 (Senior Detective) and above, the Switcheroo mechanic fires at 5 seconds and swaps the Trust and Verify button positions. At rank 5 (Inspector) and above, the robot voice pitch drops and slows down. At rank 7 and above, the puzzle image briefly goes black mid-round.

---

## 🐛 Known Issues

- The game requires `http://localhost:3000` to be running. If the server is off, scores wont save (guest mode still works for playing)
- On mobile screens the 3 column game layout collapses to single column - it works but doesnt look as good
- The robot memory feature uses localStorage so it resets if you clear browser data
- Speech synthesis sounds a bit different depending on what browser/OS you use - Chrome sounds the best

---

## 📚 References & Credits

| Resource                                                                                              | How I used it                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Heart Game API by Marc Conrad (https://marcconrad.com/uob/heart/doc.php)                              | Main game puzzle API - the entire game concept is built around this                                   |
| GitHub examples by Marc Conrad (https://github.com/marcconrad/comparativeintegratedsystems)           | Looked at the basic JavaScript examples to understand how to call the API and parse the JSON response |
| YesNo API (https://yesno.wtf/)                                                                        | Used to randomly decide whether the AI lies each round                                                |
| Express.js documentation (https://expressjs.com/)                                                     | Used to understand how to set up routes and middleware                                                |
| Mongoose documentation (https://mongoosejs.com/)                                                      | Schema definitions and querying                                                                       |
| MDN Web Docs - SpeechSynthesis API (https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) | Used to implement the robot voice feature with window.speechSynthesis                                 |
| MDN Web Docs - Fetch API (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)                 | Used for all fetch() calls to both external APIs and my own backend                                   |
| bcrypt npm package (https://www.npmjs.com/package/bcrypt)                                             | Password hashing for registration and comparison on login                                             |
| jsonwebtoken npm package (https://www.npmjs.com/package/jsonwebtoken)                                 | JWT signing and verification for virtual identity                                                     |
| Google Fonts - Orbitron and Rajdhani                                                                  | UI fonts for the game aesthetic                                                                       |
| Font Awesome 6.4.0                                                                                    | All the icons used across the UI                                                                      |

---

<div align="center">

**Developed by Simthass Mohammed (2540927)**

_CIS045-3 Distributed Service Architectures | University of Bedfordshire_

Made with 💻 and ☕

</div>
