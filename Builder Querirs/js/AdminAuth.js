// Shared logic for AdminLogin.html and AdminSignUp.html
const API_BASE = "http://localhost:5001";

// Respect whatever theme the rest of the site is using
(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
})();

function showAdminError(elId, msg) {
  const el = document.getElementById(elId);
  el.innerHTML = msg ? `<div class="admin-form-error">${msg}</div>` : "";
}

async function adminSignup() {
  showAdminError("signup-error", "");
  const name = document.getElementById("su-name").value.trim();
  const username = document.getElementById("su-username").value.trim();
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-password").value;
  const password2 = document.getElementById("su-password2").value;

  if (!name || !username || !email || !password) {
    showAdminError("signup-error", "Fill in every field to continue.");
    return;
  }
  if (password !== password2) {
    showAdminError("signup-error", "Passwords do not match.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, username, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showAdminError("signup-error", data.msg || "Could not create the account.");
      return;
    }
    window.location.href = "Admin.html";
  } catch (err) {
    showAdminError("signup-error", "Can't reach the server. Is it running on port 5001?");
  }
}

async function adminLogin() {
  showAdminError("login-error", "");
  const username = document.getElementById("li-username").value.trim();
  const password = document.getElementById("li-password").value;

  if (!username || !password) {
    showAdminError("login-error", "Enter your username and password.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showAdminError("login-error", data.msg || "That username or password is wrong.");
      return;
    }
    window.location.href = "Admin.html";
  } catch (err) {
    showAdminError("login-error", "Can't reach the server. Is it running on port 5001?");
  }
}
