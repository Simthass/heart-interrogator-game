// =====================================================
// home.js - handles header, cookies, auth stuff
// this file is loaded on EVERY page so all shared
// functions go here
// CIS045-3 Distributed Service Architectures
// Student: Simthass Mohammed (2540927)
// =====================================================

// --- cookie functions ---
// i need these everywhere so putting here

function setCookie(cname, cval, days) {
  let d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  let exp = "expires=" + d.toUTCString();
  // path=/ means cookie works on all pages not just current folder
  document.cookie = cname + "=" + cval + ";" + exp + ";path=/";
}

function getCookie(cname) {
  let nm = cname + "=";
  let allCookies = document.cookie.split(";");
  for (let i = 0; i < allCookies.length; i++) {
    let singleC = allCookies[i];
    // trim spaces from start
    while (singleC.charAt(0) == " ") {
      singleC = singleC.substring(1);
    }
    if (singleC.indexOf(nm) == 0) {
      return singleC.substring(nm.length, singleC.length);
    }
  }
  return "";
}

function deleteCookie(cname) {
  // set date to past so browser deletes it
  document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// =====================================================
// updateHeaderAuth - this is called after we fetch
// and inject the header.html into the page
// shows login/reg buttons if not loggedin
// or shows username + logout if loggedin
// =====================================================
window.updateHeaderAuth = function () {
  let authSection = document.getElementById("auth-section");
  if (!authSection) return;

  let whosLoggedIn = getCookie("loggedUser");
  let theirToken = getCookie("authToken");

  // check both cookie exists and token is not empty
  if (whosLoggedIn && theirToken && theirToken !== "") {
    // user is logged in - show name and logout btn
    authSection.innerHTML = `
      <span class="user-display" style="color: var(--cream); margin-right: 15px; display: flex; align-items: center; gap: 8px; background: rgba(254, 158, 132, 0.1); padding: 5px 15px; border-radius: 30px; border: 1px solid rgba(254, 158, 132, 0.3);">
        <i class="fas fa-user-secret" style="color: var(--coral);"></i>
        <span style="font-weight: 600; font-family: 'Orbitron', sans-serif;">${whosLoggedIn}</span>
      </span>
      <button onclick="handleLogout()" style="background: transparent; border: 2px solid var(--coral); color: var(--coral); padding: 8px 16px; border-radius: 30px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    `;
  } else {
    // not loggedin - show login and register button
    authSection.innerHTML = `
      <button onclick="showLogin()" style="background: transparent; border: 2px solid var(--coral); color: var(--coral); padding: 8px 20px; border-radius: 30px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
        <i class="fas fa-sign-in-alt"></i> Login
      </button>
      <button onclick="showRegister()" style="background: var(--coral); border: 2px solid var(--coral); color: var(--teal-dark); padding: 8px 20px; border-radius: 30px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
        <i class="fas fa-user-plus"></i> Register
      </button>
    `;
  }
};

// --- logout ---
// called from header button, window.* so inline onclick in injected html can reach it
window.handleLogout = function () {
  if (confirm("Are you sure you want to logout?")) {
    deleteCookie("loggedUser");
    deleteCookie("authToken");
    deleteCookie("loggedId"); // old cookie, just remove it too
    localStorage.clear(); // clear game data too
    window.location.href = "index.html";
  }
};

// --- set active nav link ---
// highlights the current page in navbar
window.setActiveNav = function () {
  let currentPg = window.location.pathname.split("/").pop() || "index.html";

  let homeLink = document.getElementById("nav-home");
  let statsLink = document.getElementById("nav-stats");
  let settingsLink = document.getElementById("nav-settings");

  // remove active from all first
  if (homeLink) homeLink.classList.remove("active");
  if (statsLink) statsLink.classList.remove("active");
  if (settingsLink) settingsLink.classList.remove("active");

  // now add active to the right one
  if (currentPg === "index.html" || currentPg === "" || currentPg === "/") {
    if (homeLink) homeLink.classList.add("active");
  } else if (currentPg === "stats.html") {
    if (statsLink) statsLink.classList.add("active");
  } else if (currentPg === "settings.html") {
    if (settingsLink) settingsLink.classList.add("active");
  }
};

// --- modal open/close/switch ---
// these must be window.* globals becuase they called from injected header html

window.showLogin = function () {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  if (loginMod) loginMod.classList.add("active");
  if (regMod) regMod.classList.remove("active");
  // clear old errors when opening
  let errEl = document.getElementById("loginErrorBox");
  if (errEl) errEl.innerHTML = "";
};

window.showRegister = function () {
  let regMod = document.getElementById("registerModal");
  let loginMod = document.getElementById("loginModal");
  if (regMod) regMod.classList.add("active");
  if (loginMod) loginMod.classList.remove("active");
};

window.closeModals = function () {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  if (loginMod) loginMod.classList.remove("active");
  if (regMod) regMod.classList.remove("active");
};

window.switchToRegister = function () {
  closeModals();
  showRegister();
};

window.switchToLogin = function () {
  closeModals();
  showLogin();
};

// toggle password field visibility - the eye icon thing
window.togglePassword = function (inputId) {
  let theInput = document.getElementById(inputId);
  if (!theInput) return;
  // if password, make it text so user can see it, else hide again
  if (theInput.type === "password") {
    theInput.type = "text";
  } else {
    theInput.type = "password";
  }
};

// close modal when user click outside of it
window.addEventListener("click", function (e) {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  // if the click was directly on the modal backdrop (not content inside), close it
  if (e.target === loginMod) loginMod.classList.remove("active");
  if (e.target === regMod) regMod.classList.remove("active");
});

// also close if escape key pressed
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (window.closeModals) window.closeModals();
  }
});
