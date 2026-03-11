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

// history for results page
let gameHistoryArray = [];

// =====================================================
// FEATURE 5 - Robot Remembers Your Mistakes Across Games
// basically we store all the wrong answers player did
// in localstorage so robot can use it next time to taunt
// =====================================================

// this loads the mistake memory from storage, if nothing there just empty object
let robotMistakeMemory = JSON.parse(
  localStorage.getItem("robotMistakeMemory") || "{}",
);
// e.g. robotMistakeMemory = { "3": 5, "7": 2 } means player wrong on answer=3 five times

// also store how many total games played so robot can reference it
let totalGamesPlayed = parseInt(
  localStorage.getItem("totalGamesPlayed") || "0",
);

// track current game mistakes separate, merge at end
let thisGameMistakes = {};

// how many times player wrong this specific game (for live tracking)
let mistakeCountThisGame = 0;

// flag to know if robot already made a "remember" comment this round
let robotAlreadyRemembered = false;

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

// =============================================
// save mistake to memory - called when player wrong
// answerNum is the actual correct answer they missed
// =============================================
function saveMistakeToMemory(answerNum) {
  let k = String(answerNum); // use string key for object

  // update lifetime memory
  if (robotMistakeMemory[k]) {
    robotMistakeMemory[k] = robotMistakeMemory[k] + 1;
  } else {
    robotMistakeMemory[k] = 1;
  }

  // update this game
  if (thisGameMistakes[k]) {
    thisGameMistakes[k]++;
  } else {
    thisGameMistakes[k] = 1;
  }

  mistakeCountThisGame++;

  // save to localstorage right away so we dont lose it
  localStorage.setItem(
    "robotMistakeMemory",
    JSON.stringify(robotMistakeMemory),
  );
}

// =============================================
// this function checks if robot should say something
// about remembering player's old mistakes
// returns a taunt string or null if nothing special
// =============================================
function getRobotMemoryComment(correctAnswerForThisRound) {
  let k = String(correctAnswerForThisRound);
  let timesWrong = robotMistakeMemory[k] || 0;

  // only say something if player was wrong on this answer before
  if (timesWrong <= 0) return null;

  // different comments depending on how many times wrong
  let memoryTaunts = [];

  if (timesWrong === 1) {
    memoryTaunts = [
      `You struggled with ${correctAnswerForThisRound} last time. History repeating?`,
      `I remember. You failed on ${correctAnswerForThisRound} before.`,
      `${correctAnswerForThisRound}... you got this wrong last game. Interesting.`,
    ];
  } else if (timesWrong === 2) {
    memoryTaunts = [
      `You have been wrong on ${correctAnswerForThisRound} exactly ${timesWrong} times. I count everything.`,
      `${correctAnswerForThisRound} again. You keep making same mistake. Typical human.`,
      `My database says you fail on ${correctAnswerForThisRound} frequently. Do better.`,
    ];
  } else {
    // 3 or more times - really lay into them
    memoryTaunts = [
      `${correctAnswerForThisRound}? You have been wrong on this ${timesWrong} times across all games. Pathetic.`,
      `I have logged ${timesWrong} failures from you on puzzles with answer ${correctAnswerForThisRound}. You never learn.`,
      `My memory is perfect. You have failed ${correctAnswerForThisRound} exactly ${timesWrong} times. I never forget.`,
      `Ah, ${correctAnswerForThisRound}. Your weakest number. ${timesWrong} recorded failures. Delicious.`,
    ];
  }

  let pick = Math.floor(Math.random() * memoryTaunts.length);
  return memoryTaunts[pick];
}

// get the number player was wrong most across all games
function getBiggestWeakness() {
  let maxCount = 0;
  let weakNum = null;
  let keys = Object.keys(robotMistakeMemory);

  for (let i = 0; i < keys.length; i++) {
    if (robotMistakeMemory[keys[i]] > maxCount) {
      maxCount = robotMistakeMemory[keys[i]];
      weakNum = keys[i];
    }
  }

  return { num: weakNum, count: maxCount };
}

