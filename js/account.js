// account management stuff that isnt registration
// mainly the delete account flow from settings page
// moved out of register.js because register should only handle new accounts

window.showDeleteAccountModal = function () {
  let existing = document.getElementById("deleteAccModal");
  if (existing) {
    existing.style.display = "flex";
    return;
  }

  // build the confirmation modal on the fly
  let modal = document.createElement("div");
  modal.id = "deleteAccModal";
  modal.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;";

  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#004d4f,#002a2b);border:2px solid rgba(255,77,77,0.5);border-radius:18px;padding:32px;max-width:420px;width:90%;font-family:'Rajdhani',sans-serif;">
      <h2 style="color:#ff4d4d;font-family:'Orbitron',sans-serif;font-size:18px;margin-bottom:8px;text-align:center;">
        <i class="fas fa-user-times"></i> DELETE ACCOUNT
      </h2>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;text-align:center;margin-bottom:20px;">
        This permanently deletes your account and all game history. Cannot be undone.
      </p>
      <div style="margin-bottom:16px;">
        <label style="color:rgba(255,255,255,0.7);font-size:13px;display:block;margin-bottom:6px;">Confirm password to delete:</label>
        <input type="password" id="deleteConfirmPass" placeholder="Enter your password"
          style="width:100%;padding:10px 14px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,77,77,0.4);border-radius:8px;color:white;font-size:14px;box-sizing:border-box;" />
      </div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button onclick="confirmDeleteAccount()"
          style="background:rgba(255,77,77,0.15);border:2px solid #ff4d4d;color:#ff4d4d;padding:10px 24px;border-radius:30px;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;">
          <i class="fas fa-trash"></i> DELETE
        </button>
        <button onclick="closeDeleteModal()"
          style="background:transparent;border:2px solid rgba(255,255,255,0.3);color:rgba(255,255,255,0.7);padding:10px 24px;border-radius:30px;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:12px;">
          CANCEL
        </button>
      </div>
      <p id="deleteErrMsg" style="color:#ff4d4d;font-size:12px;text-align:center;margin-top:12px;min-height:18px;"></p>
    </div>
  `;

  document.body.appendChild(modal);
};

window.closeDeleteModal = function () {
  let modal = document.getElementById("deleteAccModal");
  if (modal) modal.style.display = "none";
};

// sends delete request with JWT in header + password in body
// server checks both before deleting anything
window.confirmDeleteAccount = async function () {
  let passEl = document.getElementById("deleteConfirmPass");
  let errEl = document.getElementById("deleteErrMsg");

  if (!passEl || !passEl.value) {
    if (errEl) errEl.innerText = "please enter your password";
    return;
  }

  let token = getCookie("authToken");
  if (!token) {
    if (errEl) errEl.innerText = "not logged in";
    return;
  }

  try {
    let res = await fetch("http://localhost:3000/api/delete-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ password: passEl.value }),
    });

    let data = await res.json();

    if (res.ok) {
      deleteCookie("authToken");
      deleteCookie("loggedUser");
      deleteCookie("loggedId");
      localStorage.clear();
      alert("Account deleted. Goodbye Detective.");
      window.location.href = "index.html";
    } else {
      if (errEl) errEl.innerText = data.msg || "failed, check password";
    }
  } catch (err) {
    console.log("delete error:", err);
    if (errEl) errEl.innerText = "server error";
  }
};

// called from the danger zone button in settings.html
window.deleteAccount = function () {
  if (window.showDeleteAccountModal) window.showDeleteAccountModal();
};
