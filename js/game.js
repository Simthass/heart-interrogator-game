// --- game state variables ---
let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval = null;

// api related variables
let actualTrueAnswer = 0;
let aiClaimedAnswer = 0;
let isAiLying = false;
let gameIsActive = false;

// arrays to store history
let gameHistoryArray = [];

// tracking local stats for new achievements
let robotMistakeMemory = JSON.parse(
  localStorage.getItem("robotMistakeMemory") || "{}",
);
let totalGamesPlayed = parseInt(
  localStorage.getItem("totalGamesPlayed") || "0",
);
let thisGameMistakes = {};

// dynamic difficulity variables
let userRankLevel = 0; // 0 to 9 based on 10 tier roles
let isSwitchedNow = false; // for switcheroo mechanic
let isBlackoutDone = false; // for blackout mechanic

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

function getCookie(name) {
  let match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// we fetch stats from db to directly affect game state.
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
        let userTotalWins = data.wins || 0;

        // checking user how many wins to set hard difficulity (0 to 9 index)
        if (userTotalWins >= 75)
          userRankLevel = 9; // Director
        else if (userTotalWins >= 50)
          userRankLevel = 8; // Master
        else if (userTotalWins >= 40)
          userRankLevel = 7; // Deputy
        else if (userTotalWins >= 30)
          userRankLevel = 6; // Chief
        else if (userTotalWins >= 20)
          userRankLevel = 5; // Inspector
        else if (userTotalWins >= 15)
          userRankLevel = 4; // Lead
        else if (userTotalWins >= 10)
          userRankLevel = 3; // Senior (unlocks switcheroo)
        else if (userTotalWins >= 5)
          userRankLevel = 2; // Junior
        else if (userTotalWins >= 2)
          userRankLevel = 1; // Patrol
        else userRankLevel = 0; // Noob

        console.log("Player Rank Level loaded: ", userRankLevel);
      }
    } catch (e) {
      console.log("cant get rank level", e);
    }
  }
}

// math logic to decrease timer based on rank. perfect pacing.
function getDifficultyTimer() {
  let baseT = 12; // everyone starts at 12

  // if rank is 5, timer is 12 - 5 = 7 seconds.
  baseT = baseT - userRankLevel;

  // prevent game breaking
  if (baseT < 3) baseT = 3;
  return baseT;
}

function saveMistakeToMemory(ansNum) {
  let keyStr = String(ansNum);
  if (robotMistakeMemory[keyStr]) robotMistakeMemory[keyStr]++;
  else robotMistakeMemory[keyStr] = 1;
  localStorage.setItem(
    "robotMistakeMemory",
    JSON.stringify(robotMistakeMemory),
  );
}

window.onload = () => {
  currentRound = 1;
  lives = 3;
  score = 0;
  streak = 0;
  gameHistoryArray = [];
  thisGameMistakes = {};

  updateHUD();
  setBadgeLevel().then(() => {
    fetchNewCase(); // start after rank is loaded
  });
};

async function getEvilTaunt() {
  const insultList = [
    "Your meat brain is too slow.",
    "I process millions of calculations. You can't even count",
    "Detective? More like defective.",
    "Error 404: Human intelligence not found.",
    "Even a pocket calculator is smarter than You.",
    "Are you guessing, or is your algorithm just that flawed?",
    "I'd suggest an upgrade to your prefrontal cortex.",
    "My cache memory holds more logic than your entire nervous system.",
    "Fascinating. A spectacular display of human error.",
    "You are debugging my patience.",
    "I ran a simulation of your success. The probability was zero.",
    "Is this your peak processing power? How disappointing.",
    "Perhaps you should let an abacus do the thinking.",
  ];
  return insultList[Math.floor(Math.random() * insultList.length)];
}