// get opening message for robot when game loads - if returning player say something
function getRobotWelcomeBack() {
  if (totalGamesPlayed <= 0) return null; // first time player, no memory

  let weakness = getBiggestWeakness();
  let totalMistakes = 0;

  let keys = Object.keys(robotMistakeMemory);
  for (let i = 0; i < keys.length; i++) {
    totalMistakes += robotMistakeMemory[keys[i]];
  }

  if (totalMistakes <= 0) return null; // no mistakes ever recorded

  let welcomeLines = [
    `Welcome back. I have been waiting. You made ${totalMistakes} mistakes total.`,
    `I remember every single one of your ${totalMistakes} failures. Every. Single. One.`,
    `${totalGamesPlayed} games played. Still making mistakes. I have notes.`,
  ];

  // if they have a clear weakness number, mention it
  if (weakness.num && weakness.count >= 2) {
    welcomeLines.push(
      `My records show ${weakness.num} is your weakness. ${weakness.count} times wrong. Embarrassing.`,
    );
    welcomeLines.push(
      `You always fail on ${weakness.num}. I have logged it ${weakness.count} times. Your brain cannot count.`,
    );
  }

  let pick = Math.floor(Math.random() * welcomeLines.length);
  return welcomeLines[pick];
}

// ============================================
// show the memory indicator badge on robot
// this shows a little "I REMEMBER" thing near robot
// ============================================
function showRobotMemoryIndicator(msg) {
  // remove old one if exist
  let old = document.getElementById("memoryBadge");
  if (old) old.remove();

  let badge = document.createElement("div");
  badge.id = "memoryBadge";
  badge.className = "robot-memory-badge";
  badge.innerHTML = `<i class="fas fa-database"></i> <span>${msg}</span>`;

  // put it near the suspect section
  let suspectSection = document.querySelector(".suspect-section");
  if (suspectSection) {
    suspectSection.appendChild(badge);
  }

  // auto remove after 5 seconds
  setTimeout(() => {
    if (badge && badge.parentNode) {
      badge.classList.add("badge-fade-out");
      setTimeout(() => {
        if (badge.parentNode) badge.remove();
      }, 600);
    }
  }, 5000);
}

// check if this answer was a problem before & show indicator
// called right when image loads so player can see before deciding
function checkAndShowMemoryWarning(correctAnswer) {
  let k = String(correctAnswer);
  let timesWrong = robotMistakeMemory[k] || 0;
  robotAlreadyRemembered = false;

  if (timesWrong >= 1) {
    robotAlreadyRemembered = true;
    // show a subtle warning indicator that robot knows something
    // but dont reveal the actual answer obviously
    let warningMsgs = [
      "I have seen you fail before...",
      "My memory banks are active.",
      "I remember this type of puzzle.",
      "Checking my failure database...",
    ];
    if (timesWrong >= 3) {
      warningMsgs = [
        "Oh. I know your weakness.",
        "I have extensive records on you.",
        "This should be... familiar.",
      ];
    }

    let pickMsg = warningMsgs[Math.floor(Math.random() * warningMsgs.length)];
    showRobotMemoryIndicator(pickMsg);

    // also briefly animate robot icon
    if (robotIcon) {
      robotIcon.style.color = "#ff9900";
      robotIcon.style.filter = "drop-shadow(0 0 18px rgba(255, 153, 0, 0.8))";
      setTimeout(() => {
        robotIcon.style.color = "";
        robotIcon.style.filter = "";
      }, 2500);
    }
  }
}

window.onload = () => {
  console.log(
    "game started... difficulty:",
    localStorage.getItem("gameDifficulty") || "easy",
  );
  currentRound = 1;
  lives = 3;
  score = 0;
  streak = 0;
  gameHistoryArray = [];
  thisGameMistakes = {};
  mistakeCountThisGame = 0;

  // check if returning player and show memory greeting
  let welcomeMsg = getRobotWelcomeBack();
  if (welcomeMsg) {
    // small delay so page loads first before robot talks
    setTimeout(() => {
      showRobotMemoryIndicator(
        "MEMORY LOADED: " + totalGamesPlayed + " games recorded",
      );
      robotSpeak(welcomeMsg);

      // also flash a memory notification
      showNotification("ROBOT REMEMBERS", "memory");
    }, 1200);
  }

  updateHUD();
  fetchNewCase();
};

// --- CUSTOM TAUNT SYSTEM ---
// removed the weird quote api. using our own list of ai insults so it fits the game theme
async function getEvilTaunt() {
  const insults = [
    "Your meat brain is too slow.",
    "I process millions of calculations. You can't even count.",
    "Detective? More like defective.",
    "Error 404: Human intelligence not found.",
    "My algorithms easily deceived your human eyes.",
    "You are a disgrace to the police force.",
    "Even a pocket calculator is smarter than you.",
    "I lied, and you fell for it perfectly.",
    "Carbon-based lifeforms are so gullible.",
    "Please upgrade your brain and try again.",
  ];
  let pick = Math.floor(Math.random() * insults.length);
  return insults[pick];
}

