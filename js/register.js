// handles new account creation
// also includes password strength checker used in the register form

// quick check - just needs @ and a dot, proper validation is on the server
function isEmailValid(email) {
  return email.includes("@") && email.includes(".");
}

// returns 0-100 score based on password complexity
// used to drive the strength bar colour in the form
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 25;
  if (pw.length >= 12) score += 25;
  if (/[A-Z]/.test(pw)) score += 25;
  if (/[0-9]/.test(pw)) score += 25;
  return score;
}

function updateStrengthBar(pw) {
  let bar = document.getElementById("strengthBar");
  if (!bar) return;

  let strength = getPasswordStrength(pw);
  bar.style.width = strength + "%";

  if (strength <= 25) bar.style.background = "#ef4444";
  else if (strength <= 50) bar.style.background = "#f59e0b";
  else if (strength <= 75) bar.style.background = "#eab308";
  else bar.style.background = "#10b981";
}

function showRegisterError(msg) {
  let errBox = document.getElementById("registerErrorBox");

  if (!errBox) {
    errBox = document.createElement("div");
    errBox.id = "registerErrorBox";
    errBox.style.cssText =
      "color:#ff4d4d;background:rgba(255,77,77,0.1);border:1px solid rgba(255,77,77,0.4);padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:12px;";
    let frm = document.getElementById("registerForm");
    if (frm) frm.insertBefore(errBox, frm.firstChild);
  }

  errBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + msg;

  setTimeout(() => {
    if (errBox) errBox.innerHTML = "";
  }, 5000);
}

function setupRegisterForm() {
  let frm = document.getElementById("registerForm");
  if (!frm) return;

  // hook up the password strength bar as they type
  let passField =
    document.getElementById("regPassword") ||
    document.getElementById("newPassword");
  if (passField) {
    passField.addEventListener("input", function () {
      updateStrengthBar(this.value);
    });
  }

  frm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let fullname = document.getElementById("regFullName")?.value?.trim() || "";
    let username = document.getElementById("regUsername")?.value?.trim() || "";
    let email = document.getElementById("regEmail")?.value?.trim() || "";
    let password = document.getElementById("regPassword")?.value || "";
    let confirm = document.getElementById("regConfirmPassword")?.value || "";
    let termsOk = document.getElementById("agreeTerms")?.checked || false;

    if (!fullname || !username || !email || !password || !confirm) {
      showRegisterError("please fill in all fields");
      return;
    }

    if (!termsOk) {
      showRegisterError("you need to agree to the terms");
      return;
    }

    if (!isEmailValid(email)) {
      showRegisterError("email doesnt look right");
      return;
    }

    if (username.length < 3) {
      showRegisterError("username needs at least 3 characters");
      return;
    }

    if (password.length < 8) {
      showRegisterError("password needs at least 8 characters");
      return;
    }

    if (password !== confirm) {
      showRegisterError("passwords dont match");
      return;
    }

    let btn = frm.querySelector("button[type='submit']");
    let origHtml = btn ? btn.innerHTML : "";
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
      btn.disabled = true;
    }

    try {
      let res = await fetch("http://localhost:3000/api/reg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          username,
          email,
          password,
          confirmPass: confirm,
        }),
      });

      let data = await res.json();

      if (res.ok) {
        // auto-login after successful reg - save token + username to cookies
        setCookie("authToken", data.token, 15);
        setCookie("loggedUser", data.user.name, 15);

        alert("Welcome Detective " + username + "!");

        if (window.closeModals) window.closeModals();
        if (window.updateHeaderAuth) window.updateHeaderAuth();

        if (window.location.pathname.includes("register.html")) {
          window.location.href = "index.html";
        }
      } else {
        showRegisterError(
          data.msg || "registration failed, try a different username",
        );
      }
    } catch (err) {
      console.log("register error:", err);
      showRegisterError("cant connect to server");
    } finally {
      if (btn) {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", setupRegisterForm);
