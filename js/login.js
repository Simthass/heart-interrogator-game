// this function sets up the login form event listener
// it gets called on DOMContentLoaded at bottom of this file
function setupLoginForm() {
  let loginFrm = document.getElementById("loginForm");
  if (!loginFrm) return; // not on a page with login form, skip

  loginFrm.addEventListener("submit", async function (evnt) {
    evnt.preventDefault(); // stop page from refreshing

    // get values from the form inputs
    let uNameInput = document.getElementById("username").value.trim();
    let pWordInput = document.getElementById("password").value;
    let remMeCheck = document.getElementById("rememberMe")?.checked || false;

    // basic check - dont even go to server if empty
    if (!uNameInput || !pWordInput) {
      showLoginError("Please enter username and password");
      return;
    }

    // disable button so user cant click twice
    let subBtn = loginFrm.querySelector("button[type='submit']");
    let origBtnHtml = subBtn ? subBtn.innerHTML : "";
    if (subBtn) {
      subBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      subBtn.disabled = true;
    }

    try {
      // send credentials to our Node.js backend server
      // this is the authentication / virtual identity part
      // server will verify password and return a JWT token
      let serverRes = await fetch("http://localhost:3000/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: uNameInput,
          password: pWordInput,
        }),
      });

      let resData = await serverRes.json();

      if (serverRes.ok) {
        // login worked! save the JWT token in a cookie
        // JWT token is how we prove who we are on future requests (virtual identity)
        // if remember me checked, keep cookie for 15 days, else just 1 day
        let cookieLifeDays = remMeCheck ? 15 : 1;
        setCookie("authToken", resData.token, cookieLifeDays);
        setCookie("loggedUser", resData.user.name, cookieLifeDays);

        console.log("login ok for user:", resData.user.name);
        alert("Login successful! Welcome back " + resData.user.name);

        // close modal and refresh the header to show username
        if (window.closeModals) window.closeModals();
        if (window.updateHeaderAuth) window.updateHeaderAuth();

        // if user was on the login.html page directly, redirect home
        if (window.location.pathname.includes("login.html")) {
          window.location.href = "index.html";
        }
      } else {
        // server returned an error (wrong password etc)
        showLoginError(
          resData.msg || "Login failed. Check your details and try again.",
        );
      }
    } catch (networkErr) {
      // cant connect to server at all
      console.log("login fetch error:", networkErr);
      showLoginError(
        "Cannot connect to server. Make sure server is running on port 3000.",
      );
    } finally {
      // always re-enable the button whether success or fail
      if (subBtn) {
        subBtn.innerHTML = origBtnHtml;
        subBtn.disabled = false;
      }
    }
  });
}

// show error message inside login form
// creates the error div if it doesnt exist yet
function showLoginError(errMsg) {
  let errBox = document.getElementById("loginErrorBox");

  // if error box not exist, create it and put it inside form
  if (!errBox) {
    errBox = document.createElement("div");
    errBox.id = "loginErrorBox";
    errBox.style.cssText =
      "color:#ff4d4d; background:rgba(255,77,77,0.1); border:1px solid rgba(255,77,77,0.4); padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:12px;";

    let loginFrm = document.getElementById("loginForm");
    if (loginFrm) {
      loginFrm.insertBefore(errBox, loginFrm.firstChild);
    }
  }

  errBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + errMsg;

  // auto clear message after 4 sec so it doesnt stay forever
  setTimeout(() => {
    if (errBox) errBox.innerHTML = "";
  }, 4000);
}

// run setup when page is ready
document.addEventListener("DOMContentLoaded", function () {
  setupLoginForm();
});
