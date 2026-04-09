// password strength checker
// returns a score 0-100 based on how strong the password is
function checkPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 25; // min length
  if (pw.length >= 12) score += 25; // bonus for longer
  if (/[A-Z]/.test(pw)) score += 25; // has uppercase letter
  if (/[0-9]/.test(pw)) score += 25; // has a number
  return score;
}

// update the visual strength bar in register form
// called everytime user types in password field
function updateStrengthBar(pw) {
  let sBar = document.getElementById("strengthBar");
  if (!sBar) return; // not on register page

  let strScore = checkPasswordStrength(pw);
  sBar.style.width = strScore + "%";

  // color changes based on strength
  if (strScore <= 25) {
    sBar.style.background = "#ef4444"; // red = weak
  } else if (strScore <= 50) {
    sBar.style.background = "#f59e0b"; // orange = ok
  } else if (strScore <= 75) {
    sBar.style.background = "#eab308"; // yellow = good
  } else {
    sBar.style.background = "#10b981"; // green = strong!
  }
}

// simple email check - just check it has @ and a dot
function checkEmailValid(emailStr) {
  return emailStr.includes("@") && emailStr.includes(".");
}

// show error message inside register form
// same idea as login error box
function showRegisterError(errMsg) {
  let errBox = document.getElementById("registerErrorBox");

  if (!errBox) {
    errBox = document.createElement("div");
    errBox.id = "registerErrorBox";
    errBox.style.cssText =
      "color:#ff4d4d; background:rgba(255,77,77,0.1); border:1px solid rgba(255,77,77,0.4); padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px;";

    let frm = document.getElementById("registerForm");
    if (frm) frm.insertBefore(errBox, frm.firstChild);
  }

  errBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + errMsg;

  // clear after 5 sec
  setTimeout(() => {
    if (errBox) errBox.innerHTML = "";
  }, 5000);
}

// main registration form setup
function setupRegisterForm() {
  let regFrm = document.getElementById("registerForm");
  if (!regFrm) return; // if no register form on this page skip

  // attach password strength event - update bar as user types
  // i check for both id names becuase some pages use different id
  let passFieldEl =
    document.getElementById("regPassword") ||
    document.getElementById("newPassword");

  if (passFieldEl) {
    passFieldEl.addEventListener("input", function () {
      updateStrengthBar(this.value);
    });
  }

  // main submit event
  regFrm.addEventListener("submit", async function (ev) {
    ev.preventDefault();

    // read all form values
    let fullNm = document.getElementById("regFullName")?.value?.trim() || "";
    let uNm = document.getElementById("regUsername")?.value?.trim() || "";
    let emailNm = document.getElementById("regEmail")?.value?.trim() || "";
    let passNm = document.getElementById("regPassword")?.value || "";
    let confPassNm = document.getElementById("regConfirmPassword")?.value || "";
    let termsOk = document.getElementById("agreeTerms")?.checked || false;

    // --- validation ---
    if (!fullNm || !uNm || !emailNm || !passNm || !confPassNm) {
      showRegisterError("Please fill in all fields");
      return;
    }

    if (!termsOk) {
      showRegisterError("You must agree to Terms & Privacy Policy");
      return;
    }

    if (!checkEmailValid(emailNm)) {
      showRegisterError("Please enter a valid email address");
      return;
    }

    if (uNm.length < 3) {
      showRegisterError("Username must be atleast 3 characters long");
      return;
    }

    if (passNm.length < 8) {
      showRegisterError("Password must be atleast 8 characters");
      return;
    }

    if (passNm !== confPassNm) {
      showRegisterError("Passwords do not match!");
      return;
    }

    // weak password just log a warning but dont block
    let pwStrength = checkPasswordStrength(passNm);
    if (pwStrength <= 25) {
      console.log("weak password but user allowed to proceed");
    }

    // show loading state on button
    let subBtn = regFrm.querySelector("button[type='submit']");
    let origBtnTxt = subBtn ? subBtn.innerHTML : "";
    if (subBtn) {
      subBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Registering...';
      subBtn.disabled = true;
    }

    try {
      // send registration data to server API
      // server will hash password, save to MongoDB and return JWT token
      let regRes = await fetch("http://localhost:3000/api/reg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: fullNm,
          username: uNm,
          email: emailNm,
          password: passNm,
          confirmPass: confPassNm,
        }),
      });

      let regData = await regRes.json();

      if (regRes.ok) {
        // auto-login after successful registration
        // save token and username as cookies (virtual identity established!)
        setCookie("authToken", regData.token, 15);
        setCookie("loggedUser", regData.user.name, 15);

        console.log("registration success for:", uNm);
        alert("Registration successful! Welcome Detective " + uNm + "!");

        // close modal and refresh header
        if (window.closeModals) window.closeModals();
        if (window.updateHeaderAuth) window.updateHeaderAuth();

        // if on a dedicated register page redirect to home
        if (window.location.pathname.includes("register.html")) {
          window.location.href = "index.html";
        }
      } else {
        // server returned error (username taken etc)
        showRegisterError(
          regData.msg ||
            "Registration failed. Username or email might already exist.",
        );
      }
    } catch (err) {
      console.log("registration error:", err);
      showRegisterError(
        "Cannot connect to server. Make sure server is running.",
      );
    } finally {
      // always restore button
      if (subBtn) {
        subBtn.innerHTML = origBtnTxt;
        subBtn.disabled = false;
      }
    }
  });
}

// run on page load
document.addEventListener("DOMContentLoaded", function () {
  setupRegisterForm();
});
