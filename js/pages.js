// logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    console.log("User logging out");
    // clear any stored data
    localStorage.clear();
    // redirect to home
    window.location.href = "index.html";
  }
}

// settings tab switching
function showTab(tabName) {
  // hide all panels
  document.getElementById("accountSettings").style.display = "none";
  document.getElementById("gameSettings").style.display = "none";
  document.getElementById("privacySettings").style.display = "none";

  // remove active class from all tabs
  let tabs = document.querySelectorAll(".settings-tab");
  tabs.forEach(function (tab) {
    tab.classList.remove("active");
  });

  // show selected panel and activate tab
  if (tabName === "account") {
    document.getElementById("accountSettings").style.display = "block";
    tabs[0].classList.add("active");
  } else if (tabName === "game") {
    document.getElementById("gameSettings").style.display = "block";
    tabs[1].classList.add("active");
  } else if (tabName === "privacy") {
    document.getElementById("privacySettings").style.display = "block";
    tabs[2].classList.add("active");
  }
}

// when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("Pages script loaded");

  // save buttons functionality
  let saveBtns = document.querySelectorAll(".btn-save");
  saveBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      alert("Settings saved successfully!");
      console.log("Settings saved");
    });
  });

  // setting buttons
  let settingBtns = document.querySelectorAll(".setting-btn");
  settingBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      alert("This feature will be implemented soon");
    });
  });

  // danger zone
  let dangerBtn = document.querySelector(".btn-danger");
  if (dangerBtn) {
    dangerBtn.addEventListener("click", function () {
      if (
        confirm(
          "Are you SURE you want to delete your account? This cannot be undone!",
        )
      ) {
        alert("Account deletion will be processed");
      }
    });
  }
});

// format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// calculate accuracy percentage
function calculateAccuracy(correct, total) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
