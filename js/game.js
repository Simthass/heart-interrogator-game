let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval = null;

// api stuff
let actualTrueAnswer = 0;
let aiClaimedAnswer = 0;
let isAiLying = false;
let gameIsActive = false;
let gameHistoryArray = [];

// audio tracking fix
let isAudioPlaying = false;

// badges tracking for dynamic difficulty
let userTotalWins = 0;
let myBadgeLevel = 0;

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
const distractionBox = document.getElementById("hackDistractionBox");

function getCookie(name) {
  let match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// grabbing stats first to set the dynamic difficulty
async function setBadgeLevel() {
  let myToken = getCookie("authToken");
  if (myToken) {
    try {
      let res = await fetch("http://localhost:3000/api/my-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + myToken,
        },
        body: JSON.stringify({}),
      });
      let data = await res.json();
      if (res.ok) {
        userTotalWins = data.wins || 0;
        // calculate badge level
        if (userTotalWins >= 10) {
          myBadgeLevel = 3;
        } // Master
        else if (userTotalWins >= 5) {
          myBadgeLevel = 2;
        } // Veteran
        else if (userTotalWins >= 1) {
          myBadgeLevel = 1;
        } // First Win
        console.log("user badge level loaded: " + myBadgeLevel);
      }
    } catch (e) {
      console.log("cant get badge level", e);
    }
  }
}

function getDifficultyTimer() {
  let diff = localStorage.getItem("gameDifficulty") || "hard";
  let baseTimer = 12;
  if (diff === "easy") baseTimer = 12;
  if (diff === "hard") baseTimer = 7;
  if (diff === "expert") baseTimer = 4;

  // DYNAMIC DIFFICULTY REDUCTION based on achievements
  if (myBadgeLevel === 3) {
    baseTimer = baseTimer - 2; // master gets even less time
  } else if (myBadgeLevel === 2) {
    baseTimer = baseTimer - 1; // veteran gets less time
  }

  // cant go below 2 seconds or game breaks
  if (baseTimer < 2) baseTimer = 2;

  return baseTimer;
}

window.onload = () => {
  console.log("game loaded... waiting for user to click start overlay");
  currentRound = 1;
  lives = 3;
  score = 0;
  streak = 0;
  gameHistoryArray = [];
  updateHUD();
  setBadgeLevel(); // fetch wins before playing
};

// FIX FOR BROWSER AUDIO BLOCK
window.startGameAndAudio = function () {
  document.getElementById("startOverlayBox").style.display = "none";
  let hSound = document.getElementById("hSound");
  let drum = document.getElementById("drumSound");

  let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
  if (soundEnabled) {
    hSound.play().catch((e) => console.log(e));
    hSound.pause();
    hSound.currentTime = 0;

    drum.play().catch((e) => console.log(e));
    drum.pause();
    drum.currentTime = 0;
  }

  fetchNewCase();
};

async function getEvilTaunt() {
  const insults = [
    "Your meat brain is too slow.",
    "I process millions of calculations.",
    "Detective? More like defective.",
    "Error 404: Human intelligence not found.",
    "My algorithms easily deceived you.",
    "Even a pocket calculator is smarter.",
  ];
  let pick = Math.floor(Math.random() * insults.length);
  return insults[pick];
}

// THIRD EXTERNAL API TO CAUSE DISTRACTION (INTEROPERABILITY MARK)
async function triggerHackerDistraction() {
  try {
    // fetching random useless fact to flash on screen and confuse player
    let factRes = await fetch(
      "https://uselessfacts.jsph.pl/api/v2/facts/random",
    );
    let factData = await factRes.json();

    distractionBox.innerText = "SYSTEM HACK: " + factData.text;
    distractionBox.style.display = "block";

    // hide it after 2 seconds
    setTimeout(() => {
      distractionBox.style.display = "none";
    }, 2000);
  } catch (err) {
    console.log("distraction api fail", err);
  }
}

function showNotification(message, type = "success") {
  let notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.innerHTML = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 1000);
}

function flashScreen(type) {
  if (type === "correct") {
    gameBody.classList.add("flash-correct");
    setTimeout(() => gameBody.classList.remove("flash-correct"), 400);
  } else {
    gameBody.classList.add("flash-wrong");
    setTimeout(() => gameBody.classList.remove("flash-wrong"), 400);
  }
}

function animateValue(element) {
  element.classList.add("pulse-value");
  setTimeout(() => element.classList.remove("pulse-value"), 400);
}

