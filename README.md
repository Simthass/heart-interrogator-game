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

| Feature | Description |
|---|---|
| 🤖 AI Suspect | Robot that lies randomly with a fake confidence meter |
| ⏱️ Timer | Countdown timer that gets harder based on your rank |
| 🏆 Ranking System | 10 ranks from Rookie Cadet to Director, unlocked by wins |
| 🧠 Robot Memory | The AI remembers which numbers you got wrong before and uses them against you |
| 🔊 AI Voice | Text-to-speech for the robot (using Web Speech API) |
| 📊 Stats Page | Your total score, accuracy, wins, recent games |
| 🥇 Leaderboard | Global rankings sorted by total score |
| 🏅 Achievements | 20 unlockable badges based on gameplay milestones |
| ⚙️ Settings | Toggle sounds, change password, choose difficulty |
| 🔐 Auth System | Register/login with JWT tokens stored in cookies |

---

## 📁 Project Structure

```
heart-interrogator/
│
├── public/
│   └── Logo.png                  ← game logo
│
├── css/
│   ├── style.css                 ← global styles, header, footer, modals
│   ├── game.css                  ← all the game page styles
│   └── pages.css                 ← stats, settings page styles
│
├── js/
│   ├── home.js                   ← header auth logic, login/register modal
│   ├── game.js                   ← main game logic (Heart API, timer, decisions)
│   ├── results.js                ← results page, robot memory summary
│   ├── register.js               ← register form logic
│   └── pages.js                  ← stats page, achievement loader
│
├── index.html                    ← home/landing page
├── game.html                     ← main game page (interrogation room)
├── results.html                  ← results screen after game ends
├── stats.html                    ← my stats and achievements
├── settings.html                 ← account + game settings
├── header.html                   ← shared header component (loaded via fetch)
│
├── server.js                     ← Node/Express backend server
├── .env                          ← environment variables (not committed!)
├── package.json
└── README.md
```

---

## 🎓 The Four Assignment Themes

This section explains how each of the four themes from the assignment is implemented in my code. This is important for understanding the video submission.

---

### 1. 🧩 Software Design Principles - Low Coupling & High Cohesion

I tried to separate my code into different files so each file has one clear job:

- `game.js` - only handles game logic (timer, scoring, round management, API calls)
- `home.js` - only handles authentication stuff (login modal, cookies, header updates)
- `results.js` - only reads from localStorage and builds the results table
- `register.js` - only handles the register form validation and API call
- `pages.js` - only for stats page (fetching stats, building achievements and roles grid)

The server side is also separated properly:
- Each API route in `server.js` does one specific thing (login, register, save game, get stats, leaderboard etc.)
- The `checkTokenMiddleware` function is a reusable piece - it runs before protected routes so I dont need to copy the token checking code everywhere

The frontend and backend dont share any code or variables - they only talk through the REST API using JSON. This means if I change how the server stores data, the frontend doesnt break.

> Low coupling example: The game.js file doesnt care how the server works. It just calls `fetch("http://localhost:3000/api/save-game", ...)` and sends JSON. The server handles all the database stuff internally.

> High cohesion example: The `fetchNewCase()` function in game.js handles everything for one round - calling the Heart API, updating the image, updating AI claim, setting timer. All related things are grouped together.

---

### 2. ⚡ Event-Driven Programming

The whole game is built around events. Nothing happens unless something triggers it:

**DOM Events (user interaction):**
- Clicking **TRUST** button → fires `trustSuspect(event)` 
- Clicking **VERIFY** button → fires `showVerifyInput(event)` which shows the number input box
- Clicking **GO** (submit verify) → fires `submitVerification(event)` which checks if answer is correct
- Clicking **ABORT** button → immediately redirects to results page
- `input` event on number box → the input field reacts when user types

**Timer Events:**
- `setInterval()` is used in `startRoundTimer()` to countdown the seconds. When timer hits 0, it fires `handleTimeout()` which removes a life and goes to next round
- Timer warning animation triggers at 3 seconds via an `if` check inside the interval

**Window/Page Events:**
- `window.onload` - initializes all the game variables when the game page loads
- `DOMContentLoaded` - used in results.js and register.js to start their setup code after HTML is ready

**Custom/Programmatic Events:**
- When game ends, `game.js` calls `saveGameToServer()` which uses the Fetch API (async event) to POST game data to the server
- After saving, it fires `window.location.href = "results.html"` which triggers the page to change

