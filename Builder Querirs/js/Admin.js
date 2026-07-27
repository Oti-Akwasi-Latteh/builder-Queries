// js/Admin.js — powers Admin.html
const API_BASE = "http://localhost:5001";

let ME = null;
let DB = { users: [], projects: [], messages: [], bookings: [] };
let bookingFilter = "all";
let projectFilter = "all";
let mapInstance = null;
let mapMarkers = {};
let simTimer = null;
let pollTimer = null;

/* ---------------- fetch helpers ---------------- */
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (res.status === 401) {
    window.location.href = "AdminLogin.html";
    throw new Error("Not authenticated");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || "Request failed");
  return data;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function money(n) { return "GHS " + Number(n || 0).toLocaleString(); }

/* ---------------- toast (reuses Shared.css .toast) ---------------- */
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------------- theme (matches the rest of the site) ---------------- */
function applyTheme() {
  const saved = localStorage.getItem("theme");
  const isDark = saved === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  document.getElementById("dark-toggle").classList.toggle("active", isDark);
}
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = !isDark;
  document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  document.getElementById("dark-toggle").classList.toggle("active", next);
  localStorage.setItem("theme", next ? "dark" : "light");
}

/* ---------------- nav pop menu ---------------- */
function toggleAdminMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById("pop-menu");
  const chevron = document.getElementById("pill-chevron");
  const open = menu.classList.toggle("open");
  chevron.classList.toggle("rotated", open);
  document.getElementById("user-pill").setAttribute("aria-expanded", open);
}
document.addEventListener("click", (e) => {
  const menu = document.getElementById("pop-menu");
  const pill = document.getElementById("user-pill");
  if (menu && !menu.contains(e.target) && !pill.contains(e.target)) {
    menu.classList.remove("open");
    document.getElementById("pill-chevron").classList.remove("rotated");
  }
});

async function handleAdminLogout() {
  try { await api("/api/admin/logout", { method: "POST" }); } catch (e) {}
  window.location.href = "AdminLogin.html";
}

/* ---------------- view switching (top tabs) ---------------- */
function switchView(view) {
  document.querySelectorAll(".admin-view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("view-" + view).classList.add("active");
  document.querySelector(`.tab-btn[data-view="${view}"]`).classList.add("active");
  if (view === "map") setTimeout(initMap, 30);
}
document.getElementById("admin-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (btn) switchView(btn.dataset.view);
});

function closeModal(id) { document.getElementById(id).classList.remove("open"); }
function openModalEl(id) { document.getElementById(id).classList.add("open"); }

/* ---------------- boot / auth guard ---------------- */
async function boot() {
  applyTheme();
  try {
    const data = await api("/api/admin/me");
    ME = data.admin;
  } catch (e) {
    return; // api() already redirected to AdminLogin.html
  }
  document.getElementById("auth-veil").style.display = "none";
  const initials = ME.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("admin-avatar").textContent = initials;
  document.getElementById("pop-avatar-lg").textContent = initials;
  document.getElementById("admin-display").textContent = ME.name;
  document.getElementById("pop-name").textContent = ME.name;
  document.getElementById("pop-email").textContent = ME.email;
  document.getElementById("hero-name").textContent = ME.name.split(" ")[0];

  await loadAll();
  renderAll();
  pollTimer = setInterval(async () => { await loadAll(); renderAll(); }, 15000); // background refresh
}

async function loadAll() {
  const [usersRes, projectsRes, messagesRes, bookingsRes] = await Promise.all([
    api("/api/admin/users"),
    api("/api/admin/projects"),
    api("/api/admin/messages"),
    api("/api/admin/bookings")
  ]);
  DB.users = usersRes.users;
  DB.projects = projectsRes.projects;
  DB.messages = messagesRes.messages;
  DB.bookings = bookingsRes.bookings;
}

function renderAll() {
  renderOverview();
  renderUsers();
  renderProjectFilters();
  renderProjects();
  renderMessages();
  renderBookings();
  updateTabCounts();
  if (mapInstance) refreshMapMarkers();
}

