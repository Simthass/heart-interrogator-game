// game.js
// Main game logic (UI only for now)
// Student: Simthass MYM (2540927)

// game state variables
let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval;

// when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("Game page loaded");

  // initialize game
  initGame();

  // start timer
  startTimer();
});

// initialize game function
function initGame() {
  console.log("Initializing game...");

  // set initial values
  updateRoundDisplay();
  updateLivesDisplay();
  updateScoreDisplay();

  // TODO: fetch puzzle from API later
  // for now just show placeholder
}

// update round display
function updateRoundDisplay() {
  document.getElementById("currentRound").textContent = currentRound;
}

// update lives display
function updateLivesDisplay() {
  const livesDisplay = document.getElementById("livesDisplay");
  let heartsHTML = "";

  // add hearts based on lives remaining
  for (let i = 0; i < 3; i++) {
    if (i < lives) {
      heartsHTML += "❤️ ";
    } else {
      heartsHTML += "🖤 ";
    }
  }

  livesDisplay.innerHTML = heartsHTML;
}

// update score display
function updateScoreDisplay() {
  document.getElementById("scoreValue").textContent = score;
  document.getElementById("streakValue").textContent = streak;
}

// timer function
function startTimer() {
  timeRemaining = 10;

  // clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // start countdown
  timerInterval = setInterval(function () {
    timeRemaining--;

    // update timer display
    document.getElementById("timerText").textContent =
      "Time Remaining: " + timeRemaining + "s";

    // update timer bar
    const percentage = (timeRemaining / 10) * 100;
    document.getElementById("timerFill").style.width = percentage + "%";

    // check if time ran out
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

// handle when timer runs out
function handleTimeout() {
  console.log("Time ran out!");
  alert("Time's up! Lost one life.");

  lives--;
  updateLivesDisplay();

  // check game over
  if (lives <= 0) {
    gameOver();
  } else {
    nextRound();
  }
}

// trust suspect button clicked
function trustSuspect() {
  console.log("User chose to TRUST suspect");

  // stop timer
  clearInterval(timerInterval);

  // for now just show message
  // will add actual logic later with API
  alert("You trusted the suspect! Moving to next question...");

  // update score (dummy logic for now)
  score += 20;
  streak++;

  updateScoreDisplay();
  nextRound();
}

// show verify input when verify button clicked
function showVerifyInput() {
  console.log("User chose to VERIFY");

  const verifyInput = document.getElementById("verifyInput");
  verifyInput.style.display = "flex";

  // focus on input
  document.getElementById("manualCount").focus();
}

// submit verification
function submitVerification() {
  const manualCount = document.getElementById("manualCount").value;

  if (!manualCount || manualCount === "") {
    alert("Please enter a number");
    return;
  }

  console.log("User verified with count:", manualCount);

  // stop timer
  clearInterval(timerInterval);

  // dummy logic
  alert("Verification submitted! Moving to next question...");

  score += 10;
  streak++;

  updateScoreDisplay();
  nextRound();
}

// move to next round
function nextRound() {
  currentRound++;

  // check if round limit reached
  if (currentRound > 10) {
    // go to results
    window.location.href = "results.html";
    return;
  }

  // update display
  updateRoundDisplay();

  // hide verify input if shown
  document.getElementById("verifyInput").style.display = "none";
  document.getElementById("manualCount").value = "";

  // TODO: load new puzzle from API

  // restart timer
  startTimer();
}

// game over function
function gameOver() {
  console.log("Game over! No lives remaining");

  // stop timer
  clearInterval(timerInterval);

  alert("Game Over! Returning to dashboard...");

  // could save score here
  // then redirect
  window.location.href = "dashboard.html";
}

// show tutorial
function showTutorial() {
  alert(
    "Tutorial:\n\n" +
      "1. Look at the heart puzzle image\n" +
      "2. The AI suspect will claim a number\n" +
      "3. You can TRUST the suspect (risky, +20 points)\n" +
      "4. Or VERIFY by counting yourself (safe, +10 points)\n" +
      "5. Wrong answers lose a life!\n" +
      "6. Survive as long as possible!",
  );
}

// some helper functions i might need

// generate random number (for testing)
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// format time (might use later)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ":" + (secs < 10 ? "0" : "") + secs;
}