function robotSpeak(text) {
  if (robotIcon) {
    robotIcon.style.transform = "scale(1.1)";
    setTimeout(() => (robotIcon.style.transform = ""), 300);
  }

  let voiceEnabled = localStorage.getItem("voiceEnabled") !== "false";
  if (voiceEnabled && "speechSynthesis" in window) {
    let msg = new SpeechSynthesisUtterance(text);
    msg.pitch = 0.8;
    msg.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }
}

async function fetchNewCase() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  gameIsActive = false;
  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  distractionBox.style.display = "none";
  if (manualInput) manualInput.value = "";
  if (manualInput) manualInput.classList.remove("error");
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-pulse"></i> Connecting to Heart API...';

  // reset filters
  apiImage.style.filter = "none";

  try {
    let heartRes = await fetch(
      "https://marcconrad.com/uob/heart/api.php?out=json",
    );
    let heartData = await heartRes.json();

    let yesNoRes = await fetch("https://yesno.wtf/api");
    let yesNoData = await yesNoRes.json();
    actualTrueAnswer = heartData.solution;

    if (yesNoData.answer === "yes") {
      isAiLying = false;
      aiClaimedAnswer = actualTrueAnswer;
    } else {
      isAiLying = true;
      let offset = Math.floor(Math.random() * 2) + 1;
      if (Math.random() > 0.5) {
        aiClaimedAnswer = actualTrueAnswer + offset;
      } else {
        aiClaimedAnswer = actualTrueAnswer - offset;
      }
      if (aiClaimedAnswer < 0) aiClaimedAnswer = actualTrueAnswer + 1;
    }

    apiImage.onload = function () {
      apiImage.style.display = "block";
      loadingState.style.display = "none";

      animateValue(suspectAnswerDisplay);
      suspectAnswerDisplay.innerText = aiClaimedAnswer;

      let randomConf = Math.floor(Math.random() * 30) + 65;
      confValue.innerText = randomConf + "%";
      confFill.style.width = randomConf + "%";

      feedbackText.innerHTML =
        '<i class="fas fa-microphone"></i> Interrogation active. Make your choice.';
      robotSpeak(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

      // ============================================
      // DYNAMIC DIFFICULTY VISUAL MECHANICS
      // ============================================
      if (myBadgeLevel >= 2) {
        // blur the image slightly for veteran players
        apiImage.style.filter = "blur(2px)";
      }
      if (myBadgeLevel === 3) {
        // master players get heavy blur and distraction api call
        apiImage.style.filter = "blur(3px)";

        // random chance to trigger the 3rd API distraction mid round
        if (Math.random() > 0.4) {
          setTimeout(() => {
            triggerHackerDistraction();
          }, 2000); // 2 seconds into the round it flashes text
        }
      }

      gameIsActive = true;
      startTimer();
    };

    apiImage.src = heartData.question;
  } catch (error) {
    console.error("api error:", error);
    feedbackText.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#ff4d4d;"></i> ERROR: Cannot connect to server';
    setTimeout(() => {
      if (!gameIsActive) fetchNewCase();
    }, 3000);
  }
}

function startTimer() {
  timeRemaining = getDifficultyTimer();
  timerText.innerText = timeRemaining;
  timerCircle.classList.remove("warning");
  gameBody.classList.remove("stress-pulse-active");

  let hSound = document.getElementById("hSound");
  hSound.pause();
  hSound.currentTime = 0;
  isAudioPlaying = false; // reset flag

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    let soundEnabled = localStorage.getItem("soundEnabled") !== "false";

    // play heartbeat audio safely using flag
    if (timeRemaining <= 5 && timeRemaining > 0 && soundEnabled) {
      if (!isAudioPlaying) {
        hSound.play().catch((e) => console.log(e));
        isAudioPlaying = true; // this stops it from calling play() multiple times
      }
    }

    if (timeRemaining <= 3) {
      timerCircle.classList.add("warning");
      gameBody.classList.add("stress-pulse-active");
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      hSound.pause();
      isAudioPlaying = false;
      gameBody.classList.remove("stress-pulse-active");
      handleTimeOut();
    }
  }, 1000);
}

async function handleTimeOut() {
  if (!gameIsActive) return;
  gameIsActive = false;
  distractionBox.style.display = "none"; // clean ui

  flashScreen("wrong");
  showNotification("TIME OUT!", "error");

  let qt = await getEvilTaunt();

  robotSpeak(qt);
  feedbackText.innerHTML = `<i class="fas fa-hourglass-end"></i> TIME OUT! You lost a life.<br><span class="taunt-text">AI: "${qt}"</span>`;
  feedbackText.style.color = "#ff4d4d";

  gameHistoryArray.push({
    round: currentRound,
    decision: "TIMEOUT",
    aiSaid: aiClaimedAnswer,
    realAnswer: actualTrueAnswer,
    aiLied: isAiLying,
    isWin: false,
    points: "-Life",
  });

  loseLife(4000);
}

