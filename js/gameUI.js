// everything that touches the DOM during a game
// notifications, screen flashes, HUD updates, value animations
// separated from game logic so the two concerns dont mix

// grab the elements once at load time
let timerText = document.getElementById("timerText");
let timerCircle = document.getElementById("timerCircle");
let scoreValue = document.getElementById("scoreValue");
let streakValue = document.getElementById("streakValue");
let livesDisplay = document.getElementById("livesDisplay");
let currentRoundDisplay = document.getElementById("currentRound");
let suspectAnswerDisplay = document.getElementById("suspectAnswer");
let confValue = document.getElementById("confValue");
let confFill = document.getElementById("confFill");
let apiImage = document.getElementById("apiImage");
let loadingState = document.getElementById("loadingState");
let feedbackText = document.getElementById("feedbackText");
let manualInput = document.getElementById("manualInput");
let verifyBox = document.getElementById("verifyBox");
let robotIcon = document.querySelector(".robot-icon i");
let gameBody = document.querySelector(".game-body");

function updateHUD() {
  scoreValue.innerText = score;
  streakValue.innerText = streak;
  currentRoundDisplay.innerText = currentRound;
  livesDisplay.innerText = lives;
  animateValue(currentRoundDisplay);
}

// brief pop animation when a value changes in the hud
function animateValue(el) {
  el.classList.add("pulse-value");
  setTimeout(() => el.classList.remove("pulse-value"), 400);
}

// green flash = correct, red flash = wrong
function flashScreen(type) {
  if (type === "correct") {
    gameBody.classList.add("flash-correct");
    setTimeout(() => gameBody.classList.remove("flash-correct"), 400);
  } else {
    gameBody.classList.add("flash-wrong");
    setTimeout(() => gameBody.classList.remove("flash-wrong"), 400);
  }
}

// big centred notification that fades out after 1 second
function showNotification(message, type) {
  type = type || "success";
  let el = document.createElement("div");
  el.className = "notification " + type;
  el.innerHTML = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// the robot icon does a quick scale when it speaks
function animateRobotSpeak() {
  if (robotIcon) {
    robotIcon.style.transform = "scale(1.1)";
    setTimeout(() => (robotIcon.style.transform = ""), 300);
  }
}

// resets the evidence panel back to loading state for next round
function resetEvidencePanel() {
  apiImage.style.display = "none";
  loadingState.style.display = "block";
  suspectAnswerDisplay.innerText = "?";
  verifyBox.style.display = "none";
  if (manualInput) manualInput.value = "";
  feedbackText.innerHTML =
    '<i class="fas fa-spinner fa-pulse"></i> Loading the image...';
  feedbackText.style.color = "";
}

// shows or hides the confidence meter depending on rank
function updateConfidenceMeter(visible) {
  let meterBox = document.getElementById("meterBoxDiv");
  if (meterBox) {
    meterBox.style.visibility = visible ? "visible" : "hidden";
  }
}

// fills in the suspect panel once the api responds
function displaySuspectClaim(claimed, confPercent) {
  animateValue(suspectAnswerDisplay);
  suspectAnswerDisplay.innerText = claimed;
  confValue.innerText = confPercent + "%";
  confFill.style.width = confPercent + "%";
  feedbackText.innerHTML =
    '<i class="fas fa-microphone"></i> Interrogation active. Make your choice.';
}

// shake the hearts icon when a life is lost
function animateLivesLost() {
  let livesIcon = document.querySelector(".lives-count i");
  if (livesIcon) {
    livesIcon.style.animation = "shake 0.3s";
    setTimeout(() => (livesIcon.style.animation = ""), 300);
  }
}
