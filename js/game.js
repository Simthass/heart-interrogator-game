let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval;

// API Data States
let actualTrueAnswer = 0;
let aiClaimedAnswer = 0;
let isAiLying = false;
let gameIsActive = false;

// DOM Elements
const timerText = document.getElementById("timerText");
const scoreValue = document.getElementById("scoreValue");
const streakValue = document.getElementById("streakValue");
const livesDisplay = document.getElementById("livesDisplay");
const currentRoundDisplay = document.getElementById("currentRound");

const suspectAnswerDisplay = document.getElementById("suspectAnswer");
const confValue = document.getElementById("confValue");
const confFill = document.getElementById("confFill");

const apiImage = document.getElementById("apiImage");
const loadingState = document.getElementById("loadingState");
const feedbackText = document.getElementById("feedbackText");

const manualInput = document.getElementById("manualInput");
const verifyBox = document.getElementById("verifyBox");

// --- INITIALIZATION ---
window.onload = () => {
  console.log("Game started! Initializing Interrogation Protocol...");
  updateHUD();
  fetchNewCase(); // Start the first round
};

// --- API FETCHING (INTEROPERABILITY) ---

// Async function to get data from multiple APIs
async function fetchNewCase() {
  gameIsActive = false; // block inputs
  clearInterval(timerInterval); // stop timer

  // Reset UI for loading
  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  manualInput.value = "";
  feedbackText.innerText = "Connecting to remote servers...";
  feedbackText.style.color = "var(--cream)";

  try {
    console.log("Fetching from Heart API...");
    // 1. Fetch the actual puzzle (API provided in assignment brief)
    const heartRes = await fetch(
      "https://marcconrad.com/uob/heart/api.php?out=json",
    );
    const heartData = await heartRes.json();

    console.log("Fetching from YesNo API to determine lie status...");
    // 2. Fetch from a second API to decide if the AI will lie to the player!
    const yesNoRes = await fetch("https://yesno.wtf/api");
    const yesNoData = await yesNoRes.json();

    // Store the true answer
    actualTrueAnswer = heartData.solution;

    // Determine lie logic based on the second API
    if (yesNoData.answer === "yes") {
      isAiLying = false;
      aiClaimedAnswer = actualTrueAnswer; // AI tells the truth
      console.log("AI is telling the TRUTH this round.");
    } else {
      isAiLying = true;
      // create a fake answer by adding or subtracting 1 or 2
      let offset = Math.floor(Math.random() * 2) + 1;
      // 50% chance to add or subtract
      if (Math.random() > 0.5) {
        aiClaimedAnswer = actualTrueAnswer + offset;
      } else {
        aiClaimedAnswer = actualTrueAnswer - offset;
      }
      console.log(
        `AI is LYING. Real: ${actualTrueAnswer}, Fake: ${aiClaimedAnswer}`,
      );
    }

    // Update Image UI
    apiImage.src = heartData.question;
    apiImage.style.display = "block";
    loadingState.style.display = "none";

    // Update AI Suspect UI
    suspectAnswerDisplay.innerText = aiClaimedAnswer;

    // Randomize confidence meter just for visual effect
    let randomConf = Math.floor(Math.random() * 40) + 60; // 60% to 100%
    confValue.innerText = randomConf + "%";
    confFill.style.width = randomConf + "%";

    feedbackText.innerText = "Interrogation active. Make your choice.";

    // 3. SOUND EFFECTS API: Use Web Speech API to make the robot talk
    speakText(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

    gameIsActive = true;
    startTimer();
  } catch (error) {
    console.error("API Fetch Failed! Servers might be down.", error);
    feedbackText.innerText = "ERROR: Connection to distributed service failed.";
    feedbackText.style.color = "#ff3366";
  }
}

// Web Speech API wrapper
function speakText(text) {
  // check if browser supports it
  if ("speechSynthesis" in window) {
    let msg = new SpeechSynthesisUtterance(text);
    msg.pitch = 0.5; // lower pitch for robot voice
    msg.rate = 1.1; // slightly faster
    window.speechSynthesis.speak(msg);
  } else {
    console.log("Speech API not supported in this browser.");
  }
}

// --- EVENT DRIVEN LOGIC (TIMER) ---
function startTimer() {
  timeRemaining = 10;
  timerText.innerText = timeRemaining;

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    // Turn timer red when time is low
    if (timeRemaining <= 3) {
      document.getElementById("timerCircle").style.borderColor = "#ff3366";
      timerText.style.color = "#ff3366";
    } else {
      document.getElementById("timerCircle").style.borderColor = "var(--coral)";
      timerText.style.color = "var(--coral)";
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      handleTimeOut();
    }
  }, 1000);
}

