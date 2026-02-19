// wait for page to load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Login page loaded");

  // get form element
  const loginForm = document.getElementById("loginForm");

  // add submit event listener
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault(); // prevent default form submission

    // get input values
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    // simple validation
    if (username === "" || password === "") {
      alert("Please fill in all fields");
      return;
    }

    // TODO: will add API call later for authentication
    // for now just log values
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("Remember me:", rememberMe);

    // show success message
    alert("Login successful! Redirecting to dashboard...");

    // redirect to dashboard (just for UI demo)
    window.location.href = "dashboard.html";
  });
});

// function to toggle password visibility
function togglePassword() {
  const passwordInput = document.getElementById("password");

  // check current type
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
  } else {
    passwordInput.type = "password";
  }
}

// function to go to register page
function goToRegister() {
  window.location.href = "register.html";
}