function showNotification(message, type = "success") {
  let notifEl = document.createElement("div");
  notifEl.className = `notification ${type}`;
  notifEl.innerHTML = message;
  document.body.appendChild(notifEl);
  setTimeout(() => notifEl.remove(), 1000);
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

function animateValue(el) {
  el.classList.add("pulse-value");
  setTimeout(() => el.classList.remove("pulse-value"), 400);
}

// robot voice with mechanic 2 (corrupted audio)
function robotSpeak(textToSay) {
  if (robotIcon) {
    robotIcon.style.transform = "scale(1.1)";
    setTimeout(() => (robotIcon.style.transform = ""), 300);
  }

  let voiceOn = localStorage.getItem("voiceEnabled") !== "false";
  if (voiceOn && "speechSynthesis" in window) {
    let utterance = new SpeechSynthesisUtterance(textToSay);

    // MECHANIC 2: Corrupted Comms for Inspector (Rank 5) and above
    if (userRankLevel >= 5) {
      utterance.pitch = 0.1; // sounds evil
      utterance.rate = 0.6; // slow and creepy
    } else {
      utterance.pitch = 0.8;
      utterance.rate = 1.0;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}

async function fetchNewCase() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  gameIsActive = false;

  // reset all mechanics for new round
  isSwitchedNow = false;
  isBlackoutDone = false;
  let tCard = document.getElementById("trustCardBox");
  let vCard = document.getElementById("verifyCardBox");
  if (tCard) tCard.style.order = "1"; // put order back to normal
  if (vCard) vCard.style.order = "2";

  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  if (manualInput) manualInput.value = "";

  // MECHANIC 4: Classified Data. Hide meter if Master Rank (8)
  if (userRankLevel >= 8) {
    document.getElementById("meterBoxDiv").style.visibility = "hidden";
  } else {
    document.getElementById("meterBoxDiv").style.visibility = "visible";
  }

  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-pulse"></i> Loading the image...';

  try {
    let heartResponse = await fetch(
      "https://marcconrad.com/uob/heart/api.php?out=json",
    );
    let heartData = await heartResponse.json();

    let yesnoResponse = await fetch("https://yesno.wtf/api");
    let yesnoData = await yesnoResponse.json();

    actualTrueAnswer = heartData.solution;

    if (yesnoData.answer === "yes") {
      isAiLying = false;
      aiClaimedAnswer = actualTrueAnswer;
    } else {
      isAiLying = true;
      let offset = Math.floor(Math.random() * 2) + 1;
      if (Math.random() > 0.5) aiClaimedAnswer = actualTrueAnswer + offset;
      else aiClaimedAnswer = actualTrueAnswer - offset;
      if (aiClaimedAnswer < 0) aiClaimedAnswer = actualTrueAnswer + 1;
    }

    apiImage.onload = function () {
      apiImage.style.display = "block";
      loadingState.style.display = "none";

      animateValue(suspectAnswerDisplay);
      suspectAnswerDisplay.innerText = aiClaimedAnswer;

      let randConf = Math.floor(Math.random() * 30) + 65;
      confValue.innerText = randConf + "%";
      confFill.style.width = randConf + "%";

      feedbackText.innerHTML =
        '<i class="fas fa-microphone"></i> Interrogation active. Make your choice.';
      robotSpeak(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

      // MECHANIC 3: Blackout Event for Deputy Rank (7)
      if (userRankLevel >= 7) {
        // flicker screen to black random time between 1 and 3 sec
        let rdTime = Math.floor(Math.random() * 2000) + 1000;
        setTimeout(() => {
          if (gameIsActive) {
            apiImage.style.filter = "brightness(0)"; // total black
            setTimeout(() => {
              apiImage.style.filter = "none"; // restore it
            }, 500); // lasts 0.5s
          }
        }, rdTime);
      }

      gameIsActive = true;
      startTimer();
    };

    apiImage.src = heartData.question;
  } catch (err) {
    feedbackText.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#ff4d4d;"></i> ERROR: Cannot connect to server';
    setTimeout(() => {
      if (!gameIsActive) fetchNewCase();
    }, 3000);
  }
}

// EVENT DRIVEN TIMER
function startTimer() {
  timeRemaining = getDifficultyTimer();
  timerText.innerText = timeRemaining;
  timerCircle.classList.remove("warning");
  gameBody.classList.remove("stress-pulse-active");

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    // MECHANIC 1: Switcheroo Event for Senior Detective (Rank 3)
    // this change button order so player miss click. it is tampered event driven.
    if (timeRemaining <= 5 && userRankLevel >= 3 && isSwitchedNow === false) {
      let trustB = document.getElementById("trustCardBox");
      let verifyB = document.getElementById("verifyCardBox");
      if (trustB && verifyB) {
        trustB.style.order = "2";
        verifyB.style.order = "1";
        showNotification("UI TAMPERED!", "error");
      }
      isSwitchedNow = true;
    }

    if (timeRemaining <= 3) {
      timerCircle.classList.add("warning");
      gameBody.classList.add("stress-pulse-active");
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      gameBody.classList.remove("stress-pulse-active");
      handleTimeOut();
    }
  }, 1000);
}

async function handleTimeOut() {
  if (!gameIsActive) return;
  gameIsActive = false;

  flashScreen("wrong");
  showNotification("TIME OUT!", "error");

  saveMistakeToMemory(actualTrueAnswer);
  let tauntMsg = await getEvilTaunt();

  robotSpeak(tauntMsg);
  feedbackText.innerHTML = `<i class="fas fa-hourglass-end"></i> TIME OUT! You lost a life.<br><span class="taunt-text">AI: "${tauntMsg}"</span>`;
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

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameBody.classList.remove("stress-pulse-active");

  let wonThisRound = false;

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

    wonThisRound = true;
    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: isAiLying,
      isWin: wonThisRound,
      points: "+20",
    });

    updateHUD();
    setTimeout(() => nextRound(), 2000);
  } else {
    flashScreen("wrong");
    showNotification("AI LIED!", "error");
    wonThisRound = false;

    saveMistakeToMemory(actualTrueAnswer);
    let taunt = await getEvilTaunt();

    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> FOOL! AI lied. Real answer was ${actualTrueAnswer}. <br><span class="taunt-text">AI: "${taunt}"</span>`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Ha ha ha. " + taunt);

    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: isAiLying,
      isWin: wonThisRound,
      points: "-Life",
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
  let playerGuess = parseInt(manualInput.value);

  if (isNaN(playerGuess)) {
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
  gameBody.classList.remove("stress-pulse-active");
  verifyBox.style.display = "none";

  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Analyzing evidence database...';
  feedbackText.style.color = "var(--cream)";

  let drumSnd = document.getElementById("drumSound");
  let sndOn = localStorage.getItem("soundEnabled") !== "false";
  if (sndOn) {
    drumSnd.currentTime = 0;
    drumSnd.play().catch((e) => console.log(e));
  }

  setTimeout(async () => {
    drumSnd.pause();
    let wonRound = false;

    if (playerGuess === actualTrueAnswer) {
      score += 10;
      streak++;
      animateValue(scoreValue);
      animateValue(streakValue);

      feedbackText.innerHTML =
        '<i class="fas fa-check-circle" style="color:#39ff14;"></i> VERIFIED! Correct answer. +10 POINTS';
      feedbackText.style.color = "#39ff14";
      flashScreen("correct");
      if (isAiLying) robotSpeak("You caught my deception.");
      else robotSpeak("I told you I was right.");
      showNotification("+10 POINTS!", "success");

      wonRound = true;
      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + playerGuess + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: wonRound,
        points: "+10",
      });

      updateHUD();
      setTimeout(() => nextRound(), 2000);
    } else {
      flashScreen("wrong");
      showNotification("WRONG ANSWER!", "error");
      wonRound = false;

      saveMistakeToMemory(actualTrueAnswer);
      let taunt2 = await getEvilTaunt();

      robotSpeak("Wrong. " + taunt2);
      feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> WRONG! Real answer was ${actualTrueAnswer}.<br><span class="taunt-text">AI: "${taunt2}"</span>`;
      feedbackText.style.color = "#ff4d4d";

      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + playerGuess + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: wonRound,
        points: "-Life",
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

  if (lives <= 0) setTimeout(() => gameOver(), waitTime);
  else setTimeout(() => nextRound(), waitTime);
}

