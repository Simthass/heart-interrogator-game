// helper to format big numbers nicely with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// this calculates the 10 tier detective roles and builds the DOM grid
function updateRankAndRoles(totalWins) {
  let rankEl = document.getElementById("rankBadge");
  let rolesGrid = document.getElementById("rolesGrid");

  // the 10 tier progression roles
  let allRoles = [
    { title: "Rookie Cadet", req: 0, icon: "fa-user" },
    { title: "Patrol Officer", req: 2, icon: "fa-shield-alt" },
    { title: "Junior Detective", req: 5, icon: "fa-search" },
    { title: "Senior Detective", req: 10, icon: "fa-user-secret" },
    { title: "Lead Investigator", req: 15, icon: "fa-eye" },
    { title: "Inspector", req: 20, icon: "fa-id-badge" },
    { title: "Chief Inspector", req: 30, icon: "fa-star" },
    { title: "Deputy Super", req: 40, icon: "fa-building" },
    { title: "Master Interrogator", req: 50, icon: "fa-brain" },
    { title: "Director of Intel", req: 75, icon: "fa-crown" },
  ];

  // find highest rank they reached
  let currentRankObj = allRoles[0];
  let highestIndex = 0;
  for (let i = 0; i < allRoles.length; i++) {
    if (totalWins >= allRoles[i].req) {
      currentRankObj = allRoles[i];
      highestIndex = i;
    }
  }

  // update small badge
  if (rankEl) {
    rankEl.innerHTML = `<i class="fas ${currentRankObj.icon}"></i> ${currentRankObj.title.toUpperCase()}`;
  }

  // render the 10 roles grid
  if (rolesGrid) {
    rolesGrid.innerHTML = "";
    for (let i = 0; i < allRoles.length; i++) {
      let role = allRoles[i];
      let isLocked = totalWins < role.req;
      let isCurrent = i === highestIndex;

      let cssClass = "rank-item";
      if (isLocked) cssClass += " locked";
      if (isCurrent) cssClass += " current-role";

      rolesGrid.innerHTML += `
            <div class="${cssClass}">
              <i class="fas ${role.icon}"></i>
              <div class="badge-name">${role.title}</div>
              <small>${isLocked ? `Need ${role.req} Wins` : isCurrent ? "Current Rank" : "Unlocked"}</small>
            </div>
          `;
    }
  }
}

// 20 unique achievements showing different player behaviours
function loadAchievements(
  winCount,
  gamesCount,
  accPercent,
  totalScore,
  exStats,
) {
  let achGrid = document.getElementById("achievementsGrid");
  if (!achGrid) return;

  let allAchievements = [
    // The Grind (Games Played)
    {
      icon: "fa-door-open",
      name: "First Shift",
      req: "Play 1 game",
      unlocked: gamesCount >= 1,
    },
    {
      icon: "fa-walking",
      name: "Night Shift",
      req: "Play 10 games",
      unlocked: gamesCount >= 10,
    },
    {
      icon: "fa-running",
      name: "Overtime",
      req: "Play 25 games",
      unlocked: gamesCount >= 25,
    },
    {
      icon: "fa-bed",
      name: "Workaholic",
      req: "Play 50 games",
      unlocked: gamesCount >= 50,
    },
    {
      icon: "fa-infinity",
      name: "Century",
      req: "Play 100 games",
      unlocked: gamesCount >= 100,
    },

    // The Milestones (Wins)
    {
      icon: "fa-check",
      name: "First Case",
      req: "Win 1 case",
      unlocked: winCount >= 1,
    },
    {
      icon: "fa-medal",
      name: "Getting Good",
      req: "Win 5 cases",
      unlocked: winCount >= 5,
    },
    {
      icon: "fa-award",
      name: "Regular",
      req: "Win 10 cases",
      unlocked: winCount >= 10,
    },
    {
      icon: "fa-trophy",
      name: "Experienced",
      req: "Win 25 cases",
      unlocked: winCount >= 25,
    },
    {
      icon: "fa-gem",
      name: "Legend",
      req: "Win 50 cases",
      unlocked: winCount >= 50,
    },

    // The Points (Score)
    {
      icon: "fa-coins",
      name: "Piggy Bank",
      req: "Score > 500",
      unlocked: totalScore >= 500,
    },
    {
      icon: "fa-money-bill",
      name: "Rich Man",
      req: "Score > 1000",
      unlocked: totalScore >= 1000,
    },
    {
      icon: "fa-sack-dollar",
      name: "Millionaire",
      req: "Score > 5000",
      unlocked: totalScore >= 5000,
    },

    // The Skill (Accuracy)
    {
      icon: "fa-bullseye",
      name: "Not Bad",
      req: "50% Accuracy",
      unlocked: accPercent >= 50 && gamesCount > 0,
    },
    {
      icon: "fa-crosshairs",
      name: "Sharp Eye",
      req: "75% Accuracy",
      unlocked: accPercent >= 75 && gamesCount > 0,
    },
    {
      icon: "fa-robot",
      name: "Better Than AI",
      req: "90% Accuracy",
      unlocked: accPercent >= 90 && gamesCount > 0,
    },

    // The Behaviours (tracked locally in extra stats object)
    {
      icon: "fa-handshake",
      name: "Risk Taker",
      req: "Trust AI 5x in a game",
      unlocked: exStats.riskTaker === true,
    },
    {
      icon: "fa-search",
      name: "Skeptic",
      req: "Verify 8x in a game",
      unlocked: exStats.skeptic === true,
    },
    {
      icon: "fa-heartbeat",
      name: "Close Call",
      req: "Win with 1 life left",
      unlocked: exStats.closeCall === true,
    },
    {
      icon: "fa-check-double",
      name: "Flawless",
      req: "100% correct in a game",
      unlocked: exStats.flawless === true,
    },
  ];

  achGrid.innerHTML = "";

  for (let i = 0; i < allAchievements.length; i++) {
    let ach = allAchievements[i];
    let cssLocked = ach.unlocked ? "" : " locked";

    achGrid.innerHTML += `
        <div class="achievement-badge-item${cssLocked}" style="background: rgba(0, 119, 123, 0.4); border: 2px solid var(--teal-light); border-radius: 12px; padding: 15px 10px; text-align: center;">
          <i class="fas ${ach.icon}" style="font-size: 28px; color: var(--coral); margin-bottom: 8px;"></i>
          <div class="badge-name" style="font-size: 13px; font-weight: 700; color: var(--cream); font-family: 'Orbitron'; line-height: 1.2; margin-bottom: 5px;">${ach.name}</div>
          <small style="font-size: 11px; opacity: 0.7;">${ach.unlocked ? "Unlocked!" : ach.req}</small>
        </div>
    `;
  }
}
