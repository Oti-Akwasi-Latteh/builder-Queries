function showToast(msg) {
  const t = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');

  if (!t || !msgEl) {
    alert(msg); // fallback
    return;
  }

  msgEl.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

document.getElementById("signupBtn")?.addEventListener("click", handleSignup);

async function handleSignup() {
  const firstName = document.getElementById('signup-first').value.trim();
  const lastName = document.getElementById('signup-last').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-pass').value.trim();

  if (!firstName || !lastName || !email || !password) {
    showToast("All fields are required");
    return;
  }

  try {
    const res = await fetch("http://localhost:5001/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ firstName, lastName, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.msg || "Signup failed");
      return;
    }

    showToast("Account created successfully 🎉");

    localStorage.setItem("user", JSON.stringify({
      name: firstName + " " + lastName,
      email
    }));

    setTimeout(() => {
      window.location.href = "Dashboard.html";
    }, 1500);

  } catch (err) {
    console.error(err);
    showToast("Server error");
  }
}