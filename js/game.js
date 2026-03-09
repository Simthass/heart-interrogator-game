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

// this array save all rounds to show in result page later
let gameHistoryArray = [];

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
  console.log("Game start now...");
  updateHUD();
  fetchNewCase(); // Start first round
};

// --- API FETCHING ---
async function fetchNewCase() {
  gameIsActive = false; // block user click when loading
  clearInterval(timerInterval);

  // loading ui reset
  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  manualInput.value = "";
  feedbackText.innerText = "Connecting to remote servers...";
  feedbackText.style.color = "var(--cream)";

  try {
    console.log("Get image from Heart API...");
    const heartRes = await fetch(
      "https://marcconrad.com/uob/heart/api.php?out=json",
    );
    const heartData = await heartRes.json();

    console.log("Get from YesNo API to make lie logic...");
    const yesNoRes = await fetch("https://yesno.wtf/api");
    const yesNoData = await yesNoRes.json();

    actualTrueAnswer = heartData.solution;

    // check if AI will lie based on yesno api
    if (yesNoData.answer === "yes") {
      isAiLying = false;
      aiClaimedAnswer = actualTrueAnswer; // true
      console.log("AI tell TRUTH this round.");
    } else {
      isAiLying = true;
      // make fake answer
      let offset = Math.floor(Math.random() * 2) + 1;
      if (Math.random() > 0.5) {
        aiClaimedAnswer = actualTrueAnswer + offset;
      } else {
        aiClaimedAnswer = actualTrueAnswer - offset;
      }
      console.log(
        `AI LYING. Real is ${actualTrueAnswer}, Fake is ${aiClaimedAnswer}`,
      );
    }

    // show image
    apiImage.src = heartData.question;
    apiImage.style.display = "block";
    loadingState.style.display = "none";

    // update UI
    suspectAnswerDisplay.innerText = aiClaimedAnswer;
    let randomConf = Math.floor(Math.random() * 40) + 60;
    confValue.innerText = randomConf + "%";
    confFill.style.width = randomConf + "%";

    feedbackText.innerText = "Interrogation active. Make your choice.";
    speakText(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

    gameIsActive = true;
    startTimer();
  } catch (error) {
    console.error("API error", error);
    feedbackText.innerText = "ERROR: Cannot connect to server.";
    feedbackText.style.color = "#ff3366";
  }
}

// robot voice function
function speakText(text) {
  if ("speechSynthesis" in window) {
    let msg = new SpeechSynthesisUtterance(text);
    msg.pitch = 0.5;
    msg.rate = 1.1;
    window.speechSynthesis.speak(msg);
  }
}

// --- TIMER LOGIC ---
function startTimer() {
  timeRemaining = 10;
  timerText.innerText = timeRemaining;

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    // make red when time almost finish
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

  speakText("You are too slow.");
  feedbackText.innerText = "TIME OUT! You lost a life.";
  feedbackText.style.color = "#ff3366";

  // push fail data to history array
  gameHistoryArray.push({
    round: currentRound,
    decision: "TIMEOUT",
    aiSaid: aiClaimedAnswer,
    realAnswer: actualTrueAnswer,
    aiLied: isAiLying,
    isWin: false,
    points: "-Life",
  });

  loseLife();
}

// --- PLAYER CLICK ACTIONS ---

function trustSuspect() {
  if (!gameIsActive) return;
  gameIsActive = false;
  clearInterval(timerInterval);

  let roundWin = false;
  let pointText = "";

  if (isAiLying === false) {
    // player win
    score += 20;
    streak++;
    feedbackText.innerText = "CORRECT! The AI told the truth. +20 Pts";
    feedbackText.style.color = "var(--teal-light)";
    speakText("Thank you for trusting me.");
    roundWin = true;
    pointText = "+20";
  } else {
    // player lose
    feedbackText.innerText = `FOOL! The AI lied. Real answer was ${actualTrueAnswer}.`;
    feedbackText.style.color = "#ff3366";
    speakText("Ha ha. I deceived you.");
    roundWin = false;
    pointText = "-Life";
  }

  // save round data for result page table
  gameHistoryArray.push({
    round: currentRound,
    decision: "TRUST",
    aiSaid: aiClaimedAnswer,
    realAnswer: actualTrueAnswer,
    aiLied: isAiLying,
    isWin: roundWin,
    points: pointText,
  });

  if (roundWin) {
    updateHUD();
    setTimeout(nextRound, 2000);
  } else {
    loseLife();
  }
}

function showVerifyInput() {
  if (!gameIsActive) return;

  if (verifyBox.style.display === "none") {
    verifyBox.style.display = "flex";
    manualInput.focus();
  } else {
    verifyBox.style.display = "none";
  }
}

function submitVerification() {
  if (!gameIsActive) return;

  let playerAnswer = parseInt(manualInput.value);

  // check if empty
  if (isNaN(playerAnswer)) {
    alert("Please type number!");
    return;
  }

  gameIsActive = false;
  clearInterval(timerInterval);
  verifyBox.style.display = "none";

  let roundWin = false;
  let pointText = "";

  if (playerAnswer === actualTrueAnswer) {
    // player calculate correct
    score += 10;
    streak++;
    feedbackText.innerText = "VERIFIED! Your calculation correct. +10 Pts";
    feedbackText.style.color = "var(--teal-light)";

    if (isAiLying) {
      speakText("Error. You caught my deception.");
    } else {
      speakText("I told you I was right.");
    }
    roundWin = true;
    pointText = "+10";
  } else {
    // player do math wrong
    feedbackText.innerText = `WRONG MATH! True answer was ${actualTrueAnswer}.`;
    feedbackText.style.color = "#ff3366";
    speakText("Your human brain is inferior.");
    roundWin = false;
    pointText = "-Life";
  }

  // push data to array
  gameHistoryArray.push({
    round: currentRound,
    decision: "VERIFY (" + playerAnswer + ")",
    aiSaid: aiClaimedAnswer,
    realAnswer: actualTrueAnswer,
    aiLied: isAiLying,
    isWin: roundWin,
    points: pointText,
  });

  if (roundWin) {
    updateHUD();
    setTimeout(nextRound, 2000);
  } else {
    loseLife();
  }
}

// --- STATE MANAGEMENT ---

function loseLife() {
  lives--;
  streak = 0;
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
    // player finish all 10 rounds
    alert(`YOU SURVIVED! Final Score: ${score}`);
    saveToStorageAndRedirect();
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
  alert(`GAME OVER! You lost all lives.\nFinal Score: ${score}`);
  saveToStorageAndRedirect();
}

// function to save all data before go to result page
function saveToStorageAndRedirect() {
  localStorage.setItem(
    "interrogationHistory",
    JSON.stringify(gameHistoryArray),
  );
  localStorage.setItem("finalGameScore", score);
  localStorage.setItem("finalLives", lives);
  window.location.href = "results.html";
}