function updateTabCounts() {
  const unread = DB.messages.filter((m) => m.status === "unread").length;
  const pending = DB.bookings.filter((b) => b.status === "pending").length;
  document.getElementById("tab-count-messages").textContent = unread ? ` (${unread})` : "";
  document.getElementById("tab-count-bookings").textContent = pending ? ` (${pending})` : "";
}

/* ---------------- overview ---------------- */
function renderOverview() {
  document.getElementById("stat-users").textContent = DB.users.length;
  document.getElementById("stat-users-sub").textContent = DB.users.filter((u) => u.status === "active").length + " active";
  const active = DB.projects.filter((p) => p.status === "active").length;
  document.getElementById("stat-active").textContent = active;
  document.getElementById("stat-projects-sub").textContent = DB.projects.length + " total projects";
  document.getElementById("stat-bookings").textContent = DB.bookings.filter((b) => b.status === "pending").length;
  document.getElementById("stat-messages").textContent = DB.messages.filter((m) => m.status === "unread").length;

  document.getElementById("ov-pending").textContent = DB.projects.filter((p) => p.status === "pending").length;
  document.getElementById("ov-active").textContent = DB.projects.filter((p) => p.status === "active").length;
  document.getElementById("ov-completed").textContent = DB.projects.filter((p) => p.status === "completed").length;

  const recent = [...DB.messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  document.getElementById("ov-messages").innerHTML = recent.length
    ? recent.map(msgHtml).join("")
    : '<div class="admin-empty"><div class="ic">◻</div><p>No messages yet.</p></div>';
}

/* ---------------- users ---------------- */
function renderUsers() {
  const search = (document.getElementById("user-search").value || "").toLowerCase();
  const filter = document.getElementById("user-filter").value;
  const list = DB.users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || u.status === filter;
    return matchesSearch && matchesFilter;
  });
  document.getElementById("users-empty").style.display = list.length ? "none" : "block";
  document.getElementById("users-table").innerHTML = list.map((u) => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.provider}</td>
      <td>${fmtDate(u.joined)}</td>
      <td><span class="badge ${u.status === "active" ? "badge-active" : "badge-suspended"}">${u.status}</span></td>
      <td class="row-actions">
        <button class="btn-admin btn-admin-ghost btn-admin-sm" onclick="toggleUserStatus('${u.id}', ${u.status === "active"})">${u.status === "active" ? "Suspend" : "Reinstate"}</button>
        <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteUser('${u.id}')">Delete</button>
      </td>
    </tr>`).join("");
}
async function toggleUserStatus(id, currentlyActive) {
  await api(`/api/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !currentlyActive }) });
  await loadAll(); renderAll();
}
async function deleteUser(id) {
  if (!confirm("Delete this user? This cannot be undone.")) return;
  await api(`/api/admin/users/${id}`, { method: "DELETE" });
  showToast("User deleted");
  await loadAll(); renderAll();
}

