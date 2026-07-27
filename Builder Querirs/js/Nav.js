// ═══════════════════════ USER ═══════════════════════
function getUser() {
  const params       = new URLSearchParams(window.location.search);
  const nameFromURL  = params.get("name");
  const emailFromURL = params.get("email");

  if (nameFromURL) {
    const user = { name: nameFromURL, email: emailFromURL || "" };
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  }

  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : { name: "John D.", email: "" };
}

function makeInitials(name) {
  return (name || "?")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function setUserUI(user) {
  if (!user || !user.name) return;
  const initials = makeInitials(user.name);

  document.getElementById("user-display").textContent         = user.name;
  document.getElementById("user-avatar").textContent          = initials;
  document.getElementById("pop-name").textContent             = user.name;
  document.getElementById("pop-email").textContent            = user.email || "";
  document.getElementById("pop-avatar-lg").textContent        = initials;
  document.getElementById("profile-img-initials").textContent = initials;
  document.getElementById("settings-name").value              = user.name;
  document.getElementById("settings-email").value             = user.email || "";

  // Restore saved profile image
  const savedImg = localStorage.getItem("profileImage");
  if (savedImg) applyProfileImage(savedImg);
}

// ═══════════════════════ POP MENU ═══════════════════════
let menuOpen = false;

function toggleMenu(e) {
  e.stopPropagation();
  menuOpen = !menuOpen;
  const menu    = document.getElementById("pop-menu");
  const chevron = document.getElementById("pill-chevron");
  const pill    = document.getElementById("user-pill");

  menu.classList.toggle("open", menuOpen);
  chevron.classList.toggle("rotated", menuOpen);
  pill.setAttribute("aria-expanded", menuOpen);
}

function closeMenu() {
  menuOpen = false;
  document.getElementById("pop-menu").classList.remove("open");
  document.getElementById("pill-chevron").classList.remove("rotated");
  document.getElementById("user-pill").setAttribute("aria-expanded", false);
}

// ═══════════════════════ DARK MODE ═══════════════════════
function toggleDarkMode() {
  const html     = document.documentElement;
  const isDark   = html.getAttribute("data-theme") === "dark";
  const newTheme = isDark ? "light" : "dark";

  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  document.getElementById("dark-toggle").classList.toggle("active", newTheme === "dark");
  document.getElementById("dark-mode-label").textContent = newTheme === "dark" ? "Light Mode" : "Dark Mode";
}

function applyTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  if (saved === "dark") {
    document.getElementById("dark-toggle").classList.add("active");
    document.getElementById("dark-mode-label").textContent = "Light Mode";
  }
}

// ═══════════════════════ SETTINGS MODAL ═══════════════════════
function openSettings() {
  closeMenu();
  const user = getUser();
  document.getElementById("settings-name").value  = user.name  || "";
  document.getElementById("settings-email").value = user.email || "";
  document.getElementById("settings-modal").classList.add("open");
  document.getElementById("settings-name").focus();
}

function closeSettings() {
  document.getElementById("settings-modal").classList.remove("open");
}

function closeSettingsOutside(e) {
  if (e.target === document.getElementById("settings-modal")) closeSettings();
}

function saveSettings() {
  const newName  = document.getElementById("settings-name").value.trim();
  const newEmail = document.getElementById("settings-email").value.trim();
  if (!newName) { showToast("Name cannot be empty"); return; }

  const user = { name: newName, email: newEmail };
  localStorage.setItem("user", JSON.stringify(user));
  setUserUI(user);
  closeSettings();
  showToast("Settings saved!");
}

// ═══════════════════════ PROFILE IMAGE ═══════════════════════
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    localStorage.setItem("profileImage", e.target.result);
    applyProfileImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

function applyProfileImage(src) {
  const img       = document.getElementById("profile-img");
  const initials  = document.getElementById("profile-img-initials");
  const navAvatar = document.getElementById("user-avatar");
  const popAvatar = document.getElementById("pop-avatar-lg");

  img.src = src;
  img.style.display      = "block";
  initials.style.display = "none";

  navAvatar.style.backgroundImage    = `url(${src})`;
  navAvatar.style.backgroundSize     = "cover";
  navAvatar.style.backgroundPosition = "center";
  navAvatar.textContent              = "";

  popAvatar.style.backgroundImage    = `url(${src})`;
  popAvatar.style.backgroundSize     = "cover";
  popAvatar.style.backgroundPosition = "center";
  popAvatar.textContent              = "";

  const removeBtn = document.getElementById("remove-photo-btn");
  if (removeBtn) removeBtn.style.display = "inline-block";
}

function removeProfileImage(event) {
  if (event) event.stopPropagation();

  localStorage.removeItem("profileImage");

  const user      = getUser();
  const initials  = makeInitials(user.name);
  const img       = document.getElementById("profile-img");
  const initialsEl = document.getElementById("profile-img-initials");
  const navAvatar = document.getElementById("user-avatar");
  const popAvatar = document.getElementById("pop-avatar-lg");

  img.src = "";
  img.style.display        = "none";
  initialsEl.style.display = "flex";
  initialsEl.textContent   = initials;

  navAvatar.style.backgroundImage = "";
  navAvatar.textContent           = initials;

  popAvatar.style.backgroundImage = "";
  popAvatar.textContent           = initials;

  const removeBtn = document.getElementById("remove-photo-btn");
  if (removeBtn) removeBtn.style.display = "none";

  showToast("Profile photo removed");
}

// ═══════════════════════ LOGOUT ═══════════════════════
// ═══════════════════════ LOGOUT ═══════════════════════
async function handleLogout() {
  try {
    await fetch("http://localhost:5001/api/auth/logout", {
      method: "POST",
      credentials: "include" // important for passport sessions
    });
  } catch (err) {
    console.warn("Logout API failed (ignored):", err);
  }

  // ✅ Clear all local data (for email login)
  localStorage.removeItem("user");
  localStorage.removeItem("profileImage");
  sessionStorage.clear();

  // ✅ Redirect manually
  window.location.href = "Login.html";
}

// ═══════════════════════ TOAST ═══════════════════════
function showToast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ═══════════════════════ ACTIVE TAB ═══════════════════════
function setActiveTab() {
  const page = document.body.dataset.page || "";
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
}

// ═══════════════════════ INIT ═══════════════════════
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  setUserUI(getUser());
  setActiveTab();

  // Close menu on outside click
  document.addEventListener("click", (e) => {
    if (!document.getElementById("user-pill").contains(e.target) &&
        !document.getElementById("pop-menu").contains(e.target)) {
      closeMenu();
    }
  });

  // Keyboard navigation on pill
  document.getElementById("user-pill").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMenu(e); }
    if (e.key === "Escape") closeMenu();
  });

  // Escape closes all modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeMenu(); closeSettings(); }
  });
});