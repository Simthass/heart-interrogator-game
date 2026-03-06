// game variables
let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeLeft = 10;
let timerInterval;

// when page loads
window.addEventListener("load", function () {
  console.log("Game page loaded");
  initGame();
  startTimer();
});

// initialize game
function initGame() {
  updateDisplay();
  // TODO: fetch puzzle from API later
}

// update all displays
function updateDisplay() {
  document.getElementById("currentRound").textContent = currentRound;
  document.getElementById("scoreValue").textContent = score;
  document.getElementById("streakValue").textContent = streak;

  // update lives display (just show number)
  document.getElementById("livesDisplay").textContent = lives;
}

// start timer
function startTimer() {
  timeLeft = 10;

  // clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(function () {
    timeLeft--;

    // update timer display
    document.getElementById("timerText").textContent = timeLeft;

    // change color when time is low
    let timerCircle = document.getElementById("timerCircle");
    if (timeLeft <= 3) {
      timerCircle.style.borderColor = "#ff1744";
      timerCircle.style.background = "rgba(255, 23, 68, 0.2)";
    }

    // check if time's up
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

// handle timeout
function handleTimeout() {
  lives--;
  updateDisplay();

  if (lives <= 0) {
    gameOver();
  } else {
    nextRound();
  }
}

// trust suspect button
function trustSuspect() {
  console.log("Player trusts suspect");

  clearInterval(timerInterval);

  // dummy logic for now
  // will add real verification with API later
  alert("You trusted the suspect! Moving to next question...");

  // for demo, assume correct
  score += 20;
  streak++;

  updateDisplay();
  nextRound();
}

// show verify input
function showVerifyInput() {
  let verifyBox = document.getElementById("verifyBox");
  verifyBox.style.display = "flex";
  document.getElementById("manualInput").focus();
}

// submit verification
function submitVerification() {
  let manualCount = document.getElementById("manualInput").value;

  if (!manualCount || manualCount === "") {
    alert("Please enter your count");
    return;
  }

  console.log("Player verified with:", manualCount);

  clearInterval(timerInterval);

  alert("Verification submitted! Moving to next question...");

  // dummy logic
  score += 10;
  streak++;

  updateDisplay();
  nextRound();
}

// next round
function nextRound() {
  currentRound++;

  if (currentRound > 10) {
    // game complete
    alert("Round complete! Score: " + score);
    window.location.href = "index.html";
    return;
  }

  // hide verify input
  document.getElementById("verifyBox").style.display = "none";
  document.getElementById("manualInput").value = "";

  updateDisplay();

  // reset timer circle color
  let timerCircle = document.getElementById("timerCircle");
  timerCircle.style.borderColor = "var(--main-red)";
  timerCircle.style.background = "rgba(219, 11, 36, 0.1)";

  // TODO: load new puzzle from API

  // restart timer
  startTimer();
}

// game over
function gameOver() {
  console.log("Game over!");
  clearInterval(timerInterval);

  alert("Game Over! Final Score: " + score);
  window.location.href = "index.html";
}

// some helper functions i might need later

// random number generator
function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// format score with commas (might use later)
function formatScore(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
