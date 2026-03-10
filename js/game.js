// game logic - 2540927 - redesigned with better feedback
// sorry code is messy i just want it to work and look cool
// FIXED: buttons now work! i forgot to handle event properly

let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval;

// api stuff
let actualTrueAnswer = 0;
let aiClaimedAnswer = 0;
let isAiLying = false;
let gameIsActive = false;

// history for results page
let gameHistoryArray = [];

// dom elements
const timerText = document.getElementById("timerText");
const timerCircle = document.getElementById("timerCircle");
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
const robotIcon = document.querySelector(".robot-icon i");
const gameBody = document.querySelector(".game-body");

// get difficulty from storage
function getDifficultyTimer() {
  const diff = localStorage.getItem("gameDifficulty") || "easy";
  if (diff === "easy") return 10;
  if (diff === "hard") return 5;
  if (diff === "expert") return 2;
  return 10;
}

window.onload = () => {
  console.log("game starting... diff timer:", getDifficultyTimer());
  updateHUD();
  fetchNewCase();
};

// show floating notification
function showNotification(message, type = "success") {
  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.innerHTML = message;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 800);
}

// create particle effect
function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.innerHTML = "✨";
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.color = color;
    particle.style.animationDelay = Math.random() * 0.2 + "s";
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 1000);
  }
}

// flash screen
function flashScreen(type) {
  if (type === "correct") {
    gameBody.classList.add("flash-correct");
    setTimeout(() => gameBody.classList.remove("flash-correct"), 300);
  } else {
    gameBody.classList.add("flash-wrong");
    setTimeout(() => gameBody.classList.remove("flash-wrong"), 300);
  }
}

// animate number change
function animateValue(element) {
  element.classList.add("pulse-value");
  setTimeout(() => element.classList.remove("pulse-value"), 500);
}

// make robot speak
function robotSpeak(text) {
  if (robotIcon) {
    robotIcon.classList.add("speaking");
    setTimeout(() => robotIcon.classList.remove("speaking"), 500);
  }
  speakText(text);
}

async function fetchNewCase() {
  gameIsActive = false;
  clearInterval(timerInterval);

  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  manualInput.value = "";
  manualInput.classList.remove("error");
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-pulse"></i> Connecting to Heart API...';

  // make puzzle image loading
  document.querySelector(".puzzle-image").classList.add("loading");

  try {
    console.log("fetching heart api...");
    const heartRes = await fetch(
      "https://marcconrad.com/uob/heart/api.php?out=json",
    );
    const heartData = await heartRes.json();

    console.log("fetching yesno api...");
    const yesNoRes = await fetch("https://yesno.wtf/api");
    const yesNoData = await yesNoRes.json();

    actualTrueAnswer = heartData.solution;

    // ai decides to lie or not based on yesno
    if (yesNoData.answer === "yes") {
      isAiLying = false;
      aiClaimedAnswer = actualTrueAnswer;
      console.log("ai telling truth");
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
        `ai lying: real ${actualTrueAnswer}, fake ${aiClaimedAnswer}`,
      );
    }

    apiImage.src = heartData.question;
    apiImage.style.display = "block";
    loadingState.style.display = "none";
    document.querySelector(".puzzle-image").classList.remove("loading");

    // animate number change
    suspectAnswerDisplay.innerText = aiClaimedAnswer;
    animateValue(suspectAnswerDisplay);

    let randomConf = Math.floor(Math.random() * 40) + 60;
    confValue.innerText = randomConf + "%";
    confFill.style.width = randomConf + "%";

    feedbackText.innerHTML =
      '<i class="fas fa-microphone"></i> Interrogation active. Make your choice.';

    // robot speaks
    robotSpeak(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

    // create particles for new case
    const rect = document
      .querySelector(".suspect-section")
      ?.getBoundingClientRect();
    if (rect) {
      createParticles(rect.left + 100, rect.top + 100, "#fe9e84", 5);
    }

    gameIsActive = true;
    startTimer();
  } catch (error) {
    console.error("api error", error);
    feedbackText.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#ff4d4d;"></i> ERROR: Cannot connect to server';
    document.querySelector(".puzzle-image").classList.remove("loading");
  }
}

// robot voice
function speakText(text) {
  if ("speechSynthesis" in window) {
    let msg = new SpeechSynthesisUtterance(text);
    msg.pitch = 0.5;
    msg.rate = 1.1;
    window.speechSynthesis.speak(msg);
  }
}