/* ---------------- projects ---------------- */
function renderProjectFilters() {
  const filters = [["all", "All"], ["pending", "Pending"], ["active", "Active"], ["completed", "Completed"]];
  document.getElementById("project-filters").innerHTML = filters.map(([k, l]) =>
    `<button class="filter-tab ${projectFilter === k ? "active" : ""}" onclick="setProjectFilter('${k}')">${l}</button>`).join("");
}
function setProjectFilter(k) { projectFilter = k; renderProjectFilters(); renderProjects(); }
function renderProjects() {
  const search = (document.getElementById("project-search").value || "").toLowerCase();
  const list = DB.projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search) || p.client.toLowerCase().includes(search);
    const matchesFilter = projectFilter === "all" || p.status === projectFilter;
    return matchesSearch && matchesFilter;
  });
  document.getElementById("projects-empty").style.display = list.length ? "none" : "block";
  document.getElementById("projects-table").innerHTML = list.map((p) => `
    <tr>
      <td>${p.name}</td>
      <td>${p.client}</td>
      <td>${p.loc}</td>
      <td>${money(p.budget)}</td>
      <td>
        <select onchange="updateProjectStatus('${p._id}', this.value)" style="padding:0.3rem 0.5rem;font-size:0.78rem;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);">
          <option value="pending" ${p.status === "pending" ? "selected" : ""}>Pending</option>
          <option value="active" ${p.status === "active" ? "selected" : ""}>Active</option>
          <option value="completed" ${p.status === "completed" ? "selected" : ""}>Completed</option>
        </select>
      </td>
      <td class="row-actions"><button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteProject('${p._id}')">Delete</button></td>
    </tr>`).join("");
}
function openProjectModal() {
  ["np-name", "np-loc", "np-lat", "np-lng", "np-budget"].forEach((id) => document.getElementById(id).value = "");
  document.getElementById("np-status").value = "pending";
  const select = document.getElementById("np-client");
  select.innerHTML = '<option value="">Select a user…</option>' +
    DB.users.map((u) => `<option value="${u.id}" data-name="${u.name}" data-email="${u.email}">${u.name} (${u.email})</option>`).join("");
  openModalEl("project-modal");
}
async function saveProject() {
  const name = document.getElementById("np-name").value.trim();
  const clientSelect = document.getElementById("np-client");
  const clientOpt = clientSelect.selectedOptions[0];
  const clientId = clientSelect.value;
  const client = clientOpt ? clientOpt.dataset.name : "";
  const clientEmail = clientOpt ? clientOpt.dataset.email : "";
  const loc = document.getElementById("np-loc").value.trim();
  const lat = parseFloat(document.getElementById("np-lat").value);
  const lng = parseFloat(document.getElementById("np-lng").value);
  const budget = parseFloat(document.getElementById("np-budget").value) || 0;
  const status = document.getElementById("np-status").value;
  if (!name || !clientId || !loc || isNaN(lat) || isNaN(lng)) {
    showToast("Fill in name, select a client, location and coordinates");
    return;
  }
  // clientId/clientEmail let the user dashboard fetch only projects assigned to them —
  // requires the backend to accept and store these fields on the project record.
  await api("/api/admin/projects", { method: "POST", body: JSON.stringify({ name, client, clientId, clientEmail, loc, lat, lng, budget, status }) });
  closeModal("project-modal");
  showToast("Project added");
  await loadAll(); renderAll();
}
async function updateProjectStatus(id, status) {
  await api(`/api/admin/projects/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  await loadAll(); renderAll();
}
async function deleteProject(id) {
  if (!confirm("Delete this project?")) return;
  await api(`/api/admin/projects/${id}`, { method: "DELETE" });
  showToast("Project deleted");
  await loadAll(); renderAll();
}

/* ---------------- messages ---------------- */
function msgHtml(m) {
  return `<div class="msg-item ${m.status === "unread" ? "unread" : ""}">
    <div class="msg-head">
      <span class="from">${m.name} <span>· ${m.email}</span></span>
      <span class="date">${fmtDate(m.createdAt)}</span>
    </div>
    <div class="msg-body">${m.message}</div>
    <div class="row-actions">
      <span class="badge ${m.status === "unread" ? "badge-unread" : "badge-read"}">${m.status}</span>
      ${m.status === "unread" ? `<button class="btn-admin btn-admin-ghost btn-admin-sm" onclick="markMessageRead('${m._id}')">Mark as read</button>` : ""}
      <a href="mailto:${m.email}" class="btn-admin btn-admin-ghost btn-admin-sm" style="text-decoration:none;">Reply by email</a>
      <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteMessage('${m._id}')">Delete</button>
    </div>
  </div>`;
}
function renderMessages() {
  const list = [...DB.messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById("messages-empty").style.display = list.length ? "none" : "block";
  document.getElementById("messages-list").innerHTML = list.map(msgHtml).join("");
}
async function markMessageRead(id) {
  await api(`/api/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify({ status: "read" }) });
  await loadAll(); renderAll();
}
async function deleteMessage(id) {
  await api(`/api/admin/messages/${id}`, { method: "DELETE" });
  await loadAll(); renderAll();
}

