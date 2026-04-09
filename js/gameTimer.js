// manages the countdown timer for each round
// this is an event-driven component - the setInterval callback fires
// every second and updates game state + UI
//
// it also triggers difficulty mechanics:
// - switcheroo: swaps button order at 5 seconds (rank 3+)
// - stress pulse: red screen effect at 3 seconds
// - timeout: calls handleTimeOut() when it hits 0

// timer goes down by 1 second based on rank level
// rank 0 = 12 sec, rank 9 = 3 sec (minimum)
function getDifficultyTimer() {
  let t = 12 - userRankLevel;
  if (t < 3) t = 3;
  return t;
}

function startTimer() {
  timeRemaining = getDifficultyTimer();
  timerText.innerText = timeRemaining;
  timerCircle.classList.remove("warning");
  gameBody.classList.remove("stress-pulse-active");

  if (timerInterval) clearInterval(timerInterval);

  // this is the core event loop of the game - fires every 1000ms
  // each tick is an event that can trigger different responses
  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.innerText = timeRemaining;

    // mechanic 1 - switcheroo: swap trust/verify cards at 5 sec
    // only for senior detective rank (3) and above
    // messes with the muscle memory of the player
    if (timeRemaining <= 5 && userRankLevel >= 3 && !isSwitchedNow) {
      let trustCard = document.getElementById("trustCardBox");
      let verifyCard = document.getElementById("verifyCardBox");
      if (trustCard && verifyCard) {
        trustCard.style.order = "2";
        verifyCard.style.order = "1";
        showNotification("UI TAMPERED!", "error");
      }
      isSwitchedNow = true;
    }

    // visual stress cue at 3 seconds
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

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameBody.classList.remove("stress-pulse-active");
}