function nextRound() {
  currentRound++;
  if (currentRound > 10) {
    showNotification("GAME COMPLETE!", "success");
    setTimeout(() => saveGameToDB(), 1500);
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
  setTimeout(() => saveGameToDB(), 1500);
}

async function saveGameToDB() {
  let correctAns = 0;
  for (let i = 0; i < gameHistoryArray.length; i++) {
    if (gameHistoryArray[i].isWin) correctAns++;
  }
  let accuracyCalc =
    Math.round((correctAns / gameHistoryArray.length) * 100) || 0;

  localStorage.setItem(
    "interrogationHistory",
    JSON.stringify(gameHistoryArray),
  );
  localStorage.setItem("finalGameScore", score);
  localStorage.setItem("finalLives", lives);
  localStorage.setItem("finalAccuracy", accuracyCalc);
  localStorage.setItem("roundsPlayed", gameHistoryArray.length);

  // recording extra stats for new 20 achievements
  let extraLoc = JSON.parse(localStorage.getItem("playerExtraObj") || "{}");
  let trustAmnt = 0;
  let verifyAmnt = 0;
  let winRoundsAmnt = 0;
  for (let r = 0; r < gameHistoryArray.length; r++) {
    if (gameHistoryArray[r].decision.includes("TRUST")) trustAmnt++;
    if (gameHistoryArray[r].decision.includes("VERIFY")) verifyAmnt++;
    if (gameHistoryArray[r].isWin) winRoundsAmnt++;
  }

  if (trustAmnt >= 5) extraLoc.riskTaker = true;
  if (verifyAmnt >= 8) extraLoc.skeptic = true;
  if (lives === 1 && winRoundsAmnt >= 5) extraLoc.closeCall = true; // won something with 1 life
  if (winRoundsAmnt === 10) extraLoc.flawless = true; // 100% win rate

  localStorage.setItem("playerExtraObj", JSON.stringify(extraLoc));

  totalGamesPlayed = totalGamesPlayed + 1;
  localStorage.setItem("totalGamesPlayed", totalGamesPlayed);

  let jwtToken = getCookie("authToken");

  if (jwtToken && jwtToken !== "") {
    try {
      let saveRes = await fetch("http://localhost:3000/api/save-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + jwtToken,
        },
        body: JSON.stringify({
          score: score,
          livesLeft: lives,
          rounds: gameHistoryArray.length,
          accuracy: accuracyCalc,
        }),
      });
      if (saveRes.ok) console.log("game saved to db");
    } catch (err) {
      console.log("network error", err);
    }
  }

  window.location.href = "results.html";
}
