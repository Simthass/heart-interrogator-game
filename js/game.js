// --- game state variables ---
let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval = null;

// api related variables
let actualTrueAnswer = 0; // the real answer from heart API
let aiClaimedAnswer = 0; // what robot says (might be a lie)
let isAiLying = false; // did yesno api say robot should lie?
let gameIsActive = false; // prevent double clicking buttons

// saves all round decisions for results page
let gameHistoryArray = [];

// =====================================================
// ROBOT MEMORY FEATURE
// robot remembers which answers player got wrong across
// multiple game sessions using localstorage
// data format: { "3": 5, "7": 2 } = player wrong on answer 3 five times
// this adds a persistence/state layer across games
// =====================================================
let robotMistakeMemory = JSON.parse(
  localStorage.getItem("robotMistakeMemory") || "{}",
);

// how many total games this player played before (for robot taunts)
let totalGamesPlayed = parseInt(
  localStorage.getItem("totalGamesPlayed") || "0",
);

// track mistakes just for the current game session
let thisGameMistakes = {};

// count wrong answers this game (for live tracking)
let mistakeCountThisGame = 0;

// flag so robot doesnt repeat memory comment twice in same round
let robotAlreadyRemembered = false;

// --- get dom elements ---
// doing these at top so we dont query dom every single function call
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

// get difficulty timer value from localstorage setting
// easy=12, hard=7, expert=3 seconds
function getDifficultyTimer() {
  let diff = localStorage.getItem("gameDifficulty") || "easy";
  if (diff === "easy") return 12;
  if (diff === "hard") return 7;
  if (diff === "expert") return 3;
  return 12; // default fallback
}

// =====================================================
// MEMORY FEATURE FUNCTIONS
// =====================================================

// save mistake to robot's memory when player answers wrong
// ansNum = the correct answer player got wrong on
function saveMistakeToMemory(ansNum) {
  let keyStr = String(ansNum); // use string key for object

  // update lifetime mistake memory
  if (robotMistakeMemory[keyStr]) {
    robotMistakeMemory[keyStr] = robotMistakeMemory[keyStr] + 1;
  } else {
    robotMistakeMemory[keyStr] = 1;
  }

  // also track for this current game
  if (thisGameMistakes[keyStr]) {
    thisGameMistakes[keyStr]++;
  } else {
    thisGameMistakes[keyStr] = 1;
  }

  mistakeCountThisGame++;

  // save to localstorage immediately so data persists even if browser closed
  localStorage.setItem(
    "robotMistakeMemory",
    JSON.stringify(robotMistakeMemory),
  );
}

// get a robot taunt message that references past mistakes
// returns a taunt string, or null if no history on this answer
function getRobotMemoryComment(correctAns) {
  let keyStr = String(correctAns);
  let howManyTimes = robotMistakeMemory[keyStr] || 0;

  if (howManyTimes <= 0) return null; // no history, nothing to say

  let tauntLines = [];

  if (howManyTimes === 1) {
    tauntLines = [
      `You struggled with ${correctAns} last time. History repeating?`,
      `I remember. You failed on ${correctAns} before.`,
      `${correctAns}... you got this wrong last game. Interesting.`,
    ];
  } else if (howManyTimes === 2) {
    tauntLines = [
      `You have been wrong on ${correctAns} exactly ${howManyTimes} times. I count everything.`,
      `${correctAns} again. You keep making same mistake. Typical human.`,
      `My database says you fail on ${correctAns} frequently. Do better.`,
    ];
  } else {
    // 3 or more times - really taunt them hard
    tauntLines = [
      `${correctAns}? You have been wrong on this ${howManyTimes} times across all games. Pathetic.`,
      `I have logged ${howManyTimes} failures from you on puzzles with answer ${correctAns}. You never learn.`,
      `My memory is perfect. You have failed ${correctAns} exactly ${howManyTimes} times. I never forget.`,
      `Ah, ${correctAns}. Your weakest number. ${howManyTimes} recorded failures. Delicious.`,
    ];
  }

  let idx = Math.floor(Math.random() * tauntLines.length);
  return tauntLines[idx];
}

