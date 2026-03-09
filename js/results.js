document.addEventListener("DOMContentLoaded", function () {
  console.log("Result page loading data...");

  // get strings from local storage
  let savedData = localStorage.getItem("interrogationHistory");
  let finalScore = localStorage.getItem("finalGameScore");
  let finalLivesCount = localStorage.getItem("finalLives");

  // check if user jump to page without playing game
  if (!savedData || savedData === "[]") {
    console.log("No data found! User did not play.");
    document.getElementById("resultSubtitle").innerText =
      "NO DATA - PLEASE PLAY GAME FIRST";
    return;
  }

  // convert back to array
  let historyArray = JSON.parse(savedData);

  let tableBody = document.getElementById("resultsTableBody");
  tableBody.innerHTML = ""; // clean old html

  let correctCount = 0;
  let trustCount = 0;
  let verifyCount = 0;
  let aiLiesCount = 0;

  // loop all rounds played and make table rows
  for (let i = 0; i < historyArray.length; i++) {
    let roundData = historyArray[i];

    // check what user did for stats
    if (roundData.decision.includes("TRUST")) trustCount++;
    if (roundData.decision.includes("VERIFY")) verifyCount++;
    if (roundData.isWin) correctCount++;
    if (roundData.aiLied) aiLiesCount++;

    let tr = document.createElement("tr");

    // add css class for green or red color
    if (roundData.isWin) {
      tr.className = "correct-row";
    } else {
      tr.className = "wrong-row";
    }

    // make html string for cells
    let htmlString = `
      <td>Q${roundData.round}</td>
      <td>${roundData.decision}</td>
      <td>${roundData.aiSaid}</td>
      <td>${roundData.realAnswer} ${roundData.aiLied ? "✗" : "✓"}</td>
      <td class="${roundData.isWin ? "points-positive" : "points-negative"}">${roundData.points}</td>
    `;

    tr.innerHTML = htmlString;
    tableBody.appendChild(tr);
  }

  // update html texts
  document.getElementById("finalScoreText").innerText =
    finalScore + " POINTS EARNED";

  // do math for accuracy safely so no divide by zero error
  let mathAcc = 0;
  if (historyArray.length > 0) {
    mathAcc = Math.round((correctCount / historyArray.length) * 100);
  }
  document.getElementById("accRate").innerText =
    correctCount + "/" + historyArray.length + " (" + mathAcc + "%)";

  document.getElementById("trustCount").innerText = trustCount;
  document.getElementById("verifyCount").innerText = verifyCount;

  // print heart emojis based on lives
  let heartString = "";
  for (let x = 0; x < parseInt(finalLivesCount); x++) {
    heartString += "❤️ ";
  }
  if (finalLivesCount <= 0) {
    heartString = "💀 TERMINATED";
  }
  document.getElementById("finalLives").innerText = heartString;

  // show ai analysis text
  document.getElementById("aiLieRate").innerText =
    `The AI suspect tried to deceive you on ${aiLiesCount} questions out of ${historyArray.length}.`;

  // check if win or lose whole game
  if (finalLivesCount > 0) {
    document.getElementById("statusIcon").innerText = "🏆";
    document.getElementById("perfName").innerText = "Surviving Agent";
    document.getElementById("perfDesc").innerText =
      "You survived the interrogation simulation.";
  } else {
    document.getElementById("statusIcon").innerText = "💀";
    document.getElementById("perfName").innerText = "Failed Agent";
    document.getElementById("perfDesc").innerText =
      "You lost all lives and failed the test.";
    document.getElementById("resultSubtitle").innerText = "AGENT TERMINATED";
    document.getElementById("sysNote").innerText =
      "Recommend more training before next try.";
  }

  // small animation loop for table rows
  let rows = document.querySelectorAll("tbody tr");
  for (let r = 0; r < rows.length; r++) {
    rows[r].style.opacity = "0";
    setTimeout(function () {
      rows[r].style.transition = "opacity 0.4s";
      rows[r].style.opacity = "1";
    }, 200 * r);
  }
});

// buttons logic
function playAgain() {
  window.location.href = "game.html";
}

function goToDashboard() {
  window.location.href = "index.html";
}
