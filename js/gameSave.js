// responsible for saving game results when a session ends
// writes to localstorage first so results.html can read it straight away
// then tries to save to the db if the user is logged in
//
// also calculates the extra achievement stats before saving

async function saveGameToDB() {
  // count correct rounds for accuracy calc
  let correct = 0;
  let trustCount = 0;
  let verifyCount = 0;

  for (let r of gameHistoryArray) {
    if (r.isWin) correct++;
    if (r.decision.includes("TRUST")) trustCount++;
    if (r.decision.includes("VERIFY")) verifyCount++;
  }

  let accuracy = Math.round((correct / gameHistoryArray.length) * 100) || 0;

  // write everything to localstorage so results.html can pick it up immediately
  localStorage.setItem(
    "interrogationHistory",
    JSON.stringify(gameHistoryArray),
  );
  localStorage.setItem("finalGameScore", score);
  localStorage.setItem("finalLives", lives);
  localStorage.setItem("finalAccuracy", accuracy);
  localStorage.setItem("roundsPlayed", gameHistoryArray.length);

  // update the extra achievement flags
  let extras = JSON.parse(localStorage.getItem("playerExtraObj") || "{}");

  if (trustCount >= 5) extras.riskTaker = true;
  if (verifyCount >= 8) extras.skeptic = true;
  if (lives === 1 && correct >= 5) extras.closeCall = true;
  if (correct === 10) extras.flawless = true;

  localStorage.setItem("playerExtraObj", JSON.stringify(extras));

  // increment total games played counter
  let totalPlayed = parseInt(localStorage.getItem("totalGamesPlayed") || "0");
  localStorage.setItem("totalGamesPlayed", totalPlayed + 1);

  // try to persist to db - only works if logged in
  let token = getCookie("authToken");
  if (token) {
    try {
      let res = await fetch("http://localhost:3000/api/save-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          score,
          livesLeft: lives,
          rounds: gameHistoryArray.length,
          accuracy,
        }),
      });
      if (res.ok) console.log("game saved to db");
    } catch (err) {
      console.log("couldnt save to db:", err);
    }
  }

  window.location.href = "results.html";
}
