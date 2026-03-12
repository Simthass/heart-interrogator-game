// =====================================================
// results.js - reads game data from localstorage and
// shows the results/summary after game ends
// game.js saves everything to localstorage, this reads it
// CIS045-3 Distributed Service Architectures
// Student: Simthass Mohammed (2540927)
// =====================================================

// this runs when results page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("results.js loaded - loading game results from localstorage...");
  loadResultsData();
  loadRobotMemorySummary(); // also show the robot memory log if it exist
});

// main function - reads data saved by game.js and shows it on screen
function loadResultsData() {
  // get all the game data from localstorage
  let savedRounds = localStorage.getItem("interrogationHistory");
  let finalScr = localStorage.getItem("finalGameScore") || "0";
  let finalLvs = localStorage.getItem("finalLives") || "0";
  let finalAcc = localStorage.getItem("finalAccuracy") || "0";
  let totalRnds = localStorage.getItem("roundsPlayed") || "0";

  // if nothing saved (player came here directly without playing), show empty message
  if (!savedRounds || savedRounds === "[]" || savedRounds === "null") {
    console.log("no game data found in localstorage");
    let subTitleEl = document.getElementById("resultSubtitle");
    let scoreEl = document.getElementById("finalScoreText");
    if (subTitleEl) subTitleEl.innerText = "NO DATA - PLAY A GAME FIRST";
    if (scoreEl) scoreEl.innerText = "0 POINTS";
    return;
  }

  let histData = JSON.parse(savedRounds);
  let tableBodyEl = document.getElementById("resultsTableBody");

  if (tableBodyEl) tableBodyEl.innerHTML = ""; // clear old rows

  // counters to build summary stats
  let correctCnt = 0;
  let trustCnt = 0;
  let verifyCnt = 0;
  let aiLieCnt = 0;

  // loop each round and build a table row for it
  for (let i = 0; i < histData.length; i++) {
    let rd = histData[i];

    // count for summary section
    if (rd.decision.includes("TRUST")) trustCnt++;
    if (rd.decision.includes("VERIFY")) verifyCnt++;
    if (rd.isWin) correctCnt++;
    if (rd.aiLied) aiLieCnt++;

    if (!tableBodyEl) continue; // no table on page, skip building rows

    let rowEl = document.createElement("tr");
    rowEl.className = rd.isWin ? "correct-row" : "wrong-row";

    // different icon depending on whether ai lied or told truth
    let aiStatusIcon = rd.aiLied
      ? '<i class="fas fa-times" style="color:#ff4d4d;"></i>'
      : '<i class="fas fa-check" style="color:#39ff14;"></i>';

    rowEl.innerHTML = `
      <td>Q${rd.round}</td>
      <td>${rd.decision}</td>
      <td>${rd.aiSaid}</td>
      <td>${rd.realAnswer} ${aiStatusIcon}</td>
      <td class="${rd.isWin ? "points-positive" : "points-negative"}">${rd.points}</td>
    `;

    tableBodyEl.appendChild(rowEl);
  }

  // --- update summary stats section ---

  let scoreDisp = document.getElementById("finalScoreText");
  if (scoreDisp) scoreDisp.innerText = finalScr + " POINTS";

  // calculate accuracy from actual results array (more accurate than stored value)
  let accCalc = 0;
  if (histData.length > 0) {
    accCalc = Math.round((correctCnt / histData.length) * 100);
  }
  let accEl = document.getElementById("accRate");
  if (accEl)
    accEl.innerText =
      correctCnt + "/" + histData.length + " (" + accCalc + "%)";

  let trustCntEl = document.getElementById("trustCount");
  if (trustCntEl) trustCntEl.innerText = trustCnt;

  let verifyCntEl = document.getElementById("verifyCount");
  if (verifyCntEl) verifyCntEl.innerText = verifyCnt;

  // lives remaining - show heart emojis
  let livesEl = document.getElementById("finalLives");
  if (livesEl) {
    let heartDisplay = "";
    let livesNum = parseInt(finalLvs);
    for (let x = 0; x < livesNum; x++) {
      heartDisplay += "❤️ ";
    }
    if (livesNum <= 0) {
      heartDisplay = "💀 TERMINATED";
    }
    livesEl.innerText = heartDisplay;
  }

  // AI lie rate text
  let lieRateEl = document.getElementById("aiLieRate");
  if (lieRateEl) {
    lieRateEl.innerHTML = `<i class="fas fa-robot"></i> AI lied on ${aiLieCnt}/${histData.length} questions.`;
  }

  // --- show win or lose status panel ---
  let livesLeftNum = parseInt(finalLvs);

  let statusIconEl = document.getElementById("statusIcon");
  let perfNameEl = document.getElementById("perfName");
  let perfDescEl = document.getElementById("perfDesc");
  let sysNoteEl = document.getElementById("sysNote");
  let subtitleEl = document.getElementById("resultSubtitle");

  if (livesLeftNum > 0) {
    // player survived the 10 rounds!
    if (statusIconEl) statusIconEl.innerHTML = '<i class="fas fa-trophy"></i>';
    if (perfNameEl) perfNameEl.innerText = "Surviving Agent";
    if (perfDescEl)
      perfDescEl.innerText = "You survived the interrogation session.";
    if (sysNoteEl) sysNoteEl.innerText = "Great job detective!";
    if (subtitleEl) subtitleEl.innerText = "MISSION COMPLETE";
  } else {
    // player lost all 3 lives
    if (statusIconEl) statusIconEl.innerHTML = '<i class="fas fa-skull"></i>';
    if (perfNameEl) perfNameEl.innerText = "Failed Agent";
    if (perfDescEl)
      perfDescEl.innerText = "You lost all lives in the interrogation.";
    if (subtitleEl) subtitleEl.innerText = "AGENT TERMINATED";
    if (sysNoteEl) sysNoteEl.innerText = "More training required detective.";
  }

  // animate the table rows fading in one by one
  animateTableRows();
}

