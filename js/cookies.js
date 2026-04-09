// just the cookie helpers - get, set, delete

function setCookie(name, value, days) {
  let d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  // path=/ so the cookie works on every page not just the current folder
  document.cookie =
    name + "=" + value + ";expires=" + d.toUTCString() + ";path=/";
}

function getCookie(name) {
  let prefix = name + "=";
  let allCookies = document.cookie.split(";");
  for (let i = 0; i < allCookies.length; i++) {
    let c = allCookies[i].trim();
    if (c.indexOf(prefix) === 0) {
      return c.substring(prefix.length);
    }
  }
  return "";
}

function deleteCookie(name) {
  // setting an expired date forces the browser to remove it
  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
}
