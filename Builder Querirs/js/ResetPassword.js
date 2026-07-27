const API_BASE = "http://localhost:5001";

// ==========================
// TOAST (SAFE + FALLBACK)
// ==========================
function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");

  if (!toast || !toastMsg) {
    alert(msg);
    return;
  }

  toastMsg.textContent = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==========================
// TOKEN (from the emailed link, e.g. ResetPassword.html?token=abc123)
// ==========================
function getResetToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

let resetToken = "";

// ==========================
// RESET PASSWORD HANDLER
// ==========================
async function handleResetPassword() {
  const password = document.getElementById("reset-pass").value;
  const confirm   = document.getElementById("reset-pass-confirm").value;

  if (!password || password.length < 6) {
    showToast("Password must be at least 6 characters");
    return;
  }
  if (password !== confirm) {
    showToast("Passwords don't match");
    return;
  }
  if (!resetToken) {
    showToast("Missing or invalid reset link");
    return;
  }

  const btn = document.getElementById("reset-submit-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Updating…"; }

  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password/${encodeURIComponent(resetToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      // Token invalid/expired, or some other validation error from the server
      if (res.status === 400 || res.status === 401) {
        document.getElementById("reset-form").style.display = "none";
        document.getElementById("reset-invalid").style.display = "block";
      } else {
        showToast(data.msg || "Could not reset password. Please try again.");
      }
      return;
    }

    document.getElementById("reset-form").style.display = "none";
    document.getElementById("reset-success").style.display = "block";
    setTimeout(() => { window.location.href = "Login.html"; }, 1800);
  } catch (err) {
    console.error("Reset password error:", err);
    showToast("Server error. Please try again.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Reset password"; }
  }
}

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  resetToken = getResetToken();

  if (!resetToken) {
    document.getElementById("reset-form").style.display = "none";
    document.getElementById("reset-invalid").style.display = "block";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleResetPassword();
  });
});