**Cross-Page Events (via localStorage):**
- Game page writes results to localStorage when game ends
- Results page reads from localStorage when it loads - this is a form of event-driven data passing between pages

---

### 3. 🌐 Interoperability

The game communicates with two external systems:

**Heart Game API (External Web Service):**
```
https://marcconrad.com/uob/heart/api.php?out=json
```
This is the main interoperability part. My JavaScript code (`game.js`) sends a GET request to this external API using `fetch()`. The API runs on a completely different server and is written differently from my code, but they can communicate because both use standard HTTP and JSON format.

The response looks like:
```json
{
  "question": "https://marcconrad.com/uob/heart/q/...",
  "solution": 4
}
```

My code takes the `question` (image URL) and `solution` (correct answer) from the response and uses them in the game.

**YesNo API (External Randomness Service):**
```
https://yesno.wtf/api
```
This is the second external API I integrated. Every round, after fetching the Heart puzzle, the game also calls the YesNo API to randomly decide whether the AI robot should lie or tell the truth that round:

```javascript
let yesnoResponse = await fetch("https://yesno.wtf/api");
let yesnoData = await yesnoResponse.json();

if (yesnoData.answer === "yes") {
  isAiLying = false;
  aiClaimedAnswer = actualTrueAnswer; // robot tells truth
} else {
  isAiLying = true;
  // robot gives a wrong number close to real answer
  let offset = Math.floor(Math.random() * 2) + 1;
  if (Math.random() > 0.5) aiClaimedAnswer = actualTrueAnswer + offset;
  else aiClaimedAnswer = actualTrueAnswer - offset;
}
```

I used this instead of just doing `Math.random()` on my own because I wanted the lying mechanic to come from an external source - it makes the game feel more unpredictable and also demonstrates that my code can communicate with multiple different APIs at the same time in a single function call. The YesNo API returns JSON with an `answer` field of `"yes"` or `"no"`, and my code reads that to control the core game logic.

So in every single round, my `fetchNewCase()` function is simultaneously talking to **two different external servers** (Heart API and YesNo API) and combining both responses to build the game state. This is a clear real-world example of interoperability - different systems on different servers, different purposes, all working together through standard HTTP + JSON.

**My Own Backend API (Node.js + Express):**
The frontend HTML/JS pages communicate with my own Node server running at `http://localhost:3000`. The frontend sends POST requests with JSON body, the server processes them and responds with JSON. This is also interoperability - the frontend and backend are separate systems (they could be on different computers) talking through HTTP.

Routes used in the project:
- `POST /api/reg` - register new user
- `POST /api/log` - login user
- `POST /api/save-game` - save game result (protected by JWT)
- `POST /api/my-stats` - get user's personal stats (protected)
- `POST /api/recent-games` - get last 10 games (protected)
- `POST /api/user-info` - get user profile info (protected)
- `POST /api/update-pass` - change password (protected)
- `POST /api/delete-account` - delete account (protected)
- `GET /api/global-data` - public global stats
- `GET /api/leaderboard` - public leaderboard

**Text-to-Speech (Web Speech API):**
The `robotSpeak()` function in game.js uses the browser's built-in `SpeechSynthesis` API. This is another form of interoperability - my code calls a browser-provided interface to access the device's text-to-speech engine.

---

### 4. 🔐 Virtual Identity / Authentication

User identity in this game works through a proper authentication flow:

**Registration:**
1. User fills in the register form on index.html
2. Frontend sends the data to `POST /api/reg`
3. Server validates input (checks if username/email already exists, checks password length, checks passwords match)
4. Password is hashed using **bcrypt** with salt rounds of 10 before storing in MongoDB - the raw password is never saved anywhere
5. Server creates a **JWT token** using `jwt.sign()` with the user's ID and username inside it, expires in 15 days
6. Token is sent back to frontend and stored in a **browser cookie** (`authToken`)

**Login:**
1. User submits username and password
2. Server finds user by username or email
3. Compares entered password against the stored bcrypt hash using `bcrypt.compare()`
4. If valid → creates a new JWT token and sends back
5. Token stored in cookie, username stored in another cookie (`loggedUser`)

**Protected Routes (JWT Middleware):**
All the important game routes use the `checkTokenMiddleware` function:
```javascript
// this middleware runs before any protected route
function checkTokenMiddleware(req, res, next) {
  let authHead = req.headers.authorization;
  if (!authHead) {
    return res.status(401).json({ msg: "no token found bro access denied" });
  }
  let tokenOnly = authHead.split(" ")[1]; // get just the token part after "Bearer "
  jwt.verify(tokenOnly, mySecretKey, (err, decodedData) => {
    if (err) {
      return res.status(401).json({ msg: "token fake or expired" });
    }
    req.userData = decodedData; // attach user info to request
    next(); // move on to actual route handler
  });
}
```

