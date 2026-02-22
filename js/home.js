// show login modal
function showLogin() {
  document.getElementById("loginModal").classList.add("active");
  // hide register if open
  document.getElementById("registerModal").classList.remove("active");
}

// show register modal
function showRegister() {
  document.getElementById("registerModal").classList.add("active");
  // hide login if open
  document.getElementById("loginModal").classList.remove("active");
}

// close all modals
function closeModals() {
  document.getElementById("loginModal").classList.remove("active");
  document.getElementById("registerModal").classList.remove("active");
}

// switch from login to register
function switchToRegister() {
  closeModals();
  showRegister();
}

// switch from register to login
function switchToLogin() {
  closeModals();
  showLogin();
}

// toggle password visibility
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
  const loginModal = document.getElementById("loginModal");
  const registerModal = document.getElementById("registerModal");

  if (e.target === loginModal) {
    closeModals();
  }
  if (e.target === registerModal) {
    closeModals();
  }
});

// handle login form submission
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      // basic validation
      if (!username || !password) {
        alert("Please fill in all fields");
        return;
      }

      console.log("Login attempt:", username);

      alert("Login successful! Redirecting to game...");
      window.location.href = "game.html";
    });
  }

  // handle register form
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const fullName = document.getElementById("regFullName").value;
      const username = document.getElementById("regUsername").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const confirmPassword =
        document.getElementById("regConfirmPassword").value;
      const agreeTerms = document.getElementById("agreeTerms").checked;

      // validation
      if (!fullName || !username || !email || !password || !confirmPassword) {
        alert("Please fill in all fields");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      if (password.length < 8) {
        alert("Password must be at least 8 characters");
        return;
      }

      if (!agreeTerms) {
        alert("Please agree to terms and privacy policy");
        return;
      }

      console.log("Registration:", username, email);

      // TODO: add actual registration later
      alert("Registration successful! You can now login.");
      switchToLogin();
    });
  }
});
