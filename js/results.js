// reads game data from localstorage and builds the results page
// game.js writes to localstorage at the end of each session
// and then redirects here

document.addEventListener("DOMContentLoaded", function () {
  loadResultsData();
});

function loadResultsData() {
  let saved = localStorage.getItem("interrogationHistory");
  let finalScore = localStorage.getItem("finalGameScore") || "0";
  let finalLives = localStorage.getItem("finalLives") || "0";

  if (!saved || saved === "[]" || saved === "null") {
    let sub = document.getElementById("resultSubtitle");
    let sc = document.getElementById("finalScoreText");
    if (sub) sub.innerText = "NO DATA - PLAY A GAME FIRST";
    if (sc) sc.innerText = "0 POINTS";
    return;
  }

  let history = JSON.parse(saved);
  let tbody = document.getElementById("resultsTableBody");
  if (tbody) tbody.innerHTML = "";

  let correct = 0;
  let trustCnt = 0;
  let verifyCnt = 0;
  let aiLies = 0;

  for (let i = 0; i < history.length; i++) {
    let r = history[i];
    if (r.decision.includes("TRUST")) trustCnt++;
    if (r.decision.includes("VERIFY")) verifyCnt++;
    if (r.isWin) correct++;
    if (r.aiLied) aiLies++;

    if (!tbody) continue;

    let row = document.createElement("tr");
    row.className = r.isWin ? "correct-row" : "wrong-row";

    let aiIcon = r.aiLied
      ? '<i class="fas fa-times" style="color:#ff4d4d;"></i>'
      : '<i class="fas fa-check" style="color:#39ff14;"></i>';

    row.innerHTML = `
      <td>Q${r.round}</td>
      <td>${r.decision}</td>
      <td>${r.aiSaid}</td>
      <td>${r.realAnswer} ${aiIcon}</td>
      <td class="${r.isWin ? "points-positive" : "points-negative"}">${r.points}</td>
    `;
    tbody.appendChild(row);
  }

  let scoreEl = document.getElementById("finalScoreText");
  if (scoreEl) scoreEl.innerText = finalScore + " POINTS";

  let accCalc =
    history.length > 0 ? Math.round((correct / history.length) * 100) : 0;
  let accEl = document.getElementById("accRate");
  if (accEl)
    accEl.innerText = correct + "/" + history.length + " (" + accCalc + "%)";

  let trustEl = document.getElementById("trustCount");
  if (trustEl) trustEl.innerText = trustCnt;

  let verifyEl = document.getElementById("verifyCount");
  if (verifyEl) verifyEl.innerText = verifyCnt;

  // show remaining lives as heart emojis
  let livesEl = document.getElementById("finalLives");
  if (livesEl) {
    let n = parseInt(finalLives);
    if (n <= 0) {
      livesEl.innerText = "💀 TERMINATED";
    } else {
      livesEl.innerText = "❤️ ".repeat(n).trim();
    }
  }

  let lieEl = document.getElementById("aiLieRate");
  if (lieEl)
    lieEl.innerHTML = `<i class="fas fa-robot"></i> AI lied on ${aiLies}/${history.length} questions.`;

  let livesNum = parseInt(finalLives);
  let statusIcon = document.getElementById("statusIcon");
  let perfName = document.getElementById("perfName");
  let perfDesc = document.getElementById("perfDesc");
  let sysNote = document.getElementById("sysNote");
  let subtitle = document.getElementById("resultSubtitle");

  if (livesNum > 0) {
    if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-trophy"></i>';
    if (perfName) perfName.innerText = "Surviving Agent";
    if (perfDesc)
      perfDesc.innerText = "You survived the interrogation session.";
    if (sysNote) sysNote.innerText = "Great job detective!";
    if (subtitle) subtitle.innerText = "MISSION COMPLETE";
  } else {
    if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-skull"></i>';
    if (perfName) perfName.innerText = "Failed Agent";
    if (perfDesc) perfDesc.innerText = "You lost all lives.";
    if (subtitle) subtitle.innerText = "AGENT TERMINATED";
    if (sysNote) sysNote.innerText = "More training required.";
  }

  animateTableRows();
}

// rows fade in one by one with a slight delay between each
function animateTableRows() {
  let rows = document.querySelectorAll("tbody tr");
  for (let i = 0; i < rows.length; i++) {
    rows[i].style.opacity = "0";
    (function (row, delay) {
      setTimeout(function () {
        row.style.transition = "opacity 0.3s";
        row.style.opacity = "1";
      }, delay);
    })(rows[i], 50 * i);
  }
}

function playAgain() {
  localStorage.removeItem("interrogationHistory");
  localStorage.removeItem("finalGameScore");
  localStorage.removeItem("finalLives");
  localStorage.removeItem("finalAccuracy");
  localStorage.removeItem("roundsPlayed");
  window.location.href = "game.html";
}

function goToDashboard() {
  window.location.href = "index.html";
}
