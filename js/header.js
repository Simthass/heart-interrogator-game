// handles everything to do with the injected header.html
// - shows login/register buttons when not logged in
// - shows username + logout when logged in
// - highlights the active nav link
// these are window.* so inline onclick handlers in header.html can reach them

window.updateHeaderAuth = function () {
  let authSection = document.getElementById("auth-section");
  if (!authSection) return;

  let loggedUser = getCookie("loggedUser");
  let token = getCookie("authToken");

  if (loggedUser && token && token !== "") {
    authSection.innerHTML = `
      <span class="user-display" style="color:var(--cream);margin-right:15px;display:flex;align-items:center;gap:8px;background:rgba(254,158,132,0.1);padding:5px 15px;border-radius:30px;border:1px solid rgba(254,158,132,0.3);">
        <i class="fas fa-user-secret" style="color:var(--coral);"></i>
        <span style="font-weight:600;font-family:'Orbitron',sans-serif;">${loggedUser}</span>
      </span>
      <button onclick="handleLogout()" style="background:transparent;border:2px solid var(--coral);color:var(--coral);padding:8px 16px;border-radius:30px;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px;transition:all 0.2s;">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    `;
  } else {
    authSection.innerHTML = `
      <button onclick="showLogin()" style="background:transparent;border:2px solid var(--coral);color:var(--coral);padding:8px 20px;border-radius:30px;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px;transition:all 0.2s;">
        <i class="fas fa-sign-in-alt"></i> Login
      </button>
      <button onclick="showRegister()" style="background:var(--coral);border:2px solid var(--coral);color:var(--teal-dark);padding:8px 20px;border-radius:30px;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;display:flex;align-items:center;gap:5px;transition:all 0.2s;">
        <i class="fas fa-user-plus"></i> Register
      </button>
    `;
  }
};

window.handleLogout = function () {
  if (confirm("Are you sure you want to logout?")) {
    deleteCookie("loggedUser");
    deleteCookie("authToken");
    deleteCookie("loggedId");
    localStorage.clear();
    window.location.href = "index.html";
  }
};

// highlights the nav link for the current page
window.setActiveNav = function () {
  let page = window.location.pathname.split("/").pop() || "index.html";

  let homeLink = document.getElementById("nav-home");
  let statsLink = document.getElementById("nav-stats");
  let settingsLink = document.getElementById("nav-settings");

  if (homeLink) homeLink.classList.remove("active");
  if (statsLink) statsLink.classList.remove("active");
  if (settingsLink) settingsLink.classList.remove("active");

  if (page === "index.html" || page === "" || page === "/") {
    if (homeLink) homeLink.classList.add("active");
  } else if (page === "stats.html") {
    if (statsLink) statsLink.classList.add("active");
  } else if (page === "settings.html") {
    if (settingsLink) settingsLink.classList.add("active");
  }
};
