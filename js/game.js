let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval = null;
let actualTrueAnswer = 0;
let aiClaimedAnswer = 0;
let isAiLying = false;
let gameIsActive = false;
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

// cookie helper
function getCookie(name) {
  let match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// get difficulty from storage
function getDifficultyTimer() {
  let diff = localStorage.getItem("gameDifficulty") || "easy";
  if (diff === "easy") return 12;
  if (diff === "hard") return 7;
  if (diff === "expert") return 3;
  return 12;
}

window.onload = () => {
  console.log(
    "game started... difficulty:",
    localStorage.getItem("gameDifficulty") || "easy",
  );
  // reset game state
  currentRound = 1;
  lives = 3;
  score = 0;
  streak = 0;
  gameHistoryArray = [];
  updateHUD();
  fetchNewCase();
};

// show notification
function showNotification(message, type = "success") {
  let notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.innerHTML = message;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 1000);
}

// flash screen
function flashScreen(type) {
  if (type === "correct") {
    gameBody.classList.add("flash-correct");
    setTimeout(() => gameBody.classList.remove("flash-correct"), 400);
  } else {
    gameBody.classList.add("flash-wrong");
    setTimeout(() => gameBody.classList.remove("flash-wrong"), 400);
  }
}

// animate value
function animateValue(element) {
  element.classList.add("pulse-value");
  setTimeout(() => element.classList.remove("pulse-value"), 400);
}

// robot speak
function robotSpeak(text) {
  if (robotIcon) {
    robotIcon.style.transform = "scale(1.1)";
    setTimeout(() => (robotIcon.style.transform = ""), 300);
  }

  if ("speechSynthesis" in window) {
    let msg = new SpeechSynthesisUtterance(text);
    msg.pitch = 0.8;
    msg.rate = 1.0;
    window.speechSynthesis.cancel(); // stop any previous speech
    window.speechSynthesis.speak(msg);
  }
}

// fetch new case from apis
async function fetchNewCase() {
  // clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  gameIsActive = false;

  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  if (manualInput) manualInput.value = "";
  if (manualInput) manualInput.classList.remove("error");
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-pulse"></i> Connecting to Heart API...';

  document.querySelector(".puzzle-image").classList.add("loading");

  try {
    console.log("fetching heart api...");
    let heartRes = await fetch(
      "https://marcconrad.com/uob/heart/api.php?out=json",
    );
    let heartData = await heartRes.json();

    console.log("fetching yesno api...");
    let yesNoRes = await fetch("https://yesno.wtf/api");
    let yesNoData = await yesNoRes.json();

    actualTrueAnswer = heartData.solution;

    // ai decides to lie or not
    if (yesNoData.answer === "yes") {
      isAiLying = false;
      aiClaimedAnswer = actualTrueAnswer;
      console.log("ai telling truth");
    } else {
      isAiLying = true;
      // generate fake answer
      let offset = Math.floor(Math.random() * 2) + 1;
      if (Math.random() > 0.5) {
        aiClaimedAnswer = actualTrueAnswer + offset;
      } else {
        aiClaimedAnswer = actualTrueAnswer - offset;
      }
      // make sure its positive
      if (aiClaimedAnswer < 0) aiClaimedAnswer = actualTrueAnswer + 1;
      console.log(
        `ai lying: real ${actualTrueAnswer}, fake ${aiClaimedAnswer}`,
      );
    }

    apiImage.src = heartData.question;
    apiImage.style.display = "block";
    loadingState.style.display = "none";
    document.querySelector(".puzzle-image").classList.remove("loading");

    // update ui
    animateValue(suspectAnswerDisplay);
    suspectAnswerDisplay.innerText = aiClaimedAnswer;

    let randomConf = Math.floor(Math.random() * 30) + 65; // 65-95%
    confValue.innerText = randomConf + "%";
    confFill.style.width = randomConf + "%";

    feedbackText.innerHTML =
      '<i class="fas fa-microphone"></i> Interrogation active. Make your choice.';

    robotSpeak(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

    gameIsActive = true;
    startTimer();
  } catch (error) {
    console.error("api error:", error);
    feedbackText.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#ff4d4d;"></i> ERROR: Cannot connect to server';
    document.querySelector(".puzzle-image").classList.remove("loading");

    // retry after 3 seconds
    setTimeout(() => {
      if (!gameIsActive) fetchNewCase();
    }, 3000);
  }
}

// start timer
function startTimer() {
  timeRemaining = getDifficultyTimer();
  timerText.innerText = timeRemaining;
  timerCircle.classList.remove("warning");

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    if (timeRemaining <= 3) {
      timerCircle.classList.add("warning");
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      handleTimeOut();
    }
  }, 1000);
}

