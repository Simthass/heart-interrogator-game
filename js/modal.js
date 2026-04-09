// modal.js
// controls which modal is open - login, register, or none
// all functions are window.* because theyre called from
// the dynamically injected header.html onclick attributes

window.showLogin = function () {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  if (loginMod) loginMod.classList.add("active");
  if (regMod) regMod.classList.remove("active");
  // wipe any old error messages when reopening
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

// toggle the password input between hidden and visible
window.togglePassword = function (inputId) {
  let input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
};

// close modal when clicking the dark backdrop behind it
window.addEventListener("click", function (e) {
  let loginMod = document.getElementById("loginModal");
  let regMod = document.getElementById("registerModal");
  if (e.target === loginMod) loginMod.classList.remove("active");
  if (e.target === regMod) regMod.classList.remove("active");
});

// escape key also closes modals
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && window.closeModals) window.closeModals();
});
