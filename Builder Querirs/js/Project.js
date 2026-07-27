// ═══════════════════════ PROJECTS (user view) ═══════════════════════
// Projects are created only by admin (Admin.html/Admin.js) and assigned to a
// specific registered user (by clientId/clientEmail). This page just reads
// whichever projects the backend has assigned to the signed-in user — it
// never creates, edits, or deletes a project itself.
//
// Expected backend contract (needs to exist server-side):
//   GET ${API_BASE}/api/user/projects?email=<user email>
//   -> { projects: [ { _id, name, service, status, budget, desc, date, ... } ] }
// Adjust the URL/response shape below to match your actual endpoint.
const API_BASE = "http://localhost:5001";

let userProjects      = [];
let completedProjects = [];

// ═══════════════════════ FETCH ═══════════════════════
async function loadProjects() {
  const user = getUser();
  if (!user || !user.email) {
    renderProjects(); // nothing to fetch without an identified user
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/user/projects?email=${encodeURIComponent(user.email)}`, {
      credentials: "include"
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showToast(data.msg || "Could not load your projects");
      return;
    }

    const projects = data.projects || [];
    userProjects      = projects.filter(p => p.status === "pending" || p.status === "active");
    completedProjects = projects.filter(p => p.status === "completed");
  } catch (err) {
    showToast("Can't reach the server right now. Please try again later.");
  }

  renderProjects();
}

// ═══════════════════════ RENDER ═══════════════════════
function renderProjects() {
  renderProjectGrid('projects-grid',   userProjects);
  renderProjectGrid('completed-grid',  completedProjects);
}

function renderProjectGrid(gridId, projects) {
  const grid = document.getElementById(gridId);
  if (!projects || projects.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No projects here yet.</p></div>';
    return;
  }
  grid.innerHTML = projects.map(p => `
    <div class="project-card">
      <div class="project-card-header">
        <div class="project-title">${p.name || p.title}</div>
        <span class="project-status status-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
      </div>
      <div class="project-service">🔧 ${p.service || p.loc || ''}</div>
      <div class="project-desc">${p.desc || ''}</div>
      <div class="project-meta">
        <span>Budget: <strong>$${p.budget}</strong></span>
        <span>${p.date ? p.date : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '')}</span>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════ INIT ═══════════════════════
document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
});