function startTimer() {
  timeRemaining = getDifficultyTimer();
  timerText.innerText = timeRemaining;
  timerCircle.classList.remove("warning");

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    // make timer red when low
    if (timeRemaining <= 3) {
      timerCircle.classList.add("warning");
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

  robotSpeak("Time is up. Too slow.");
  feedbackText.innerHTML =
    '<i class="fas fa-hourglass-end"></i> TIME OUT! You lost a life.';
  feedbackText.style.color = "#ff4d4d";

  // flash screen red
  flashScreen("wrong");

  // show notification
  showNotification("TIME OUT!", "error");

  // create particles
  const rect = document.querySelector(".timer-circle")?.getBoundingClientRect();
  if (rect) {
    createParticles(rect.left, rect.top, "#ff4d4d", 8);
  }

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

// FIXED: now accepts event parameter properly
function trustSuspect(event) {
  if (!gameIsActive) return;
  gameIsActive = false;
  clearInterval(timerInterval);

  let roundWin = false;
  let pointText = "";

  // get button position for particles - fixed with null check
  let btnRect = null;
  if (event && event.target) {
    btnRect = event.target.getBoundingClientRect();
  }

  if (isAiLying === false) {
    score += 20;
    streak++;

    // animate score
    animateValue(scoreValue);
    animateValue(streakValue);

    feedbackText.innerHTML =
      '<i class="fas fa-check-circle" style="color:#39ff14;"></i> CORRECT! AI told truth. +20 POINTS';
    feedbackText.style.color = "#39ff14";
    robotSpeak("Thank you for trusting me.");

    // flash screen green
    flashScreen("correct");

    // show success notification
    showNotification("+20 POINTS!", "success");

    // create particles
    if (btnRect) {
      createParticles(btnRect.left, btnRect.top, "#39ff14", 15);
    }

    roundWin = true;
    pointText = "+20";
  } else {
    // ai lied
    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> FOOL! AI lied. Real answer was ${actualTrueAnswer}.`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Ha ha ha. I deceived you.");

    // flash screen red
    flashScreen("wrong");

    // show notification
    showNotification("AI LIED!", "error");

    // create particles
    if (btnRect) {
      createParticles(btnRect.left, btnRect.top, "#ff4d4d", 10);
    }

    roundWin = false;
    pointText = "-Life";
  }

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

// FIXED: now accepts event parameter properly
function showVerifyInput(event) {
  if (!gameIsActive) return;

  if (verifyBox.style.display === "none") {
    verifyBox.style.display = "flex";
    manualInput.focus();

    // animate - fixed with null check
    if (event && event.target) {
      const btn = event.target;
      btn.style.transform = "scale(0.95)";
      setTimeout(() => (btn.style.transform = ""), 200);
    }
  } else {
    verifyBox.style.display = "none";
  }
}

// FIXED: now accepts event parameter properly
function submitVerification(event) {
  if (!gameIsActive) return;

  let playerAnswer = parseInt(manualInput.value);

  if (isNaN(playerAnswer)) {
    manualInput.classList.add("error");
    setTimeout(() => manualInput.classList.remove("error"), 500);
    alert("Please type a number!");
    return;
  }

  gameIsActive = false;
  clearInterval(timerInterval);
  verifyBox.style.display = "none";

  // get button position for particles - fixed with null check
  let btnRect = null;
  if (event && event.target) {
    btnRect = event.target.getBoundingClientRect();
  }

  let roundWin = false;
  let pointText = "";

  if (playerAnswer === actualTrueAnswer) {
    score += 10;
    streak++;

    // animate values
    animateValue(scoreValue);
    animateValue(streakValue);

    feedbackText.innerHTML =
      '<i class="fas fa-check-circle" style="color:#39ff14;"></i> VERIFIED! Correct answer. +10 POINTS';
    feedbackText.style.color = "#39ff14";

    // flash screen green
    flashScreen("correct");

    if (isAiLying) {
      robotSpeak("You caught my deception. Well done.");
    } else {
      robotSpeak("I told you I was right.");
    }

    // show notification
    showNotification("+10 POINTS!", "success");

    // create particles
    if (btnRect) {
      createParticles(btnRect.left, btnRect.top, "#39ff14", 12);
    }

    roundWin = true;
    pointText = "+10";
  } else {
    // player wrong
    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> WRONG! Real answer was ${actualTrueAnswer}. You entered ${playerAnswer}.`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Your human brain is inferior.");

    // flash screen red
    flashScreen("wrong");

    // show notification
    showNotification("WRONG ANSWER!", "error");

    // create particles
    if (btnRect) {
      createParticles(btnRect.left, btnRect.top, "#ff4d4d", 10);
    }

    roundWin = false;
    pointText = "-Life";
  }

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

function loseLife() {
  lives--;
  streak = 0;

  // animate lives
  animateValue(livesDisplay);

  // shake lives icon
  const livesIcon = document.querySelector(".lives-count i");
  if (livesIcon) {
    livesIcon.style.animation = "shake 0.3s";
    setTimeout(() => (livesIcon.style.animation = ""), 300);
  }

  updateHUD();

  if (lives <= 0) {
    setTimeout(gameOver, 2000);
  } else {
    setTimeout(nextRound, 2500);
  }
}

function nextRound() {
  currentRound++;
  if (currentRound > 10) {
    // show final celebration
    showNotification("GAME COMPLETE!", "success");
    createParticles(window.innerWidth / 2, window.innerHeight / 2, "gold", 30);

    setTimeout(() => {
      saveToStorageAndRedirect();
    }, 1500);
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

  // animate round change
  animateValue(currentRoundDisplay);
}

function gameOver() {
  showNotification("GAME OVER", "error");
  createParticles(window.innerWidth / 2, window.innerHeight / 2, "#ff4d4d", 20);

  setTimeout(() => {
    saveToStorageAndRedirect();
  }, 1500);
}

function saveToStorageAndRedirect() {
  localStorage.setItem(
    "interrogationHistory",
    JSON.stringify(gameHistoryArray),
  );
  localStorage.setItem("finalGameScore", score);
  localStorage.setItem("finalLives", lives);
  window.location.href = "results.html";
}
