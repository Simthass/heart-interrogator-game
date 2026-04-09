// --- modal open/close/switch ---
// these must be window.* globals becuase they called from injected header html

window.showLogin = function () {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  if (loginMod) loginMod.classList.add("active");
  if (regMod) regMod.classList.remove("active");
  // clear old errors when opening
  let errEl = document.getElementById("loginErrorBox");
  if (errEl) errEl.innerHTML = "";
};

window.showRegister = function () {
  let regMod = document.getElementById("registerModal");
  let loginMod = document.getElementById("loginModal");
  if (regMod) regMod.classList.add("active");
  if (loginMod) loginMod.classList.remove("active");
};

window.closeModals = function () {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  if (loginMod) loginMod.classList.remove("active");
  if (regMod) regMod.classList.remove("active");
};

window.switchToRegister = function () {
  closeModals();
  showRegister();
};

window.switchToLogin = function () {
  closeModals();
  showLogin();
};

// toggle password field visibility - the eye icon thing
window.togglePassword = function (inputId) {
  let theInput = document.getElementById(inputId);
  if (!theInput) return;
  // if password, make it text so user can see it, else hide again
  if (theInput.type === "password") {
    theInput.type = "text";
  } else {
    theInput.type = "password";
  }
};

// close modal when user click outside of it
window.addEventListener("click", function (e) {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  // if the click was directly on the modal backdrop (not content inside), close it
  if (e.target === loginMod) loginMod.classList.remove("active");
  if (e.target === regMod) regMod.classList.remove("active");
});

// also close if escape key pressed
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (window.closeModals) window.closeModals();
  }
});
