// fetches the players win count from db and sets userRankLevel
// userRankLevel (0-9) controls difficulty throughout the game
// pulled out of game.js because rank logic is its own concern

// maps win count to a rank index 0-9
// higher rank = shorter timer + harder mechanics unlocked
function calculateRankLevel(totalWins) {
  if (totalWins >= 75)
    return 9; // director
  else if (totalWins >= 50)
    return 8; // master
  else if (totalWins >= 40)
    return 7; // deputy
  else if (totalWins >= 30)
    return 6; // chief
  else if (totalWins >= 20)
    return 5; // inspector
  else if (totalWins >= 15)
    return 4; // lead
  else if (totalWins >= 10)
    return 3; // senior (switcheroo unlocks here)
  else if (totalWins >= 5)
    return 2; // junior
  else if (totalWins >= 2)
    return 1; // patrol
  else return 0; // rookie
}

// calls my-stats endpoint with the stored jwt token
// if the user isnt logged in we just stay at rank 0 (easiest)
async function setBadgeLevel() {
  let token = getCookie("authToken");
  if (!token) return;

  try {
    let res = await fetch("http://localhost:3000/api/my-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({}),
    });

    let data = await res.json();
    if (res.ok) {
      userRankLevel = calculateRankLevel(data.wins || 0);
      console.log("rank level:", userRankLevel, "wins:", data.wins);
    }
  } catch (e) {
    console.log("cant load rank:", e);
    // stays at 0 if server is unreachable
  }
}

// tracks which answers the player got wrong so the ai
// can theoretically exploit weaknesses (future feature)
function saveMistakeToMemory(answerNum) {
  let key = String(answerNum);
  robotMistakeMemory[key] = (robotMistakeMemory[key] || 0) + 1;
  localStorage.setItem(
    "robotMistakeMemory",
    JSON.stringify(robotMistakeMemory),
  );
}
