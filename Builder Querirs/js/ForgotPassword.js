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
// FORGOT PASSWORD HANDLER
// ==========================
async function handleForgotPassword() {
  const email = document.getElementById("forgot-email").value.trim();

  if (!email || !email.includes("@")) {
    showToast("Please enter a valid email address");
    return;
  }

  const btn = document.getElementById("forgot-submit-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      showToast(data.msg || "Something went wrong. Please try again.");
      return;
    }

    // Backend always returns a generic success message here — whether or not
    // the email exists — so we never reveal which emails are registered.
    document.getElementById("forgot-form").style.display = "none";
    document.getElementById("forgot-success").style.display = "block";
  } catch (err) {
    console.error("Forgot password error:", err);
    showToast("Server error. Please try again.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Send reset link"; }
  }
}

// ==========================
// EVENT LISTENERS
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleForgotPassword();
  });
});