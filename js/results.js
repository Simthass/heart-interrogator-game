document.addEventListener("DOMContentLoaded", function () {
  console.log("Results page loaded");

  // add some animations maybe
  animateResults();
});

// animate the results display
function animateResults() {
  // fade in effect for score
  const scoreDisplay = document.querySelector(".score-display");
  if (scoreDisplay) {
    scoreDisplay.style.opacity = "0";
    setTimeout(function () {
      scoreDisplay.style.transition = "opacity 1s";
      scoreDisplay.style.opacity = "1";
    }, 100);
  }

  // animate table rows one by one
  const rows = document.querySelectorAll("tbody tr");
  rows.forEach(function (row, index) {
    row.style.opacity = "0";
    setTimeout(
      function () {
        row.style.transition = "opacity 0.5s";
        row.style.opacity = "1";
      },
      300 * (index + 1),
    );
  });
}

// continue to next round
function continueGame() {
  console.log("Continuing to next round...");

  alert("Loading next round...");
  window.location.href = "game.html";
}

// return to dashboard
function goToDashboard() {
  console.log("Returning to dashboard");
  window.location.href = "dashboard.html";
}

// calculate accuracy (might use this later)
function calculateAccuracy(correct, total) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// save results to localStorage (for later use)
function saveResults(results) {
  // will implement when connecting backend
  console.log("Saving results:", results);

  try {
    localStorage.setItem("lastGameResults", JSON.stringify(results));
  } catch (error) {
    console.error("Error saving results:", error);
  }
}

// load previous results
function loadResults() {
  try {
    const saved = localStorage.getItem("lastGameResults");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading results:", error);
  }
  return null;
}
