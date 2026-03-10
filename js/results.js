document.addEventListener("DOMContentLoaded", function () {
  console.log("loading results data...");

  loadResultsData();
});

function loadResultsData() {
  let savedData = localStorage.getItem("interrogationHistory");
  let finalScore = localStorage.getItem("finalGameScore") || "0";
  let finalLives = localStorage.getItem("finalLives") || "0";
  let finalAccuracy = localStorage.getItem("finalAccuracy") || "0";
  let roundsPlayed = localStorage.getItem("roundsPlayed") || "0";

  if (!savedData || savedData === "[]" || savedData === "null") {
    console.log("no game data found");
    document.getElementById("resultSubtitle").innerText =
      "NO DATA - PLAY GAME FIRST";
    document.getElementById("finalScoreText").innerText = "0 POINTS";
    return;
  }

  let historyArray = JSON.parse(savedData);
  let tableBody = document.getElementById("resultsTableBody");
  tableBody.innerHTML = "";

  let correctCount = 0;
  let trustCount = 0;
  let verifyCount = 0;
  let aiLiesCount = 0;

  for (let i = 0; i < historyArray.length; i++) {
    let roundData = historyArray[i];

    if (roundData.decision.includes("TRUST")) trustCount++;
    if (roundData.decision.includes("VERIFY")) verifyCount++;
    if (roundData.isWin) correctCount++;
    if (roundData.aiLied) aiLiesCount++;

    let tr = document.createElement("tr");
    tr.className = roundData.isWin ? "correct-row" : "wrong-row";

    let aiIcon = roundData.aiLied
      ? '<i class="fas fa-times" style="color:#ff4d4d;"></i>'
      : '<i class="fas fa-check" style="color:#39ff14;"></i>';

    tr.innerHTML = `
      <td>Q${roundData.round}</td>
      <td>${roundData.decision}</td>
      <td>${roundData.aiSaid}</td>
      <td>${roundData.realAnswer} ${aiIcon}</td>
      <td class="${roundData.isWin ? "points-positive" : "points-negative"}">${roundData.points}</td>
    `;

    tableBody.appendChild(tr);
  }

  // update summary
  document.getElementById("finalScoreText").innerText = finalScore + " POINTS";

  let mathAcc = 0;
  if (historyArray.length > 0) {
    mathAcc = Math.round((correctCount / historyArray.length) * 100);
  }
  document.getElementById("accRate").innerText =
    correctCount + "/" + historyArray.length + " (" + mathAcc + "%)";

  document.getElementById("trustCount").innerText = trustCount;
  document.getElementById("verifyCount").innerText = verifyCount;

  let heartString = "";
  for (let x = 0; x < parseInt(finalLives); x++) {
    heartString += "❤️ ";
  }
  if (finalLives <= 0 || finalLives === "0") {
    heartString = "💀 TERMINATED";
  }
  document.getElementById("finalLives").innerText = heartString;

  document.getElementById("aiLieRate").innerHTML =
    `<i class="fas fa-robot"></i> AI lied on ${aiLiesCount}/${historyArray.length} questions.`;

  if (finalLives > 0) {
    document.getElementById("statusIcon").innerHTML =
      '<i class="fas fa-trophy"></i>';
    document.getElementById("perfName").innerText = "Surviving Agent";
    document.getElementById("perfDesc").innerText =
      "You survived the interrogation.";
    document.getElementById("sysNote").innerText = "Great job detective!";
  } else {
    document.getElementById("statusIcon").innerHTML =
      '<i class="fas fa-skull"></i>';
    document.getElementById("perfName").innerText = "Failed Agent";
    document.getElementById("perfDesc").innerText = "You lost all lives.";
    document.getElementById("resultSubtitle").innerText = "AGENT TERMINATED";
    document.getElementById("sysNote").innerText = "More training needed.";
  }

  // animation
  let rows = document.querySelectorAll("tbody tr");
  for (let r = 0; r < rows.length; r++) {
    rows[r].style.opacity = "0";
    setTimeout(function () {
      rows[r].style.transition = "opacity 0.3s";
      rows[r].style.opacity = "1";
    }, 50 * r);
  }
}

function playAgain() {
  window.location.href = "game.html";
}

function goToDashboard() {
  window.location.href = "index.html";
}
