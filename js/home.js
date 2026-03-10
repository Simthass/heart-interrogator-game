function showLogin() {
  document.getElementById("loginModal").classList.add("active");
  document.getElementById("registerModal").classList.remove("active");
}

function showRegister() {
  document.getElementById("registerModal").classList.add("active");
  document.getElementById("loginModal").classList.remove("active");
}

function closeModals() {
  document.getElementById("loginModal").classList.remove("active");
  document.getElementById("registerModal").classList.remove("active");
}

function switchToRegister() {
  closeModals();
  showRegister();
}

function switchToLogin() {
  closeModals();
  showLogin();
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}

// close modal when clicking outside
window.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) {
    closeModals();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (!username || !password) {
        alert("plz fill all fields");
        return;
      }

      console.log("login attempt:", username);

      // fake login for demo
      localStorage.setItem("userLoggedIn", "true");
      localStorage.setItem("username", username.split("@")[0] || "Detective");

      alert("Login successful!");
      window.location.href = "game.html";
    });
  }

  // register form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const fullName = document.getElementById("regFullName").value;
      const username = document.getElementById("regUsername").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const confirm = document.getElementById("regConfirmPassword").value;
      const agree = document.getElementById("agreeTerms").checked;

      if (!fullName || !username || !email || !password || !confirm) {
        alert("plz fill all fields");
        return;
      }

      if (password !== confirm) {
        alert("passwords dont match!");
        return;
      }

      if (password.length < 8) {
        alert("password must be at least 8 chars");
        return;
      }

      if (!agree) {
        alert("plz agree to terms");
        return;
      }

      console.log("registration:", username, email);

      // fake register
      localStorage.setItem("userLoggedIn", "true");
      localStorage.setItem("username", username);

      alert("Registration successful!");
      window.location.href = "game.html";
    });
  }
});