// find which number the player gets wrong most often across all games
function getBiggestWeakness() {
  let maxCnt = 0;
  let weakNum = null;
  let allKeys = Object.keys(robotMistakeMemory);

  for (let i = 0; i < allKeys.length; i++) {
    if (robotMistakeMemory[allKeys[i]] > maxCnt) {
      maxCnt = robotMistakeMemory[allKeys[i]];
      weakNum = allKeys[i];
    }
  }

  return { num: weakNum, count: maxCnt };
}

// get a welcome back message for returning players
// uses stored mistake history to personalize it
function getRobotWelcomeBack() {
  if (totalGamesPlayed <= 0) return null; // first time player

  let weakness = getBiggestWeakness();
  let totalMistakesSoFar = 0;

  let allKeys = Object.keys(robotMistakeMemory);
  for (let i = 0; i < allKeys.length; i++) {
    totalMistakesSoFar += robotMistakeMemory[allKeys[i]];
  }

  if (totalMistakesSoFar <= 0) return null; // no recorded mistakes

  let welcomeOptions = [
    `Welcome back. I have been waiting. You made ${totalMistakesSoFar} mistakes total.`,
    `I remember every single one of your ${totalMistakesSoFar} failures. Every. Single. One.`,
    `${totalGamesPlayed} games played. Still making mistakes. I have notes.`,
  ];

  // if clear weakness number, mention it specifically
  if (weakness.num && weakness.count >= 2) {
    welcomeOptions.push(
      `My records show ${weakness.num} is your weakness. ${weakness.count} times wrong. Embarrassing.`,
    );
    welcomeOptions.push(
      `You always fail on ${weakness.num}. I have logged it ${weakness.count} times. Your brain cannot count.`,
    );
  }

  let pick = Math.floor(Math.random() * welcomeOptions.length);
  return welcomeOptions[pick];
}

// show the little "I REMEMBER" badge near robot icon
function showRobotMemoryIndicator(msg) {
  // remove old badge if one already showing
  let existingBdg = document.getElementById("memoryBadge");
  if (existingBdg) existingBdg.remove();

  let newBdg = document.createElement("div");
  newBdg.id = "memoryBadge";
  newBdg.className = "robot-memory-badge";
  newBdg.innerHTML = `<i class="fas fa-database"></i> <span>${msg}</span>`;

  // put badge inside suspect section
  let suspectSec = document.querySelector(".suspect-section");
  if (suspectSec) {
    suspectSec.appendChild(newBdg);
  }

  // auto remove after 5 seconds with fade out
  setTimeout(() => {
    if (newBdg && newBdg.parentNode) {
      newBdg.classList.add("badge-fade-out");
      setTimeout(() => {
        if (newBdg.parentNode) newBdg.remove();
      }, 600);
    }
  }, 5000);
}

