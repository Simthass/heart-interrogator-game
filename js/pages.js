// =====================================================
// pages.js - helper functions for stats page and settings page
// handles leaderboard, rank calculation, achievements etc
// NOTE: home.js always loaded before this so getCookie is available
// CIS045-3 Distributed Service Architectures
// Student: Simthass Mohammed (2540927)
// =====================================================

// helper to format big numbers nicely with commas
// e.g. 1234 becomes 1,234
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// calculate accuracy percent from correct / total
function calcAccuracy(correctAns, totalAns) {
  if (totalAns === 0) return 0;
  return Math.round((correctAns / totalAns) * 100);
}

// get rank title + icon based on how many wins user has
// this is for the stats page badge
function getRankTitle(totalWins) {
  if (totalWins >= 20) return { title: "MASTER DETECTIVE", icon: "fa-medal" };
  if (totalWins >= 10) return { title: "INSPECTOR", icon: "fa-medal" };
  if (totalWins >= 5) return { title: "SERGEANT", icon: "fa-medal" };
  if (totalWins >= 1) return { title: "OFFICER", icon: "fa-user-shield" };
  // default rank for new player
  return { title: "CADET", icon: "fa-user-graduate" };
}

// update the rank badge on stats page
function updateRankBadge(winCount) {
  let rankEl = document.getElementById("rankBadge");
  if (!rankEl) return;

  let rnkInfo = getRankTitle(winCount);
  rankEl.innerHTML = `<i class="fas ${rnkInfo.icon}"></i> ${rnkInfo.title}`;
}

// build the achievements grid based on player stats
// each achievement has a condition - unlocked or locked
function loadAchievements(winCount, gamesCount, accPercent) {
  let achGrid = document.getElementById("achievementsGrid");
  if (!achGrid) return;

  // define all achievements with their unlock conditions
  let allAchievements = [
    {
      icon: "fa-crown",
      name: "First Victory",
      req: "Win 1 game",
      unlocked: winCount >= 1,
    },
    {
      icon: "fa-gamepad",
      name: "Veteran",
      req: "Play 5 games",
      unlocked: gamesCount >= 5,
    },
    {
      icon: "fa-bullseye",
      name: "Sharpshooter",
      req: "70% accuracy",
      unlocked: accPercent >= 70,
    },
    {
      icon: "fa-skull",
      name: "Master Detective",
      req: "Win 10 games",
      unlocked: winCount >= 10,
    },
    {
      icon: "fa-fire",
      name: "Hot Streak",
      req: "Win 3 games in a row",
      unlocked: winCount >= 3, // simplified - streak not tracked per session
    },
    {
      icon: "fa-robot",
      name: "AI Slayer",
      req: "Win 20 games",
      unlocked: winCount >= 20,
    },
  ];

  achGrid.innerHTML = ""; // clear old content

  for (let i = 0; i < allAchievements.length; i++) {
    let ach = allAchievements[i];
    let itemDiv = document.createElement("div");
    // locked class makes it grey out in css
    itemDiv.className =
      "achievement-badge-item" + (ach.unlocked ? "" : " locked");
    itemDiv.innerHTML = `
      <i class="fas ${ach.icon}"></i>
      <div class="badge-name">${ach.name}</div>
      <small>${ach.unlocked ? "Unlocked!" : ach.req}</small>
    `;
    achGrid.appendChild(itemDiv);
  }
}