/* ---------------- bookings ---------------- */
function setBookingFilter(f) {
  bookingFilter = f;
  document.querySelectorAll("[data-bf]").forEach((b) => b.classList.toggle("active", b.dataset.bf === f));
  renderBookings();
}
function renderBookings() {
  const list = DB.bookings.filter((b) => bookingFilter === "all" || b.status === bookingFilter);
  document.getElementById("bookings-empty").style.display = list.length ? "none" : "block";
  document.getElementById("bookings-table").innerHTML = list.map((b) => {
    const badgeClass = b.status === "approved" ? "badge-approved" : b.status === "rejected" ? "badge-rejected" : "badge-pending";
    const hasCoords = b.lat != null && b.lng != null;
    return `<tr>
      <td>${b.name}<br><span style="color:var(--text-secondary);font-size:0.76rem;">${b.email}</span></td>
      <td>${b.projectName || b.proName || "—"}${b.proRole ? `<br><span style="color:var(--text-secondary);font-size:0.76rem;">${b.proRole}</span>` : ""}</td>
      <td>${fmtDate(b.date)}</td>
      <td>${b.location || "—"}${hasCoords ? `<br><button class="btn-admin btn-admin-ghost btn-admin-sm" onclick="viewBookingOnMap('${b._id}')" style="margin-top:0.25rem;">📍 View on map</button>` : ""}</td>
      <td><span class="badge ${badgeClass}">${b.status}</span></td>
      <td class="row-actions">
        ${b.status === "pending" ? `
          <button class="btn-admin btn-admin-primary btn-admin-sm" onclick="setBookingStatus('${b._id}','approved')">Approve</button>
          <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="setBookingStatus('${b._id}','rejected')">Reject</button>
        ` : `<button class="btn-admin btn-admin-ghost btn-admin-sm" onclick="setBookingStatus('${b._id}','pending')">Reset</button>`}
      </td>
    </tr>`;
  }).join("");
}
async function setBookingStatus(id, status) {
  await api(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  showToast("Booking " + status);
  await loadAll(); renderAll();
}
function viewBookingOnMap(id) {
  const b = DB.bookings.find((x) => x._id === id);
  if (!b || b.lat == null || b.lng == null) return;
  switchView("map");
  setTimeout(() => {
    initMap();
    mapInstance.setView([b.lat, b.lng], 15);
    const marker = mapMarkers["booking-" + id];
    if (marker) marker.openPopup();
  }, 60);
}

/* ---------------- live map ---------------- */
const statusColor = { pending: "#B8860B", active: "#E8530A", completed: "#1F7A4D" };
function initMap() {
  if (mapInstance) { mapInstance.invalidateSize(); refreshMapMarkers(); return; }
  const first = DB.projects[0];
  const center = first ? [first.lat, first.lng] : [6.6885, -1.6244];
  mapInstance = L.map("admin-map").setView(center, 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "© OpenStreetMap contributors"
  }).addTo(mapInstance);
  refreshMapMarkers();
  if (simTimer) clearInterval(simTimer);
  simTimer = setInterval(simulateMovement, 5000);
}
function refreshMapMarkers() {
  if (!mapInstance) return;
  Object.values(mapMarkers).forEach((m) => mapInstance.removeLayer(m));
  mapMarkers = {};
  DB.projects.forEach((p) => {
    const color = statusColor[p.status] || "#888";
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px ${color};"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8]
    });
    const marker = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance)
      .bindPopup(`<b>${p.name}</b><br>${p.client}<br>Status: ${p.status}`);
    mapMarkers[p._id] = marker;
  });

  // User-submitted booking locations — shown as a pin (not a dot) so they're
  // visually distinct from project status dots. Only bookings where the user
  // typed/shared coordinates (bk-lat/bk-lng on the booking form) show up here.
  DB.bookings.filter((b) => b.lat != null && b.lng != null).forEach((b) => {
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:50% 50% 50% 0;background:#185FA5;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 0 0 1px #185FA5;"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 14]
    });
    const marker = L.marker([b.lat, b.lng], { icon }).addTo(mapInstance)
      .bindPopup(`<b>${b.name}</b> (booking)<br>${b.location || ""}${b.proName ? "<br>Requested: " + b.proName : ""}<br>Status: ${b.status}`);
    mapMarkers["booking-" + b._id] = marker;
  });
}
// Client-side simulation only — swap for real coordinates via
// PATCH /api/admin/projects/:id from your GPS device feed.
function simulateMovement() {
  if (!mapInstance) return;
  DB.projects.forEach((p) => {
    if (p.status !== "active") return;
    p.lat += (Math.random() - 0.5) * 0.0009;
    p.lng += (Math.random() - 0.5) * 0.0009;
    const marker = mapMarkers[p._id];
    if (marker) marker.setLatLng([p.lat, p.lng]);
  });
}