function handleTimeOut() {
  if (!gameIsActive) return;
  gameIsActive = false;

  console.log("Time ran out!");
  speakText("You are too slow, Detective.");
  feedbackText.innerText = "TIME OUT! You lost a life.";
  feedbackText.style.color = "#ff3366";

  loseLife();
}

// --- PLAYER ACTIONS ---

// Triggered when TRUST button is clicked
function trustSuspect() {
  if (!gameIsActive) return; // prevent spam clicking
  gameIsActive = false;
  clearInterval(timerInterval);

  console.log("Player clicked TRUST.");

  if (isAiLying === false) {
    // Player trusted the truth -> WIN
    score += 20;
    streak++;
    feedbackText.innerText = "CORRECT! The AI told the truth. +20 Pts";
    feedbackText.style.color = "var(--teal-light)";
    speakText("Thank you for trusting me.");
    updateHUD();
    setTimeout(nextRound, 2000); // wait 2 seconds then next round
  } else {
    // Player trusted a lie -> LOSE
    feedbackText.innerText = `FOOL! The AI lied. The real answer was ${actualTrueAnswer}.`;
    feedbackText.style.color = "#ff3366";
    speakText("Ha ha. I deceived you.");
    loseLife();
  }
}

// Toggles the input box for manual verification
function showVerifyInput() {
  if (!gameIsActive) return;

  if (verifyBox.style.display === "none") {
    verifyBox.style.display = "flex";
    manualInput.focus();
  } else {
    verifyBox.style.display = "none";
  }
}

// Triggered when GO button is clicked
function submitVerification() {
  if (!gameIsActive) return;

  let playerAnswer = parseInt(manualInput.value);

  if (isNaN(playerAnswer)) {
    alert("Please enter a valid number!");
    return;
  }

  gameIsActive = false;
  clearInterval(timerInterval);
  verifyBox.style.display = "none";

  console.log(
    `Player guessed: ${playerAnswer}. Real answer: ${actualTrueAnswer}`,
  );

  if (playerAnswer === actualTrueAnswer) {
    // Player verified correctly
    score += 10; // less points because it's safer than trusting
    streak++;
    feedbackText.innerText = "VERIFIED! Your calculation was correct. +10 Pts";
    feedbackText.style.color = "var(--teal-light)";

    if (isAiLying) {
      speakText("Error. You caught my deception.");
    } else {
      speakText("I told you I was right.");
    }

    updateHUD();
    setTimeout(nextRound, 2000);
  } else {
    // Player did the math wrong
    feedbackText.innerText = `WRONG MATH! The true answer was ${actualTrueAnswer}.`;
    feedbackText.style.color = "#ff3366";
    speakText("Your human brain is inferior.");
    loseLife();
  }
}

// --- GAME STATE MANAGEMENT ---

function loseLife() {
  lives--;
  streak = 0; // reset streak
  updateHUD();

  if (lives <= 0) {
    setTimeout(gameOver, 1500);
  } else {
    setTimeout(nextRound, 2500);
  }
}

function nextRound() {
  currentRound++;
  if (currentRound > 10) {
    // For now, if they beat 10 rounds, they win
    alert(`YOU WIN! Final Score: ${score}`);
    window.location.href = "stats.html"; // redirect to stats page
  } else {
    updateHUD();
    fetchNewCase();
  }
}

function updateHUD() {
  scoreValue.innerText = score;
  streakValue.innerText = streak;
  currentRoundDisplay.innerText = currentRound;
  livesDisplay.innerText = lives;
}

function gameOver() {
  alert(`GAME OVER! You have been terminated.\nFinal Score: ${score}`);
  // In the future, this is where we will POST the score to a database using Virtual Identity
  window.location.href = "dashboard.html";
}
