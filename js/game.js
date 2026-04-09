// main game orchestrator - ties all the game modules together
// this file only contains the round flow and decision handlers
// everything else has been separated:
//   gameState.js  - variables
//   gameUI.js     - dom updates
//   gameTimer.js  - countdown + difficulty mechanics
//   gameAPI.js    - external api calls (heart api + yesno api)
//   gameAudio.js  - robot voice + sound effects
//   gameRank.js   - rank level from db
//   gameSave.js   - saving results

window.onload = () => {
  currentRound = 1;
  lives = 3;
  score = 0;
  streak = 0;
  gameHistoryArray = [];

  updateHUD();

  // load rank from db first, then start the first round
  // rank affects the timer so we need it before fetchNewCase runs
  setBadgeLevel().then(() => {
    fetchNewCase();
  });
};

// fetches a new round from the heart api and sets up the board
async function fetchNewCase() {
  stopTimer();
  gameIsActive = false;

  // reset mechanic flags for the new round
  isSwitchedNow = false;
  isBlackoutDone = false;

  // put trust/verify cards back in original order
  let trustCard = document.getElementById("trustCardBox");
  let verifyCard = document.getElementById("verifyCardBox");
  if (trustCard) trustCard.style.order = "1";
  if (verifyCard) verifyCard.style.order = "2";

  resetEvidencePanel();

  // hide confidence meter at master rank (8+) - mechanic 4: classified data
  updateConfidenceMeter(userRankLevel < 8);

  try {
    let { heartData, yesnoData } = await fetchRoundData();

    actualTrueAnswer = heartData.solution;

    let { lying, claimed } = calculateAiAnswer(
      actualTrueAnswer,
      yesnoData.answer,
    );
    isAiLying = lying;
    aiClaimedAnswer = claimed;

    // wait for the image to finish loading before starting the timer
    // apiImage.onload is the event that kicks off the round
    apiImage.onload = function () {
      apiImage.style.display = "block";
      loadingState.style.display = "none";

      let confPercent = Math.floor(Math.random() * 30) + 65;
      displaySuspectClaim(aiClaimedAnswer, confPercent);
      robotSpeak(
        "I have analyzed the data. The answer is " + aiClaimedAnswer + ".",
      );

      // mechanic 3: blackout event - image goes black briefly at deputy rank (7+)
      if (userRankLevel >= 7) {
        let delay = Math.floor(Math.random() * 2000) + 1000;
        setTimeout(() => {
          if (gameIsActive) {
            apiImage.style.filter = "brightness(0)";
            setTimeout(() => (apiImage.style.filter = "none"), 500);
          }
        }, delay);
      }

      gameIsActive = true;
      startTimer();
    };

    apiImage.src = heartData.question;
  } catch (err) {
    console.log("api error:", err);
    feedbackText.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#ff4d4d;"></i> ERROR: Could not connect to Heart API';

    // try again after 3 seconds if the round never started
    setTimeout(() => {
      if (!gameIsActive) fetchNewCase();
    }, 3000);
  }
}

// --- PLAYER DECISIONS ---