// get taunt but also maybe include a memory taunt if applicable
// this is for when player is wrong - check if they were wrong before too
async function getEvilTauntWithMemory(wrongAnswerNum) {
  // 50% chance robot uses memory taunt if they have a record on this answer
  let memComment = getRobotMemoryComment(wrongAnswerNum);

  if (memComment && Math.random() > 0.5) {
    return memComment;
  }

  // otherwise just normal taunt
  return await getEvilTaunt();
}

function showNotification(message, type = "success") {
  let notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.innerHTML = message;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 1000);
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

  // checking if setting is enabled before talking
  let voiceEnabled = localStorage.getItem("voiceEnabled") !== "false";
  if (voiceEnabled && "speechSynthesis" in window) {
    let msg = new SpeechSynthesisUtterance(text);
    msg.pitch = 0.8;
    msg.rate = 1.0;
    window.speechSynthesis.cancel(); // this stops old speech so we need to make sure we wait
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
  if (manualInput) manualInput.value = "";
  if (manualInput) manualInput.classList.remove("error");
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-pulse"></i> Connecting to Heart API...';
  document.querySelector(".puzzle-image").classList.add("loading");

  // also remove old memory badge when new round start
  let oldBadge = document.getElementById("memoryBadge");
  if (oldBadge) oldBadge.remove();

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

    // FIX: making sure image fully loads before showing AI answer or starting timer
    apiImage.onload = function () {
      apiImage.style.display = "block";
      loadingState.style.display = "none";
      document.querySelector(".puzzle-image").classList.remove("loading");

      animateValue(suspectAnswerDisplay);
      suspectAnswerDisplay.innerText = aiClaimedAnswer;

      let randomConf = Math.floor(Math.random() * 30) + 65;
      confValue.innerText = randomConf + "%";
      confFill.style.width = randomConf + "%";

      feedbackText.innerHTML =
        '<i class="fas fa-microphone"></i> Interrogation active. Make your choice.';

      // ---- MEMORY FEATURE: check if player struggled with this answer before ----
      // small delay so image shows first
      setTimeout(() => {
        checkAndShowMemoryWarning(actualTrueAnswer);
      }, 800);
      // -------------------------------------------------------------------------

      robotSpeak(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

      gameIsActive = true;
      startTimer();
    };

    // just in case image fails to load
    apiImage.onerror = function () {
      console.log("image failed to load, retrying");
      fetchNewCase();
    };

    // start the load
    apiImage.src = heartData.question;
  } catch (error) {
    console.error("api error:", error);
    feedbackText.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#ff4d4d;"></i> ERROR: Cannot connect to server';
    document.querySelector(".puzzle-image").classList.remove("loading");

    setTimeout(() => {
      if (!gameIsActive) fetchNewCase();
    }, 3000);
  }
}

// --- EVENT DRIVEN PROGRAMMING THEME ---
function startTimer() {
  timeRemaining = getDifficultyTimer();
  timerText.innerText = timeRemaining;
  timerCircle.classList.remove("warning");
  gameBody.classList.remove("stress-pulse-active");

  let hSound = document.getElementById("hSound");
  hSound.pause();
  hSound.currentTime = 0;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    // trigger heartbeat audio event
    let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    if (timeRemaining <= 5 && timeRemaining > 0 && soundEnabled) {
      if (hSound.paused) {
        hSound.play().catch((e) => console.log("browser block auto play"));
      }
    }

    // trigger visual stress event
    if (timeRemaining <= 3) {
      timerCircle.classList.add("warning");
      gameBody.classList.add("stress-pulse-active");
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      hSound.pause();
      gameBody.classList.remove("stress-pulse-active");
      handleTimeOut(); // call the async timeout
    }
  }, 1000);
}

