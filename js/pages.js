// logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    console.log("logging out");
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("username");
    window.location.href = "index.html";
  }
}

// format numbers
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// calculate accuracy
function calculateAccuracy(correct, total) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("pages script loaded");

  // setting buttons
  let settingBtns = document.querySelectorAll(
    '.setting-btn:not([style*="dashed"])',
  );
  settingBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (
        !this.innerText.includes("change") &&
        !this.innerText.includes("read")
      ) {
        alert("This feature coming soon");
      }
    });
  });
});
