// renders the career progression grid and 20 achievements on stats.html
// moved rank/badge rendering here since it has nothing to do with game logic

var allRoles = [
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

function updateRankAndRoles(totalWins) {
  let rankEl = document.getElementById("rankBadge");
  let rolesGrid = document.getElementById("rolesGrid");

  let currentObj = allRoles[0];
  let highestIdx = 0;

  for (let i = 0; i < allRoles.length; i++) {
    if (totalWins >= allRoles[i].req) {
      currentObj = allRoles[i];
      highestIdx = i;
    }
  }

  if (rankEl) {
    rankEl.innerHTML = `<i class="fas ${currentObj.icon}"></i> ${currentObj.title.toUpperCase()}`;
  }

  if (rolesGrid) {
    rolesGrid.innerHTML = "";
    for (let i = 0; i < allRoles.length; i++) {
      let role = allRoles[i];
      let locked = totalWins < role.req;
      let current = i === highestIdx;

      let cls = "rank-item";
      if (locked) cls += " locked";
      if (current) cls += " current-role";

      let label = locked
        ? "Need " + role.req + " Wins"
        : current
          ? "Current Rank"
          : "Unlocked";

      rolesGrid.innerHTML += `
        <div class="${cls}">
          <i class="fas ${role.icon}"></i>
          <div class="badge-name">${role.title}</div>
          <small>${label}</small>
        </div>`;
    }
  }
}

function loadAchievements(wins, games, acc, totalScore, extras) {
  let grid = document.getElementById("achievementsGrid");
  if (!grid) return;

  let achievements = [
    // games played
    {
      icon: "fa-door-open",
      name: "First Shift",
      req: "Play 1 game",
      unlocked: games >= 1,
    },
    {
      icon: "fa-walking",
      name: "Night Shift",
      req: "Play 10 games",
      unlocked: games >= 10,
    },
    {
      icon: "fa-running",
      name: "Overtime",
      req: "Play 25 games",
      unlocked: games >= 25,
    },
    {
      icon: "fa-bed",
      name: "Workaholic",
      req: "Play 50 games",
      unlocked: games >= 50,
    },
    {
      icon: "fa-infinity",
      name: "Century",
      req: "Play 100 games",
      unlocked: games >= 100,
    },
    // wins
    {
      icon: "fa-check",
      name: "First Case",
      req: "Win 1 case",
      unlocked: wins >= 1,
    },
    {
      icon: "fa-medal",
      name: "Getting Good",
      req: "Win 5 cases",
      unlocked: wins >= 5,
    },
    {
      icon: "fa-award",
      name: "Regular",
      req: "Win 10 cases",
      unlocked: wins >= 10,
    },
    {
      icon: "fa-trophy",
      name: "Experienced",
      req: "Win 25 cases",
      unlocked: wins >= 25,
    },
    {
      icon: "fa-gem",
      name: "Legend",
      req: "Win 50 cases",
      unlocked: wins >= 50,
    },
    // score
    {
      icon: "fa-coins",
      name: "Piggy Bank",
      req: "Score 500+",
      unlocked: totalScore >= 500,
    },
    {
      icon: "fa-money-bill",
      name: "Rich Man",
      req: "Score 1000+",
      unlocked: totalScore >= 1000,
    },
    {
      icon: "fa-sack-dollar",
      name: "Millionaire",
      req: "Score 5000+",
      unlocked: totalScore >= 5000,
    },
    // accuracy
    {
      icon: "fa-bullseye",
      name: "Not Bad",
      req: "50% accuracy",
      unlocked: acc >= 50 && games > 0,
    },
    {
      icon: "fa-crosshairs",
      name: "Sharp Eye",
      req: "75% accuracy",
      unlocked: acc >= 75 && games > 0,
    },
    {
      icon: "fa-robot",
      name: "Better Than AI",
      req: "90% accuracy",
      unlocked: acc >= 90 && games > 0,
    },
    // behaviour
    {
      icon: "fa-handshake",
      name: "Risk Taker",
      req: "Trust AI 5x in 1 game",
      unlocked: extras.riskTaker === true,
    },
    {
      icon: "fa-search",
      name: "Skeptic",
      req: "Verify 8x in 1 game",
      unlocked: extras.skeptic === true,
    },
    {
      icon: "fa-heartbeat",
      name: "Close Call",
      req: "Win with 1 life left",
      unlocked: extras.closeCall === true,
    },
    {
      icon: "fa-check-double",
      name: "Flawless",
      req: "100% correct in a game",
      unlocked: extras.flawless === true,
    },
  ];

  grid.innerHTML = "";

  for (let a of achievements) {
    let locked = a.unlocked ? "" : " locked";
    grid.innerHTML += `
      <div class="achievement-badge-item${locked}" style="background:rgba(0,119,123,0.4);border:2px solid var(--teal-light);border-radius:12px;padding:15px 10px;text-align:center;">
        <i class="fas ${a.icon}" style="font-size:28px;color:var(--coral);margin-bottom:8px;"></i>
        <div class="badge-name" style="font-size:13px;font-weight:700;color:var(--cream);font-family:'Orbitron';line-height:1.2;margin-bottom:5px;">${a.name}</div>
        <small style="font-size:11px;opacity:0.7;">${a.unlocked ? "Unlocked!" : a.req}</small>
      </div>`;
  }
}
