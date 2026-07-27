// ═══════════════════════ LIVE SEARCH FILTER ═══════════════════════
function filterServices(query) {
  const cards = document.querySelectorAll(".service-card");
  const q = query.toLowerCase().trim();
  let visibleCount = 0;

  cards.forEach(card => {
    const name    = card.getAttribute("data-name") || "";
    const matches = !q || name.includes(q);
    card.style.display = matches ? "" : "none";
    if (matches) visibleCount++;
  });

  document.getElementById("no-results").style.display = visibleCount === 0 ? "block" : "none";
}

function runSearch() {
  filterServices(document.getElementById("service-search").value);
}

// ═══════════════════════ NAVIGATE TO SERVICE DETAIL ═══════════════════════
function goToService(serviceId) {
  window.location.href = "Servicedetail.html?service=" + serviceId;
}

// ═══════════════════════ INIT ═══════════════════════
document.addEventListener("DOMContentLoaded", () => {
  // Live search on every keystroke
  document.getElementById("service-search").addEventListener("input", (e) => {
    filterServices(e.target.value);
  });
});