// handle timeout
function handleTimeOut() {
  if (!gameIsActive) return;
  gameIsActive = false;

  robotSpeak("Time is up. Too slow.");
  feedbackText.innerHTML =
    '<i class="fas fa-hourglass-end"></i> TIME OUT! You lost a life.';
  feedbackText.style.color = "#ff4d4d";

  flashScreen("wrong");
  showNotification("TIME OUT!", "error");

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

// trust suspect
function trustSuspect(event) {
  if (!gameIsActive) return;
  gameIsActive = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  let roundWin = false;
  let pointText = "";

  if (isAiLying === false) {
    score += 20;
    streak++;

    animateValue(scoreValue);
    animateValue(streakValue);

    feedbackText.innerHTML =
      '<i class="fas fa-check-circle" style="color:#39ff14;"></i> CORRECT! AI told truth. +20 POINTS';
    feedbackText.style.color = "#39ff14";
    robotSpeak("Thank you for trusting me.");

    flashScreen("correct");
    showNotification("+20 POINTS!", "success");

    roundWin = true;
    pointText = "+20";
  } else {
    // ai lied
    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> FOOL! AI lied. Real answer was ${actualTrueAnswer}.`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Ha ha ha. I deceived you.");

    flashScreen("wrong");
    showNotification("AI LIED!", "error");

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
    setTimeout(() => nextRound(), 2000);
  } else {
    loseLife();
  }
}

// show verify input
function showVerifyInput(event) {
  if (!gameIsActive) return;

  if (verifyBox.style.display === "none" || verifyBox.style.display === "") {
    verifyBox.style.display = "flex";
    manualInput.focus();
  } else {
    verifyBox.style.display = "none";
  }
}

// submit verification
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

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  verifyBox.style.display = "none";

  let roundWin = false;
  let pointText = "";

  if (playerAnswer === actualTrueAnswer) {
    score += 10;
    streak++;

    animateValue(scoreValue);
    animateValue(streakValue);

    feedbackText.innerHTML =
      '<i class="fas fa-check-circle" style="color:#39ff14;"></i> VERIFIED! Correct answer. +10 POINTS';
    feedbackText.style.color = "#39ff14";

    flashScreen("correct");

    if (isAiLying) {
      robotSpeak("You caught my deception. Well done.");
    } else {
      robotSpeak("I told you I was right.");
    }

    showNotification("+10 POINTS!", "success");

    roundWin = true;
    pointText = "+10";
  } else {
    // player wrong
    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> WRONG! Real answer was ${actualTrueAnswer}. You entered ${playerAnswer}.`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Your human brain is inferior.");

    flashScreen("wrong");
    showNotification("WRONG ANSWER!", "error");

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
    setTimeout(() => nextRound(), 2000);
  } else {
    loseLife();
  }
}

// lose life
function loseLife() {
  lives--;
  streak = 0;

  animateValue(livesDisplay);

  // shake lives icon
  let livesIcon = document.querySelector(".lives-count i");
  if (livesIcon) {
    livesIcon.style.animation = "shake 0.3s";
    setTimeout(() => (livesIcon.style.animation = ""), 300);
  }

  updateHUD();

  if (lives <= 0) {
    setTimeout(() => gameOver(), 2000);
  } else {
    setTimeout(() => nextRound(), 2500);
  }
}

// next round
function nextRound() {
  currentRound++;

  if (currentRound > 10) {
    // game complete
    showNotification("GAME COMPLETE!", "success");

    setTimeout(() => {
      saveGameToDB();
    }, 1500);
  } else {
    updateHUD();
    fetchNewCase();
  }
}

// update hud
function updateHUD() {
  scoreValue.innerText = score;
  streakValue.innerText = streak;
  currentRoundDisplay.innerText = currentRound;
  livesDisplay.innerText = lives;

  animateValue(currentRoundDisplay);
}

// game over
function gameOver() {
  showNotification("GAME OVER", "error");

  setTimeout(() => {
    saveGameToDB();
  }, 1500);
}

// save game to database
async function saveGameToDB() {
  // calculate accuracy
  let correctAnswers = 0;
  for (let i = 0; i < gameHistoryArray.length; i++) {
    if (gameHistoryArray[i].isWin) correctAnswers++;
  }
  let accuracy =
    Math.round((correctAnswers / gameHistoryArray.length) * 100) || 0;

  // save to local storage for results page
  localStorage.setItem(
    "interrogationHistory",
    JSON.stringify(gameHistoryArray),
  );
  localStorage.setItem("finalGameScore", score);
  localStorage.setItem("finalLives", lives);
  localStorage.setItem("finalAccuracy", accuracy);
  localStorage.setItem("roundsPlayed", gameHistoryArray.length);

  // save to db if logged in
  let userId = getCookie("loggedId");
  let username = getCookie("loggedUser");

  if (userId && username) {
    try {
      let res = await fetch("http://localhost:3000/api/save-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          username: username,
          score: score,
          livesLeft: lives,
          rounds: gameHistoryArray.length,
          accuracy: accuracy,
        }),
      });

      if (res.ok) {
        console.log("game saved to db ok");
      } else {
        console.log("failed to save game");
      }
    } catch (e) {
      console.log("could not save game:", e);
    }
  }

  // redirect to results
  window.location.href = "results.html";
}