// player chose to trust the ai's answer
async function trustSuspect() {
  if (!gameIsActive) return;
  gameIsActive = false;
  stopTimer();

  if (!isAiLying) {
    score += 20;
    streak++;
    animateValue(scoreValue);
    animateValue(streakValue);

    feedbackText.innerHTML =
      '<i class="fas fa-check-circle" style="color:#39ff14;"></i> CORRECT! AI told the truth. +20 POINTS';
    feedbackText.style.color = "#39ff14";
    flashScreen("correct");
    showNotification("+20 POINTS!", "success");
    robotSpeak("Thank you for trusting me.");

    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: false,
      isWin: true,
      points: "+20",
    });

    updateHUD();
    setTimeout(() => nextRound(), 2000);
  } else {
    flashScreen("wrong");
    showNotification("AI LIED!", "error");
    saveMistakeToMemory(actualTrueAnswer);

    let taunt = getRandomTaunt();
    feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> FOOL! AI lied. Real answer was ${actualTrueAnswer}.<br><span class="taunt-text">AI: "${taunt}"</span>`;
    feedbackText.style.color = "#ff4d4d";
    robotSpeak("Ha ha ha. " + taunt);

    gameHistoryArray.push({
      round: currentRound,
      decision: "TRUST",
      aiSaid: aiClaimedAnswer,
      realAnswer: actualTrueAnswer,
      aiLied: true,
      isWin: false,
      points: "-Life",
    });

    loseLife(4000);
  }
}

// toggles the manual input box for verify
function showVerifyInput() {
  if (!gameIsActive) return;
  if (verifyBox.style.display === "none" || verifyBox.style.display === "") {
    verifyBox.style.display = "flex";
    manualInput.focus();
  } else {
    verifyBox.style.display = "none";
  }
}

// player chose to verify and submitted their own count
function submitVerification() {
  if (!gameIsActive) return;

  let guess = parseInt(manualInput.value);

  if (isNaN(guess)) {
    manualInput.classList.add("error");
    setTimeout(() => manualInput.classList.remove("error"), 500);
    alert("please type a number");
    return;
  }

  gameIsActive = false;
  stopTimer();
  verifyBox.style.display = "none";

  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Analyzing evidence...';
  feedbackText.style.color = "var(--cream)";

  let drum = playDrumRoll();

  // slight delay for dramatic effect while drum plays
  setTimeout(async () => {
    if (drum) drum.pause();

    if (guess === actualTrueAnswer) {
      score += 10;
      streak++;
      animateValue(scoreValue);
      animateValue(streakValue);

      feedbackText.innerHTML =
        '<i class="fas fa-check-circle" style="color:#39ff14;"></i> VERIFIED! Correct answer. +10 POINTS';
      feedbackText.style.color = "#39ff14";
      flashScreen("correct");
      showNotification("+10 POINTS!", "success");

      if (isAiLying) robotSpeak("You caught my deception.");
      else robotSpeak("I told you I was right.");

      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + guess + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: true,
        points: "+10",
      });

      updateHUD();
      setTimeout(() => nextRound(), 2000);
    } else {
      flashScreen("wrong");
      showNotification("WRONG ANSWER!", "error");
      saveMistakeToMemory(actualTrueAnswer);

      let taunt = getRandomTaunt();
      feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> WRONG! Real answer was ${actualTrueAnswer}.<br><span class="taunt-text">AI: "${taunt}"</span>`;
      feedbackText.style.color = "#ff4d4d";
      robotSpeak("Wrong. " + taunt);

      gameHistoryArray.push({
        round: currentRound,
        decision: "VERIFY (" + guess + ")",
        aiSaid: aiClaimedAnswer,
        realAnswer: actualTrueAnswer,
        aiLied: isAiLying,
        isWin: false,
        points: "-Life",
      });

      loseLife(4000);
    }
  }, 1500);
}

// --- ROUND FLOW ---

async function handleTimeOut() {
  if (!gameIsActive) return;
  gameIsActive = false;

  flashScreen("wrong");
  showNotification("TIME OUT!", "error");
  saveMistakeToMemory(actualTrueAnswer);

  let taunt = getRandomTaunt();
  robotSpeak(taunt);
  feedbackText.innerHTML = `<i class="fas fa-hourglass-end"></i> TIME OUT! You lost a life.<br><span class="taunt-text">AI: "${taunt}"</span>`;
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

function loseLife(delay) {
  lives--;
  streak = 0;
  animateValue(livesDisplay);
  animateLivesLost();
  updateHUD();

  if (lives <= 0) setTimeout(() => gameOver(), delay);
  else setTimeout(() => nextRound(), delay);
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

function gameOver() {
  showNotification("GAME OVER", "error");
  setTimeout(() => saveGameToDB(), 1500);
}
