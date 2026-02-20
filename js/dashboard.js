// dashboard.js
// Main dashboard functionality
// Simthass MYM - 2540927

// check if user is logged in when page loads
window.addEventListener("load", function () {
  console.log("Dashboard loaded");

  // TODO: check authentication later
  // for now just show the page

  // could add some animation to the start button
  const startButton = document.querySelector(".btn-start-game");
  if (startButton) {
    startButton.addEventListener("mouseenter", function () {
      console.log("User hovering over start button");
    });
  }
});

// function to start the game
function startGame() {
  console.log("Starting new interrogation...");

  // show loading message maybe?
  alert("Loading interrogation room...");

  // redirect to game page
  window.location.href = "game.html";
}

// logout function
function logout() {
  // ask for confirmation
  const confirmLogout = confirm("Are you sure you want to logout?");

  if (confirmLogout) {
    console.log("User logging out");

    // clear any saved data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userData");

    // redirect to login page
    window.location.href = "index.html";
  }
}

// some dummy data for testing UI
// will be replaced with real API data later
const userStats = {
  score: 2450,
  cases: 89,
  accuracy: 73,
  streak: 12,
};

// function to update stats on page (not using it yet)
function updateStats(stats) {
  // will implement this when i connect to backend
  console.log("Updating stats:", stats);
}

// animate the achievement badges on hover
document.addEventListener("DOMContentLoaded", function () {
  const badges = document.querySelectorAll(".achievement-badge");

  badges.forEach(function (badge) {
    badge.addEventListener("click", function () {
      // show achievement details
      alert("Achievement details coming soon!");
    });
  });

  // update progress bar animation
  const progressFill = document.querySelector(".progress-fill");
  if (progressFill) {
    // animate on load
    setTimeout(function () {
      progressFill.style.width = "60%";
    }, 500);
  }
});