/* ---------------- PDF reports ---------------- */
function pdfHeader(doc, title) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("Builder Queries", 14, 18);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(title, 14, 26);
  doc.setFontSize(9); doc.setTextColor(120);
  doc.text("Generated " + new Date().toLocaleString(), 14, 32);
  doc.setTextColor(0);
  return 40;
}
function downloadFullReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = pdfHeader(doc, "Full console report");

  doc.setFontSize(12); doc.text("Users", 14, y); y += 4;
  doc.autoTable({ startY: y, head: [["Name", "Email", "Status", "Joined"]], body: DB.users.map((u) => [u.name, u.email, u.status, fmtDate(u.joined)]), styles: { fontSize: 9 } });
  y = doc.lastAutoTable.finalY + 10;

  doc.text("Projects", 14, y); y += 4;
  doc.autoTable({ startY: y, head: [["Project", "Client", "Location", "Budget", "Status"]], body: DB.projects.map((p) => [p.name, p.client, p.loc, money(p.budget), p.status]), styles: { fontSize: 9 } });
  y = doc.lastAutoTable.finalY + 10;

  if (y > 250) { doc.addPage(); y = 20; }
  doc.text("Bookings", 14, y); y += 4;
  doc.autoTable({ startY: y, head: [["Requested by", "Project", "Date", "Status"]], body: DB.bookings.map((b) => [b.name, b.projectName || b.proName || "—", fmtDate(b.date), b.status]), styles: { fontSize: 9 } });
  y = doc.lastAutoTable.finalY + 10;

  if (y > 250) { doc.addPage(); y = 20; }
  doc.text("Messages", 14, y); y += 4;
  doc.autoTable({ startY: y, head: [["Name", "Email", "Date", "Status"]], body: DB.messages.map((m) => [m.name, m.email, fmtDate(m.createdAt), m.status]), styles: { fontSize: 9 } });

  doc.save("builder-queries-full-report.pdf");
  showToast("Report downloaded");
}
function downloadProjectReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = pdfHeader(doc, "Project status report");
  ["pending", "active", "completed"].forEach((status) => {
    const rows = DB.projects.filter((p) => p.status === status);
    doc.setFontSize(12); doc.text(status[0].toUpperCase() + status.slice(1) + " (" + rows.length + ")", 14, y); y += 4;
    doc.autoTable({ startY: y, head: [["Project", "Client", "Location", "Budget"]], body: rows.length ? rows.map((p) => [p.name, p.client, p.loc, money(p.budget)]) : [["—", "—", "—", "—"]], styles: { fontSize: 9 } });
    y = doc.lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
  });
  doc.save("builder-queries-project-report.pdf");
  showToast("Report downloaded");
}
function downloadBookingReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = pdfHeader(doc, "Bookings report");
  doc.autoTable({ startY: y, head: [["Requested by", "Project", "Date", "Location", "Status"]], body: DB.bookings.map((b) => [b.name, b.projectName || b.proName || "—", fmtDate(b.date), b.location || "—", b.status]), styles: { fontSize: 9 } });
  doc.save("builder-queries-bookings-report.pdf");
  showToast("Report downloaded");
}

boot();
