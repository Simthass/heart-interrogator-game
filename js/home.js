// cookie functions for saving session
function setCookie(cname, cvalue, days) {
  let d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function deleteCookie(cname) {
  document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// fixing the innerhtml scope bug by putting header funcs here globally
window.updateHeaderAuth = function () {
  let authSecBox = document.getElementById("auth-section");
  if (!authSecBox) return;

  let loggedUser = getCookie("loggedUser");
  let secureToken = getCookie("authToken");

  // check if we have the secure token
  if (loggedUser && secureToken && secureToken !== "") {
    // user is logged in
    authSecBox.innerHTML = `
      <span class="user-display" style="color: var(--cream); margin-right: 15px; display: flex; align-items: center; gap: 8px; background: rgba(254, 158, 132, 0.1); padding: 5px 15px; border-radius: 30px; border: 1px solid rgba(254, 158, 132, 0.3);">
        <i class="fas fa-user-secret" style="color: var(--coral);"></i>
        <span style="font-weight: 600; font-family: 'Orbitron', sans-serif;">${loggedUser}</span>
      </span>
      <button onclick="handleLogout()" style="background: transparent; border: 2px solid var(--coral); color: var(--coral); padding: 8px 16px; border-radius: 30px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    `;
  } else {
    // not logged in show buttons
    authSecBox.innerHTML = `
      <button onclick="showLogin()" style="background: transparent; border: 2px solid var(--coral); color: var(--coral); padding: 8px 20px; border-radius: 30px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
        <i class="fas fa-sign-in-alt"></i> Login
      </button>
      <button onclick="showRegister()" style="background: var(--coral); border: 2px solid var(--coral); color: var(--teal-dark); padding: 8px 20px; border-radius: 30px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
        <i class="fas fa-user-plus"></i> Register
      </button>
    `;
  }
};

window.handleLogout = function () {
  if (confirm("Are you sure you want to logout?")) {
    deleteCookie("loggedUser");
    deleteCookie("authToken"); // remove token
    deleteCookie("loggedId"); // keep this just to clear old data
    localStorage.clear();
    window.location.href = "index.html";
  }
};

window.setActiveNav = function () {
  let path = window.location.pathname;
  let page = path.split("/").pop() || "index.html";

  let hLink = document.getElementById("nav-home");
  let sLink = document.getElementById("nav-stats");
  let setLink = document.getElementById("nav-settings");

  if (hLink) hLink.classList.remove("active");
  if (sLink) sLink.classList.remove("active");
  if (setLink) setLink.classList.remove("active");

  if (page === "index.html" || page === "") {
    if (hLink) hLink.classList.add("active");
  } else if (page === "stats.html") {
    if (sLink) sLink.classList.add("active");
  } else if (page === "settings.html") {
    if (setLink) setLink.classList.add("active");
  }
};

// setup login form submit
function setupLoginForm() {
  let loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let uNameInp = document.getElementById("username").value;
    let pWordInp = document.getElementById("password").value;
    let rememberMe = document.getElementById("rememberMe")?.checked || false;

    if (!uNameInp || !pWordInp) {
      alert("Please enter username and password");
      return;
    }

    try {
      let res = await fetch("http://localhost:3000/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uNameInp, password: pWordInp }),
      });

      let data = await res.json();

      if (res.ok) {
        let days = rememberMe ? 15 : 1;
        // save the secure token instead of raw ID
        setCookie("authToken", data.token, days);
        setCookie("loggedUser", data.user.name, days);

        alert("Login successful! Welcome back " + data.user.name);
        window.location.href = "index.html";
      } else {
        alert(data.msg || "Login failed try again");
      }
    } catch (err) {
      console.log("login error:", err);
      alert("Cannot connect to server. Make sure server is running.");
    }
  });
}

// setup register form submit
function setupRegisterForm() {
  let registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let fullnameInp = document.getElementById("regFullName").value;
    let usernameInp = document.getElementById("regUsername").value;
    let emailInp = document.getElementById("regEmail").value;
    let passwordInp = document.getElementById("regPassword").value;
    let confirmPassInp = document.getElementById("regConfirmPassword").value;
    let agreeTermsBox = document.getElementById("agreeTerms")?.checked || false;

    if (
      !fullnameInp ||
      !usernameInp ||
      !emailInp ||
      !passwordInp ||
      !confirmPassInp
    ) {
      alert("Please fill all fields");
      return;
    }

    if (!agreeTermsBox) {
      alert("You must agree to Terms & Privacy");
      return;
    }

    if (passwordInp !== confirmPassInp) {
      alert("Passwords do not match!");
      return;
    }

    if (passwordInp.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    if (usernameInp.length < 3) {
      alert("Username must be at least 3 characters");
      return;
    }

    if (!emailInp.includes("@") || !emailInp.includes(".")) {
      alert("Please enter a valid email");
      return;
    }

    try {
      let res = await fetch("http://localhost:3000/api/reg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: fullnameInp,
          username: usernameInp,
          email: emailInp,
          password: passwordInp,
          confirmPass: confirmPassInp,
        }),
      });
      let data = await res.json();

      if (res.ok) {
        // auto login by saving secure token
        setCookie("authToken", data.token, 15);
        setCookie("loggedUser", data.user.name, 15);

        alert("Registration successful! Welcome " + usernameInp);
        window.location.href = "index.html";
      } else {
        alert(data.msg || "Registration failed");
      }
    } catch (err) {
      console.log("registration error:", err);
      alert("Cannot connect to server. Make sure server is running.");
    }
  });
}

// modals display
window.showLogin = function () {
  let loginModal = document.getElementById("loginModal");
  if (loginModal) {
    loginModal.classList.add("active");
    let registerModal = document.getElementById("registerModal");
    if (registerModal) registerModal.classList.remove("active");
  }
};

window.showRegister = function () {
  let registerModal = document.getElementById("registerModal");
  if (registerModal) {
    registerModal.classList.add("active");
    let loginModal = document.getElementById("loginModal");
    if (loginModal) loginModal.classList.remove("active");
  }
};

window.closeModals = function () {
  let loginModal = document.getElementById("loginModal");
  let registerModal = document.getElementById("registerModal");

  if (loginModal) loginModal.classList.remove("active");
  if (registerModal) registerModal.classList.remove("active");
};

window.switchToRegister = function () {
  closeModals();
  showRegister();
};

window.switchToLogin = function () {
  closeModals();
  showLogin();
};

window.togglePassword = function (inputId) {
  let input = document.getElementById(inputId);
  if (input) {
    if (input.type === "password") {
      input.type = "text";
    } else {
      input.type = "password";
    }
  }
};

// init stuff
document.addEventListener("DOMContentLoaded", function () {
  setupLoginForm();
  setupRegisterForm();
});
