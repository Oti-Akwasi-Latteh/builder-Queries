// ==========================
// TOAST (SAFE + FALLBACK)
// ==========================
function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");

  // If toast UI not present, fallback to alert
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
// LOGIN HANDLER
// ==========================
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pass").value.trim();

  // 🔒 Validation
  if (!email || !password) {
    showToast("Please enter your email and password");
    return;
  }

  try {
    const res = await fetch("http://localhost:5001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Handle invalid JSON safely
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    // ❌ Login failed
    if (!res.ok) {
      showToast(data.msg || "Login failed");
      return;
    }

    // ✅ Store user safely
    const user = data.user || data;

    localStorage.setItem(
      "user",
      JSON.stringify({
        name: user.name || "User",
        email: user.email,
      })
    );

    showToast("Login successful 🎉");

    // ⏳ Redirect after short delay
    setTimeout(() => {
      window.location.href = "Dashboard.html";
    }, 1000);

  } catch (err) {
    console.error("Login Error:", err);
    showToast("Server error. Please try again.");
  }
}

// ==========================
// EVENT LISTENER (BEST PRACTICE)
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");

  if (btn) {
    btn.addEventListener("click", handleLogin);
  }

  // Optional: press Enter to login
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  });
});