async function trustSuspect(event) {
  if (!gameIsActive) return;
  gameIsActive = false;
  distractionBox.style.display = "none";

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  document.getElementById("hSound").pause();
  isAudioPlaying = false;
  gameBody.classList.remove("stress-pulse-active");

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

    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: isAiLying,
      isWin: roundWin,
      points: pointText,
    });

    updateHUD();
    setTimeout(() => nextRound(), 2000);
  } else {
    flashScreen("wrong");
    showNotification("AI LIED!", "error");
    roundWin = false;
    pointText = "-Life";

    let myQuote = await getEvilTaunt();

    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> FOOL! AI lied. Real answer was ${actualTrueAnswer}. <br><span class="taunt-text">AI: "${myQuote}"</span>`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Ha ha ha. " + myQuote);

    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: isAiLying,
      isWin: roundWin,
      points: pointText,
    });

    loseLife(4000);
  }
}

function showVerifyInput(event) {
  if (!gameIsActive) return;
  if (verifyBox.style.display === "none" || verifyBox.style.display === "") {
    verifyBox.style.display = "flex";
    manualInput.focus();
  } else {
    verifyBox.style.display = "none";
  }
}

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
  distractionBox.style.display = "none";
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // stop stress mode heartbeat
  document.getElementById("hSound").pause();
  isAudioPlaying = false;
  gameBody.classList.remove("stress-pulse-active");
  verifyBox.style.display = "none";

  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Analyzing evidence database...';
  feedbackText.style.color = "var(--cream)";

  let drum = document.getElementById("drumSound");
  let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
  if (soundEnabled) {
    drum.currentTime = 0;
    drum.play().catch((e) => console.log(e));
  }

  setTimeout(async () => {
    drum.pause();
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

      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + playerAnswer + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: roundWin,
        points: pointText,
      });

      updateHUD();
      setTimeout(() => nextRound(), 2000);
    } else {
      flashScreen("wrong");
      showNotification("WRONG ANSWER!", "error");
      roundWin = false;
      pointText = "-Life";

      let badWord = await getEvilTaunt();

      robotSpeak("Wrong. " + badWord);
      feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> WRONG! Real answer was ${actualTrueAnswer}.<br><span class="taunt-text">AI: "${badWord}"</span>`;
      feedbackText.style.color = "#ff4d4d";

      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + playerAnswer + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: roundWin,
        points: pointText,
      });

      loseLife(4000);
    }
  }, 1500);
}

function loseLife(waitTime) {
  if (!waitTime) waitTime = 2500;

  lives--;
  streak = 0;

  animateValue(livesDisplay);
  let livesIcon = document.querySelector(".lives-count i");
  if (livesIcon) {
    livesIcon.style.animation = "shake 0.3s";
    setTimeout(() => (livesIcon.style.animation = ""), 300);
  }

  updateHUD();

  if (lives <= 0) {
    setTimeout(() => gameOver(), waitTime);
  } else {
    setTimeout(() => nextRound(), waitTime);
  }
}

function nextRound() {
  currentRound++;
  if (currentRound > 10) {
    showNotification("GAME COMPLETE!", "success");
    setTimeout(() => {
      saveGameToDB();
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
  animateValue(currentRoundDisplay);
}

function gameOver() {
  showNotification("GAME OVER", "error");
  setTimeout(() => {
    saveGameToDB();
  }, 1500);
}

async function saveGameToDB() {
  let correctAnswers = 0;
  for (let i = 0; i < gameHistoryArray.length; i++) {
    if (gameHistoryArray[i].isWin) correctAnswers++;
  }
  let accuracy =
    Math.round((correctAnswers / gameHistoryArray.length) * 100) || 0;

  localStorage.setItem(
    "interrogationHistory",
    JSON.stringify(gameHistoryArray),
  );
  localStorage.setItem("finalGameScore", score);
  localStorage.setItem("finalLives", lives);
  localStorage.setItem("finalAccuracy", accuracy);
  localStorage.setItem("roundsPlayed", gameHistoryArray.length);

  let myToken = getCookie("authToken");

  if (myToken && myToken !== "") {
    try {
      let res = await fetch("http://localhost:3000/api/save-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + myToken,
        },
        body: JSON.stringify({
          score: score,
          livesLeft: lives,
          rounds: gameHistoryArray.length,
          accuracy: accuracy,
        }),
      });
      if (res.ok) {
        console.log("game saved securely to db");
      }
    } catch (e) {
      console.log("could not save game:", e);
    }
  }
  window.location.href = "results.html";
}