// check if player has a history with this answer and show warning
// called when image loads so player sees it before deciding
function checkAndShowMemoryWarning(correctAns) {
  let keyStr = String(correctAns);
  let timesWrong = robotMistakeMemory[keyStr] || 0;
  robotAlreadyRemembered = false;

  if (timesWrong >= 1) {
    robotAlreadyRemembered = true;
    // show a subtle hint that robot knows something - but dont reveal the answer
    let hintMsgs = [
      "I have seen you fail before...",
      "My memory banks are active.",
      "I remember this type of puzzle.",
      "Checking my failure database...",
    ];
    if (timesWrong >= 3) {
      hintMsgs = [
        "Oh. I know your weakness.",
        "I have extensive records on you.",
        "This should be... familiar.",
      ];
    }

    let hintPick = hintMsgs[Math.floor(Math.random() * hintMsgs.length)];
    showRobotMemoryIndicator(hintPick);

    // also flash robot icon orange briefly
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

// =====================================================
// GAME INITIALIZATION
// =====================================================
window.onload = () => {
  console.log(
    "game started... difficulty:",
    localStorage.getItem("gameDifficulty") || "easy",
  );

  // reset all game state for fresh start
  currentRound = 1;
  lives = 3;
  score = 0;
  streak = 0;
  gameHistoryArray = [];
  thisGameMistakes = {};
  mistakeCountThisGame = 0;

  // check if returning player and show memory greeting
  let welcomeBack = getRobotWelcomeBack();
  if (welcomeBack) {
    // small delay so page loads before robot starts talking
    setTimeout(() => {
      showRobotMemoryIndicator(
        "MEMORY LOADED: " + totalGamesPlayed + " games recorded",
      );
      robotSpeak(welcomeBack);
      showNotification("ROBOT REMEMBERS", "memory");
    }, 1200);
  }

  updateHUD();
  fetchNewCase();
};

// =====================================================
// TAUNT SYSTEM
// robot has built-in insults - removed external API
// because the api was not reliable and not related to game theme
// custom list fits much better
// =====================================================
async function getEvilTaunt() {
  const insultList = [
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
  let randIdx = Math.floor(Math.random() * insultList.length);
  return insultList[randIdx];
}

// get taunt that might include memory comment if player has history
async function getEvilTauntWithMemory(wrongAnsNum) {
  // 50% chance robot uses memory based taunt if it has history on this answer
  let memComment = getRobotMemoryComment(wrongAnsNum);

  if (memComment && Math.random() > 0.5) {
    return memComment;
  }

  // otherwise just normal insult
  return await getEvilTaunt();
}

// =====================================================
// UI HELPER FUNCTIONS
// =====================================================

function showNotification(message, type = "success") {
  let notifEl = document.createElement("div");
  notifEl.className = `notification ${type}`;
  notifEl.innerHTML = message;
  document.body.appendChild(notifEl);

  setTimeout(() => {
    notifEl.remove();
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

function animateValue(el) {
  el.classList.add("pulse-value");
  setTimeout(() => el.classList.remove("pulse-value"), 400);
}

// robot voice - uses browser speech synthesis API if enabled
function robotSpeak(textToSay) {
  if (robotIcon) {
    robotIcon.style.transform = "scale(1.1)";
    setTimeout(() => (robotIcon.style.transform = ""), 300);
  }

  // check setting before speaking
  let voiceOn = localStorage.getItem("voiceEnabled") !== "false";
  if (voiceOn && "speechSynthesis" in window) {
    let utterance = new SpeechSynthesisUtterance(textToSay);
    utterance.pitch = 0.8;
    utterance.rate = 1.0;
    window.speechSynthesis.cancel(); // stop any previous speech
    window.speechSynthesis.speak(utterance);
  }
}

// =====================================================
// CORE GAME FUNCTIONS
// =====================================================

// fetch new puzzle from Heart API + yesno API (interoperability)
// Heart API provides the puzzle image and correct answer
// yesno API randomly decides if robot should lie or tell truth
// this is the interoperability part - two external APIs working together
async function fetchNewCase() {
  // stop any running timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  gameIsActive = false;

  // show loading state
  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  if (manualInput) manualInput.value = "";
  if (manualInput) manualInput.classList.remove("error");
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-pulse"></i> Loading the image...';
  document.querySelector(".puzzle-image").classList.add("loading");

  // remove old memory badge when new round starts
  let oldBadge = document.getElementById("memoryBadge");
  if (oldBadge) oldBadge.remove();

  try {
    // INTEROPERABILITY PART 1 - call Heart API to get puzzle
    // this is an external web service we consume using HTTP/JSON
    let heartResponse = await fetch(
      "https://marcconrad.com/uob/heart/api.php?out=json",
    );
    let heartData = await heartResponse.json();

    // INTEROPERABILITY PART 2 - call yesno API to decide robot lie/truth
    // this is a second external API - shows interoperability with multiple services
    let yesnoResponse = await fetch("https://yesno.wtf/api");
    let yesnoData = await yesnoResponse.json();

    actualTrueAnswer = heartData.solution; // save real answer

    if (yesnoData.answer === "yes") {
      // robot tells truth
      isAiLying = false;
      aiClaimedAnswer = actualTrueAnswer;
    } else {
      // robot lies - add or subtract a small offset from real answer
      isAiLying = true;
      let offset = Math.floor(Math.random() * 2) + 1;
      if (Math.random() > 0.5) {
        aiClaimedAnswer = actualTrueAnswer + offset;
      } else {
        aiClaimedAnswer = actualTrueAnswer - offset;
      }
      // dont let claimed answer go negative
      if (aiClaimedAnswer < 0) aiClaimedAnswer = actualTrueAnswer + 1;
    }

    // wait for image to fully load before showing robot answer or starting timer
    // this is an EVENT - image onload is a DOM event
    apiImage.onload = function () {
      apiImage.style.display = "block";
      loadingState.style.display = "none";
      document.querySelector(".puzzle-image").classList.remove("loading");

      animateValue(suspectAnswerDisplay);
      suspectAnswerDisplay.innerText = aiClaimedAnswer;

      // random confidence percentage (visual only - doesnt affect gameplay)
      let randConf = Math.floor(Math.random() * 30) + 65;
      confValue.innerText = randConf + "%";
      confFill.style.width = randConf + "%";

      feedbackText.innerHTML =
        '<i class="fas fa-microphone"></i> Interrogation active. Make your choice.';

      // MEMORY FEATURE: after small delay check if player struggled with this answer before
      setTimeout(() => {
        checkAndShowMemoryWarning(actualTrueAnswer);
      }, 800);

      robotSpeak(`I have analyzed the data. The answer is ${aiClaimedAnswer}.`);

      gameIsActive = true;
      startTimer(); // start countdown timer (event-driven - triggers events on tick)
    };

    // if image fails to load, retry
    apiImage.onerror = function () {
      console.log("image failed to load, retrying...");
      fetchNewCase();
    };

    // set the image src to start loading
    apiImage.src = heartData.question;
  } catch (err) {
    console.error("api fetch error:", err);
    feedbackText.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#ff4d4d;"></i> ERROR: Cannot connect to server';
    document.querySelector(".puzzle-image").classList.remove("loading");

    // retry after 3 seconds if something went wrong
    setTimeout(() => {
      if (!gameIsActive) fetchNewCase();
    }, 3000);
  }
}

// =====================================================
// TIMER - EVENT DRIVEN PROGRAMMING
// setInterval fires events every 1 second
// each tick is an event that can trigger other events
// (warning style, heartbeat sound, timeout)
// =====================================================
function startTimer() {
  timeRemaining = getDifficultyTimer();
  timerText.innerText = timeRemaining;
  timerCircle.classList.remove("warning");
  gameBody.classList.remove("stress-pulse-active");

  // reset heartbeat sound
  let hbSound = document.getElementById("hSound");
  hbSound.pause();
  hbSound.currentTime = 0;

  if (timerInterval) clearInterval(timerInterval);

  // this interval is the main timer event source
  // every 1000ms (1 second) it fires and can trigger other events
  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    // EVENT: when time <= 5, trigger heartbeat audio event
    let soundOn = localStorage.getItem("soundEnabled") !== "false";
    if (timeRemaining <= 5 && timeRemaining > 0 && soundOn) {
      if (hbSound.paused) {
        hbSound
          .play()
          .catch((e) => console.log("browser blocked audio autoplay"));
      }
    }

    // EVENT: when time <= 3, trigger visual stress event
    if (timeRemaining <= 3) {
      timerCircle.classList.add("warning");
      gameBody.classList.add("stress-pulse-active");
    }

    // EVENT: when time = 0, trigger timeout event
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      hbSound.pause();
      gameBody.classList.remove("stress-pulse-active");
      handleTimeOut(); // this is triggered by the timer event
    }
  }, 1000);
}

// handles when timer runs out - player too slow
async function handleTimeOut() {
  if (!gameIsActive) return;
  gameIsActive = false;

  flashScreen("wrong");
  showNotification("TIME OUT!", "error");

  // record this as a mistake in robot memory
  saveMistakeToMemory(actualTrueAnswer);

  // get a robot taunt (with memory reference if applicable)
  let tauntMsg = await getEvilTauntWithMemory(actualTrueAnswer);

  // if player has history with this answer, add memory log text
  let wrongCntForThis = robotMistakeMemory[String(actualTrueAnswer)] || 0;
  let memLogExtra = "";
  if (wrongCntForThis >= 2) {
    memLogExtra = `<span class="memory-log-text"><i class="fas fa-database"></i> MEMORY LOG: You have failed on answer "${actualTrueAnswer}" ${wrongCntForThis} time(s) across all games.</span>`;
  }

  robotSpeak(tauntMsg);
  feedbackText.innerHTML = `<i class="fas fa-hourglass-end"></i> TIME OUT! You lost a life.<br><span class="taunt-text">AI: "${tauntMsg}"</span>${memLogExtra}`;
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

  loseLife(6000); // wait 6 sec so robot can finish talking
}

// =====================================================
// PLAYER DECISIONS - EVENT HANDLERS
// trustSuspect and showVerifyInput are called from onclick in HTML
// these are event handlers - they respond to user click events
// =====================================================

// EVENT HANDLER: player clicked TRUST button
async function trustSuspect(event) {
  if (!gameIsActive) return;
  gameIsActive = false;

  // stop timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  document.getElementById("hSound").pause();
  gameBody.classList.remove("stress-pulse-active");

  let wonThisRound = false;
  let pointLabel = "";

  if (isAiLying === false) {
    // CORRECT - ai told truth and player trusted it
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
    pointLabel = "+20";

    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: isAiLying,
      isWin: wonThisRound,
      points: pointLabel,
    });

    updateHUD();
    setTimeout(() => nextRound(), 2000);
  } else {
    // WRONG - ai lied, player shouldve not trusted
    flashScreen("wrong");
    showNotification("AI LIED!", "error");
    wonThisRound = false;
    pointLabel = "-Life";

    // save mistake to robot memory
    saveMistakeToMemory(actualTrueAnswer);

    // get taunt (might use memory)
    let taunt = await getEvilTauntWithMemory(actualTrueAnswer);

    // add memory log text if player wrong on this answer before
    let wrongTimesHere = robotMistakeMemory[String(actualTrueAnswer)] || 0;
    let memExtra = "";
    if (wrongTimesHere >= 2) {
      memExtra = `<span class="memory-log-text"><i class="fas fa-database"></i> MEMORY LOG: Failure on "${actualTrueAnswer}" recorded ${wrongTimesHere} time(s).</span>`;
    }

    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> FOOL! AI lied. Real answer was ${actualTrueAnswer}. <br><span class="taunt-text">AI: "${taunt}"</span>${memExtra}`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Ha ha ha. " + taunt);

    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: isAiLying,
      isWin: wonThisRound,
      points: pointLabel,
    });

    loseLife(6000);
  }
}

// EVENT HANDLER: player clicked VERIFY button - toggle the input box
function showVerifyInput(event) {
  if (!gameIsActive) return;
  // toggle show/hide verify input box
  if (verifyBox.style.display === "none" || verifyBox.style.display === "") {
    verifyBox.style.display = "flex";
    manualInput.focus(); // auto focus input so player can type straight away
  } else {
    verifyBox.style.display = "none";
  }
}

// EVENT HANDLER: player clicked submit on verify input
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

  document.getElementById("hSound").pause();
  gameBody.classList.remove("stress-pulse-active");
  verifyBox.style.display = "none";

  // SUSPENSE EVENT - show checking animation before revealing result
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Analyzing evidence database...';
  feedbackText.style.color = "var(--cream)";

  let drumSnd = document.getElementById("drumSound");
  let sndOn = localStorage.getItem("soundEnabled") !== "false";
  if (sndOn) {
    drumSnd.currentTime = 0;
    drumSnd.play().catch((e) => console.log("audio block"));
  }

  // wait 1.5 seconds to build tension before checking
  // this is an event triggered by player clicking submit
  setTimeout(async () => {
    drumSnd.pause();
    let wonRound = false;
    let ptsLabel = "";

    if (playerGuess === actualTrueAnswer) {
      // CORRECT verification
      score += 10; // less points than trust becuase no risk
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
      wonRound = true;
      ptsLabel = "+10";

      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + playerGuess + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: wonRound,
        points: ptsLabel,
      });

      updateHUD();
      setTimeout(() => nextRound(), 2000);
    } else {
      // WRONG verification - player counted wrong
      flashScreen("wrong");
      showNotification("WRONG ANSWER!", "error");
      wonRound = false;
      ptsLabel = "-Life";

      saveMistakeToMemory(actualTrueAnswer);

      let taunt2 = await getEvilTauntWithMemory(actualTrueAnswer);

      // memory log extra text
      let wrongTimesHere2 = robotMistakeMemory[String(actualTrueAnswer)] || 0;
      let memExtra2 = "";
      if (wrongTimesHere2 >= 2) {
        memExtra2 = `<span class="memory-log-text"><i class="fas fa-database"></i> MEMORY LOG: Answer "${actualTrueAnswer}" failed ${wrongTimesHere2} time(s) in your history.</span>`;
      }

      robotSpeak("Wrong. " + taunt2);
      feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> WRONG! Real answer was ${actualTrueAnswer}.<br><span class="taunt-text">AI: "${taunt2}"</span>${memExtra2}`;
      feedbackText.style.color = "#ff4d4d";

      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + playerGuess + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: wonRound,
        points: ptsLabel,
      });

      loseLife(6000);
    }
  }, 1500); // end suspense timeout
}

