document.addEventListener("DOMContentLoaded", function () {
  console.log("Register page ready");

  const registerForm = document.getElementById("registerForm");
  const passwordInput = document.getElementById("newPassword");
  const strengthBar = document.getElementById("strengthBar");

  // password strength checker
  passwordInput.addEventListener("input", function () {
    const password = passwordInput.value;
    let strength = 0;

    // check password strength
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    // update strength bar
    strengthBar.style.width = strength + "%";

    // change color based on strength
    if (strength <= 25) {
      strengthBar.style.background = "#ef4444"; // red
    } else if (strength <= 50) {
      strengthBar.style.background = "#f59e0b"; // orange
    } else if (strength <= 75) {
      strengthBar.style.background = "#eab308"; // yellow
    } else {
      strengthBar.style.background = "#10b981"; // green
    }
  });

  // form submission
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // get all form values
    const fullName = document.getElementById("fullName").value;
    const codename = document.getElementById("codename").value;
    const email = document.getElementById("email").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const country = document.getElementById("country").value;
    const termsAccepted = document.getElementById("terms").checked;

    // validation checks
    if (
      !fullName ||
      !codename ||
      !email ||
      !newPassword ||
      !confirmPassword ||
      !country
    ) {
      alert("Please fill in all fields");
      return;
    }

    // check if passwords match
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // check password length
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    // check terms accepted
    if (!termsAccepted) {
      alert("Please accept the Terms and Privacy Policy");
      return;
    }

    // log the data (will send to API later)
    console.log("Registration data:");
    console.log("Name:", fullName);
    console.log("Codename:", codename);
    console.log("Email:", email);
    console.log("Country:", country);

    // show success
    alert("Registration successful! Welcome, Detective " + codename + "!");

    // redirect to login
    window.location.href = "index.html";
  });
});

// function to go back to login
function goToLogin() {
  window.location.href = "index.html";
}
