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
}

// update all displays
function updateDisplay() {
  document.getElementById("currentRound").textContent = currentRound;
  document.getElementById("scoreValue").textContent = score;
  document.getElementById("streakValue").textContent = streak;

  // update lives
  let heartsHTML = "";
  for (let i = 0; i < 3; i++) {
    if (i < lives) {
      heartsHTML += "❤️ ";
    } else {
      heartsHTML += "🖤 ";
    }
  }
  document.getElementById("livesDisplay").innerHTML = heartsHTML;
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
    document.getElementById("timerText").textContent =
      "Time: " + timeLeft + "s";

    // update timer bar
    let percentage = (timeLeft / 10) * 100;
    document.getElementById("timerBar").style.width = percentage + "%";

    // check if time's up
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

// handle timeout
function handleTimeout() {
  console.log("Time ran out!");
  alert("Time's up! Lost a life.");

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
  alert("You trusted the suspect! Moving to next question...");

  // for demo, assume correct
  score += 20;
  streak++;

  updateDisplay();
  nextRound();
}

// show verify input
function showVerifyInput() {
  document.getElementById("verifyControls").style.display = "flex";
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
  document.getElementById("verifyControls").style.display = "none";
  document.getElementById("manualInput").value = "";

  updateDisplay();

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

// random number generator
function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