The frontend sends the token with every protected request:
```javascript
headers: {
  "Content-Type": "application/json",
  Authorization: "Bearer " + myToken
}
```

This way game scores are always tied to the correct player identity. Guest users can still play but scores are not saved because there is no auth token.

**Cookie Usage:**
- `authToken` cookie stores the JWT for session persistence
- `loggedUser` cookie stores the username for display purposes
- Both cookies are read using a simple `getCookie()` helper function used across multiple files

---

## 🚀 How To Setup & Run

### What You Need First

- Node.js (I used v18)
- MongoDB (local or MongoDB Atlas free tier)
- A modern browser

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

Make a new file called `.env` in the root folder and add:

```
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=any_random_secret_string_you_choose
PORT=3000
```

> Note: never commit the .env file to github! its in .gitignore

### Step 4 - Start the backend server

```bash
node server.js
```

You should see:
```
db connected successfully...
server running on http://localhost:3000
```

### Step 5 - Open the frontend

Just open `index.html` in your browser (or use a live server extension in VS Code). The game will connect to the local server automatically.

> If using VS Code, right click `index.html` → Open with Live Server

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

My code calls this in `fetchNewCase()` inside `game.js`. The actual `solution` value (the real answer) is compared against whatever the player decides - either trusting the AI's claimed number or the player's manually entered number.

---

## 📄 Pages Overview

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Landing page, login/register modals, leaderboard, how to play |
| Game | `game.html` | The actual interrogation game screen |
| Results | `results.html` | Shows performance summary after each game |
| Stats | `stats.html` | Personal stats, rank progression, all achievements |
| Settings | `settings.html` | Account info, change password, game settings, delete account |

---

## 🎯 Dynamic Difficulty System

The game automatically gets harder based on how many cases you have solved (wins). I made 10 rank levels and the timer shrinks as your rank goes up:

| Wins Needed | Rank | Timer |
|---|---|---|
| 0 | Rookie Cadet | 12 sec |
| 2+ | Patrol Officer | 11 sec |
| 5+ | Junior Agent | 10 sec |
| 10+ | Senior Agent | 9 sec |
| 15+ | Lead Investigator | 8 sec |
| 20+ | Inspector | 7 sec |
| 30+ | Chief Inspector | 6 sec |
| 40+ | Deputy Director | 5 sec |
| 50+ | Master Detective | 4 sec |
| 75+ | Director | 3 sec |

At rank 5 (Inspector) and above, the robot's voice also changes - it slows down and pitch drops to sound more sinister. Also at rank 3+, the "Switcheroo" mechanic randomly swaps the TRUST and VERIFY button positions to confuse you.

---

## 🐛 Known Issues

- The game requires `http://localhost:3000` to be running. If server is off, scores wont save (guest mode still works for playing)
- On mobile screens the 3 column game layout collapses to single column - it works but doesnt look as good
- The robot memory feature uses localStorage so it resets if you clear browser data
- Speech synthesis sounds a bit different depending on what browser/OS you use - Chrome sounds the best

---

## 📚 References & Credits

| Resource | How I used it |
|---|---|
| Heart Game API by Marc Conrad (https://marcconrad.com/uob/heart/doc.php) | Main game puzzle API - the entire game concept is built around this |
| GitHub examples by Marc Conrad (https://github.com/marcconrad/comparativeintegratedsystems) | Looked at the basic JavaScript examples to understand how to call the API and parse the JSON response |
| Express.js documentation (https://expressjs.com/) | Used to understand how to set up routes and middleware |
| MDN Web Docs - SpeechSynthesis API (https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) | Used to implement the robot voice feature with `window.speechSynthesis` |
| MDN Web Docs - Fetch API (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) | Used for all the `fetch()` calls to both the Heart API and my own backend |
| Google Fonts - Orbitron & Rajdhani | UI fonts for the game aesthetic |
| Font Awesome 6.4.0 | All the icons used across the UI |

---

<div align="center">

  **Developed by Simthass Mohammed (2540927)**

  *CIS045-3 Distributed Service Architectures | University of Bedfordshire*

  Made with 💻 and ☕

</div>