// remove a life and either go to next round or game over
// waitTime parameter lets robot finish talking before continuing
function loseLife(waitTime) {
  if (!waitTime) waitTime = 2500;

  lives--;
  streak = 0; // reset streak on wrong

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
    // all 10 rounds done - game complete
    showNotification("GAME COMPLETE!", "success");
    setTimeout(() => {
      saveGameToDB();
    }, 1500);
  } else {
    updateHUD();
    fetchNewCase();
  }
}

// update the HUD display at top of screen
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

// save game results to localstorage and optionally to database
// then redirect to results page
// IMPORTANT: redirect is in finally block so it ALWAYS runs
// even if server save fails or network error happens
async function saveGameToDB() {
  // calculate accuracy
  let correctAns = 0;
  for (let i = 0; i < gameHistoryArray.length; i++) {
    if (gameHistoryArray[i].isWin) correctAns++;
  }
  let accuracyCalc =
    Math.round((correctAns / gameHistoryArray.length) * 100) || 0;

  // save all results to localstorage FIRST before anything else
  // results.js reads these when results page loads
  localStorage.setItem(
    "interrogationHistory",
    JSON.stringify(gameHistoryArray),
  );
  localStorage.setItem("finalGameScore", score);
  localStorage.setItem("finalLives", lives);
  localStorage.setItem("finalAccuracy", accuracyCalc);
  localStorage.setItem("roundsPlayed", gameHistoryArray.length);

  // update robot memory stats across games
  totalGamesPlayed = totalGamesPlayed + 1;
  localStorage.setItem("totalGamesPlayed", totalGamesPlayed);
  localStorage.setItem(
    "robotMistakeMemory",
    JSON.stringify(robotMistakeMemory),
  );
  localStorage.setItem("lastGameMistakes", JSON.stringify(thisGameMistakes));

  // try to save to server database if user is logged in
  // JWT token in cookie proves user identity - this is virtual identity
  let jwtToken = getCookie("authToken");

  if (jwtToken && jwtToken !== "") {
    try {
      let saveRes = await fetch("http://localhost:3000/api/save-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + jwtToken, // JWT token authenticates the user
        },
        // we dont put userId in body - server gets it safely from the token
        body: JSON.stringify({
          score: score,
          livesLeft: lives,
          rounds: gameHistoryArray.length,
          accuracy: accuracyCalc,
        }),
      });

      if (saveRes.ok) {
        console.log("game saved securely to database");
      } else {
        console.log("save game failed - token might be expired");
      }
    } catch (err) {
      // network error or server down - just log and continue
      // game data is already in localstorage so results page will still work
      console.log("could not save to server, continuing to results:", err);
    }
  }

  // always redirect to results page - even if server save failed
  // localstorage data is already set so results page will load fine
  window.location.href = "results.html";
}