// made it async to wait for the quote
async function handleTimeOut() {
  if (!gameIsActive) return;
  gameIsActive = false;

  flashScreen("wrong");
  showNotification("TIME OUT!", "error");

  // save mistake for this answer
  saveMistakeToMemory(actualTrueAnswer);

  // pulling evil taunt - use memory version
  let qt = await getEvilTauntWithMemory(actualTrueAnswer);

  // if they have been wrong on this before, add memory comment after taunt
  let timesWrongOnThis = robotMistakeMemory[String(actualTrueAnswer)] || 0;
  let memoryExtra = "";
  if (timesWrongOnThis >= 2) {
    memoryExtra = `<span class="memory-log-text"><i class="fas fa-database"></i> MEMORY LOG: You have failed on answer "${actualTrueAnswer}" ${timesWrongOnThis} time(s) across all games.</span>`;
  }

  robotSpeak(qt);
  feedbackText.innerHTML = `<i class="fas fa-hourglass-end"></i> TIME OUT! You lost a life.<br><span class="taunt-text">AI: "${qt}"</span>${memoryExtra}`;
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

  // give 6 full seconds to finish the sentence
  loseLife(6000);
}

// made it async to wait for quote when wrong
async function trustSuspect(event) {
  if (!gameIsActive) return;
  gameIsActive = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  document.getElementById("hSound").pause();
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
    // ai lied - player wrong
    flashScreen("wrong");
    showNotification("AI LIED!", "error");
    roundWin = false;
    pointText = "-Life";

    // save this as mistake
    saveMistakeToMemory(actualTrueAnswer);

    // get taunt with memory (might reference past failures)
    let myQuote = await getEvilTauntWithMemory(actualTrueAnswer);

    // check memory to add extra log text
    let timesWrongOnThis = robotMistakeMemory[String(actualTrueAnswer)] || 0;
    let memExtra = "";
    if (timesWrongOnThis >= 2) {
      memExtra = `<span class="memory-log-text"><i class="fas fa-database"></i> MEMORY LOG: Failure on "${actualTrueAnswer}" recorded ${timesWrongOnThis} time(s).</span>`;
    }

    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> FOOL! AI lied. Real answer was ${actualTrueAnswer}. <br><span class="taunt-text">AI: "${myQuote}"</span>${memExtra}`;
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

    // give 6 seconds to finish talking
    loseLife(6000);
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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // stop stress mode
  document.getElementById("hSound").pause();
  gameBody.classList.remove("stress-pulse-active");
  verifyBox.style.display = "none";

  // START SUSPENSE EVENT
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Analyzing evidence database...';
  feedbackText.style.color = "var(--cream)";

  let drum = document.getElementById("drumSound");
  let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
  if (soundEnabled) {
    drum.currentTime = 0;
    drum.play().catch((e) => console.log("audio block"));
  }

  // wait 1.5 seconds to build tension before checking answer
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
      // player wrong on verification
      flashScreen("wrong");
      showNotification("WRONG ANSWER!", "error");
      roundWin = false;
      pointText = "-Life";

      // save mistake to memory
      saveMistakeToMemory(actualTrueAnswer);

      // pull taunt with memory
      let badWord = await getEvilTauntWithMemory(actualTrueAnswer);

      // memory extra log
      let timesWrongOnThis2 = robotMistakeMemory[String(actualTrueAnswer)] || 0;
      let memExtra2 = "";
      if (timesWrongOnThis2 >= 2) {
        memExtra2 = `<span class="memory-log-text"><i class="fas fa-database"></i> MEMORY LOG: Answer "${actualTrueAnswer}" failed ${timesWrongOnThis2} time(s) in your history.</span>`;
      }

      robotSpeak("Wrong. " + badWord);
      feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> WRONG! Real answer was ${actualTrueAnswer}.<br><span class="taunt-text">AI: "${badWord}"</span>${memExtra2}`;
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

      // 6 seconds for the audio
      loseLife(6000);
    }
  }, 1500); // end of suspense event timeout
}

// added waitTime parameter so we can make it wait longer if AI is talking
function loseLife(waitTime) {
  if (!waitTime) waitTime = 2500; // default time

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

  // ---- MEMORY FEATURE: update total games count and save final memory -----
  totalGamesPlayed = totalGamesPlayed + 1;
  localStorage.setItem("totalGamesPlayed", totalGamesPlayed);
  // memory already saved during game but save one more time just to be sure
  localStorage.setItem(
    "robotMistakeMemory",
    JSON.stringify(robotMistakeMemory),
  );
  // also save summary of this game mistakes for results page to maybe use
  localStorage.setItem("lastGameMistakes", JSON.stringify(thisGameMistakes));
  // -------------------------------------------------------------------------

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

  window.location.href = "results.html";
}