// =====================================================
// STATS PAGE - main loading function
// fetches user stats from backend using JWT token
// this demostrates virtual identity - token identifies user securely
// without sending username in every request
// =====================================================
window.checkLoginAndLoadStats = async function () {
  // get auth cookie - this proves user identity
  let userAuthToken = getCookie("authToken");
  let loggedUsername = getCookie("loggedUser");

  let nameDisplay = document.getElementById("profNameTag");
  let userDisplay = document.getElementById("profUserTag");

  if (!userAuthToken || userAuthToken === "") {
    // user not loggedin - show guest message
    if (nameDisplay) nameDisplay.innerText = "Not Logged In";
    if (userDisplay) userDisplay.innerText = "@guest";

    let recentEl = document.getElementById("recentGamesBox");
    if (recentEl)
      recentEl.innerHTML =
        '<p style="text-align:center; padding:20px; color:rgba(255,255,255,0.5);">Please login to see your stats.</p>';
    return;
  }

  // show username while loading actual fullname
  if (nameDisplay) nameDisplay.innerText = loggedUsername || "Loading...";
  if (userDisplay) userDisplay.innerText = "@" + (loggedUsername || "loading");

  updateRankBadge(0); // show default rank while loading

  // --- fetch user profile info from server ---
  // we use the JWT token in Authorization header, not username in body
  // this is how virtual identity works - server decodes token to get user id
  try {
    let profileRes = await fetch("http://localhost:3000/api/user-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userAuthToken, // token proves who we are
      },
      body: JSON.stringify({}), // body is empty, server gets id from token
    });

    let profileData = await profileRes.json();

    if (profileRes.ok && profileData.fullname) {
      if (nameDisplay) nameDisplay.innerText = profileData.fullname;
    }
  } catch (e) {
    console.log("user info fetch error:", e);
  }

  // --- fetch player statistics from server ---
  try {
    let statsResp = await fetch("http://localhost:3000/api/my-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userAuthToken,
      },
      body: JSON.stringify({}),
    });

    let statsResp_data = await statsResp.json();

    if (statsResp.ok) {
      let myTotalScore = statsResp_data.totalScore || 0;
      let myWins = statsResp_data.wins || 0;
      let myAvgAcc = statsResp_data.avgAccuracy || 0;
      let myGamesPlayed = statsResp_data.gamesPlayed || 0;

      // populate the stat cards in HTML
      let totScrEl = document.getElementById("totScoreDisplay");
      let winsEl = document.getElementById("winsDisplay");
      let accEl = document.getElementById("accDisplay");
      let gPlayedEl = document.getElementById("gamesPlayedDisplay");

      if (totScrEl) totScrEl.innerText = formatNumber(myTotalScore);
      if (winsEl) winsEl.innerText = myWins;
      if (accEl) accEl.innerText = myAvgAcc + "%";
      if (gPlayedEl) gPlayedEl.innerText = myGamesPlayed;

      // update rank badge with actual win count
      updateRankBadge(myWins);

      // load achievement badges
      loadAchievements(myWins, myGamesPlayed, myAvgAcc);
    }
  } catch (e) {
    console.log("stats fetch error:", e);
  }

  // --- fetch recent game history ---
  try {
    let recentResp = await fetch("http://localhost:3000/api/recent-games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userAuthToken,
      },
      body: JSON.stringify({}),
    });

    let recentGamesData = await recentResp.json();
    let recentBox = document.getElementById("recentGamesBox");

    if (!recentBox) return;

    if (recentResp.ok && recentGamesData.length > 0) {
      recentBox.innerHTML = "";

      // loop through each recent game and create a row for it
      for (let i = 0; i < recentGamesData.length; i++) {
        let gm = recentGamesData[i];
        let gmDate = new Date(gm.playDate);
        let gmDateStr =
          gmDate.toLocaleDateString() + " " + gmDate.toLocaleTimeString();
        let winCssClass = gm.isWin ? "success" : "fail";
        let winIco = gm.isWin ? "fa-check-circle" : "fa-times-circle";
        let winTxt = gm.isWin ? "Won" : "Lost";

        recentBox.innerHTML += `
          <div class="game-record">
            <span class="record-date"><i class="far fa-calendar"></i> ${gmDateStr}</span>
            <span class="record-score" style="color: ${gm.isWin ? "var(--coral)" : "#ff4d4d"}">${gm.score} pts</span>
            <span class="record-status ${winCssClass}"><i class="fas ${winIco}"></i> ${winTxt}</span>
          </div>
        `;
      }
    } else {
      recentBox.innerHTML =
        '<p style="text-align:center; padding:20px; color:rgba(255,255,255,0.5);">No games played yet!</p>';
    }
  } catch (e) {
    console.log("recent games fetch error:", e);
    let recentBox = document.getElementById("recentGamesBox");
    if (recentBox)
      recentBox.innerHTML =
        '<p style="text-align:center; padding:20px; color:#ff4d4d;">Error loading recent games.</p>';
  }
};

// run on page load - setup any settings page buttons that dont have handlers
document.addEventListener("DOMContentLoaded", function () {
  console.log("pages.js ready");

  // if theres setting buttons without onclick, add a placeholder
  let settingBtns = document.querySelectorAll(".setting-btn");
  settingBtns.forEach(function (btn) {
    if (!btn.getAttribute("onclick")) {
      btn.addEventListener("click", function () {
        if (
          !this.innerText.toLowerCase().includes("change") &&
          !this.innerText.toLowerCase().includes("delete") &&
          !this.innerText.toLowerCase().includes("save")
        ) {
          alert("This feature is coming soon!");
        }
      });
    }
  });
});
