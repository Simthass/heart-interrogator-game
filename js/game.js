function getCookie(name) {
  let match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
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
