// handles the login form submit
// sends credentials to the backend, stores the jwt token in a cookie on success
// the jwt token IS the virtual identity from this point forward

function showLoginError(msg) {
  let errBox = document.getElementById("loginErrorBox");

  if (!errBox) {
    errBox = document.createElement("div");
    errBox.id = "loginErrorBox";
    errBox.style.cssText =
      "color:#ff4d4d;background:rgba(255,77,77,0.1);border:1px solid rgba(255,77,77,0.4);padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:12px;";
    let frm = document.getElementById("loginForm");
    if (frm) frm.insertBefore(errBox, frm.firstChild);
  }

  errBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + msg;

  setTimeout(() => {
    if (errBox) errBox.innerHTML = "";
  }, 4000);
}

function setupLoginForm() {
  let frm = document.getElementById("loginForm");
  if (!frm) return;

  frm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let uname = document.getElementById("username").value.trim();
    let pass = document.getElementById("password").value;
    let rememberMe = document.getElementById("rememberMe")?.checked || false;

    if (!uname || !pass) {
      showLoginError("please enter username and password");
      return;
    }

    let btn = frm.querySelector("button[type='submit']");
    let origHtml = btn ? btn.innerHTML : "";
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      btn.disabled = true;
    }

    try {
      // POST to the login endpoint - server verifies password against bcrypt hash
      // if valid, server sends back a signed JWT token
      let res = await fetch("http://localhost:3000/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password: pass }),
      });

      let data = await res.json();

      if (res.ok) {
        // store the JWT in a cookie - this is how we prove identity on future requests
        // remember me = 15 days, otherwise just 1 day
        let days = rememberMe ? 15 : 1;
        setCookie("authToken", data.token, days);
        setCookie("loggedUser", data.user.name, days);

        alert("Welcome back " + data.user.name + "!");

        if (window.closeModals) window.closeModals();
        if (window.updateHeaderAuth) window.updateHeaderAuth();

        if (window.location.pathname.includes("login.html")) {
          window.location.href = "index.html";
        }
      } else {
        showLoginError(data.msg || "login failed, check your details");
      }
    } catch (err) {
      console.log("login fetch error:", err);
      showLoginError(
        "cant connect to server, make sure its running on port 3000",
      );
    } finally {
      if (btn) {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", setupLoginForm);