// stagger animation for table rows - they fade in with delay
function animateTableRows() {
  let allRows = document.querySelectorAll("tbody tr");
  for (let r = 0; r < allRows.length; r++) {
    allRows[r].style.opacity = "0";

    // IIFE to capture the correct row and delay in the loop
    // without this, all rows would use the same value of r
    (function (theRow, delayMs) {
      setTimeout(function () {
        theRow.style.transition = "opacity 0.3s";
        theRow.style.opacity = "1";
      }, delayMs);
    })(allRows[r], 50 * r);
  }
}

// --- robot memory summary ---
// shows a summary of robot lie tracking from the just finished game
function loadRobotMemorySummary() {
  let memData = localStorage.getItem("robotMemoryLog");
  let summaryEl = document.getElementById("robotMemorySummary");

  if (!summaryEl) return; // no element for this on page, skip

  if (!memData) {
    summaryEl.innerHTML =
      '<p style="color:rgba(255,255,255,0.5); font-size:13px;">No memory data from this game.</p>';
    return;
  }

  let memLogArr = JSON.parse(memData);

  if (memLogArr.length === 0) {
    summaryEl.innerHTML =
      '<p style="color:rgba(255,255,255,0.5); font-size:13px;">Robot had no memory events this game.</p>';
    return;
  }

  // count how many rounds the robot lied
  let liesInLog = 0;
  for (let i = 0; i < memLogArr.length; i++) {
    if (memLogArr[i].wasLie) liesInLog++;
  }

  let liePercCalc = Math.round((liesInLog / memLogArr.length) * 100);

  let htmlStr = `
    <div style="background:rgba(255,140,0,0.1); border:1px solid rgba(255,140,0,0.4); border-radius:12px; padding:14px 18px;">
      <h4 style="color:#ffaa33; font-family:'Orbitron',sans-serif; font-size:12px; margin-bottom:8px; letter-spacing:1px;">
        <i class="fas fa-brain"></i> ROBOT MEMORY LOG
      </h4>
      <p style="color:rgba(255,255,255,0.7); font-size:13px; margin-bottom:6px;">
        Robot tracked <strong style="color:#ffaa33;">${memLogArr.length}</strong> rounds in memory.
        Lied in <strong style="color:#ff4d4d;">${liesInLog}</strong> of those rounds (${liePercCalc}%).
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
  `;

  // small badge for each round
  for (let i = 0; i < memLogArr.length; i++) {
    let entry = memLogArr[i];
    let bdgColor = entry.wasLie ? "#ff4d4d" : "#39ff14";
    let bdgTxt = entry.wasLie ? "LIED" : "TRUTH";
    htmlStr += `
      <span style="background:rgba(0,0,0,0.3); border:1px solid ${bdgColor}; color:${bdgColor}; padding:3px 10px; border-radius:20px; font-size:11px; font-family:'Orbitron',sans-serif;">
        R${entry.round}: ${bdgTxt}
      </span>
    `;
  }

  htmlStr += `</div></div>`;
  summaryEl.innerHTML = htmlStr;
}

// play again button - clear old data and go back to game
function playAgain() {
  localStorage.removeItem("interrogationHistory");
  localStorage.removeItem("finalGameScore");
  localStorage.removeItem("finalLives");
  localStorage.removeItem("finalAccuracy");
  localStorage.removeItem("roundsPlayed");
  localStorage.removeItem("robotMemoryLog");
  window.location.href = "game.html";
}

// go back to home page
function goToDashboard() {
  window.location.href = "index.html";
}
