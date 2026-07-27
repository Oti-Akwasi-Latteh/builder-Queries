const API_BASE = "http://localhost:5001";

// ═══════════════════════ SERVICE DATA ═══════════════════════
const SERVICE_DATA = {
  'building-contractor': {
    icon: '🏗️',
    name: 'Building Contractor',
    count: 842,
    bg: '/images/istockphoto.jpg',
    contractors: [
      { initials:'AK', name:'Amos Kofi',       location:'Accra',    rating:'★★★★★', reviews:148, rate:45, tags:['Residential','Commercial'], color:'#E8530A', verified:true  },
      { initials:'JA', name:'Joseph Agyei',     location:'Kumasi',   rating:'★★★★★', reviews:92,  rate:38, tags:['Renovation','Extensions'],  color:'#1D9E75', verified:true  },
      { initials:'BM', name:'Bernard Mensah',   location:'Accra',    rating:'★★★★☆', reviews:65,  rate:40, tags:['New Build','Roofing'],      color:'#185FA5', verified:false },
      { initials:'EO', name:'Eric Owusu',       location:'Takoradi', rating:'★★★★★', reviews:201, rate:50, tags:['Commercial','Fit-out'],     color:'#534AB7', verified:true  },
      { initials:'DK', name:'Daniel Kumi',      location:'Tamale',   rating:'★★★☆☆', reviews:43,  rate:28, tags:['Residential','Repairs'],    color:'#B03E06', verified:false },
      { initials:'SA', name:'Samuel Asante',    location:'Accra',    rating:'★★★★☆', reviews:117, rate:42, tags:['Renovation','Tiling'],      color:'#1D9E75', verified:true  },
    ]
  },
  'electrician': {
    icon: '⚡',
    name: 'Electrician',
    count: 619,
    bg: '/images/lectrician.jpg',
    contractors: [
      { initials:'EB', name:'Emmanuel Boateng', location:'Kumasi',   rating:'★★★★★', reviews:94,  rate:35, tags:['Wiring','Solar'],        color:'#1D9E75', verified:true  },
      { initials:'KA', name:'Kofi Adjei',       location:'Accra',    rating:'★★★★★', reviews:182, rate:40, tags:['Industrial','Panel'],    color:'#E8530A', verified:true  },
      { initials:'PO', name:'Patrick Ofori',    location:'Accra',    rating:'★★★★☆', reviews:57,  rate:30, tags:['Residential','CCTV'],    color:'#534AB7', verified:false },
      { initials:'YD', name:'Yaw Darko',        location:'Takoradi', rating:'★★★★★', reviews:130, rate:38, tags:['Generator','Wiring'],    color:'#185FA5', verified:true  },
    ]
  },
  'painter': {
    icon: '🎨',
    name: 'Painter',
    count: 534,
    bg: '/images/room-interior-renovation-indoor-paint.jpg',
    contractors: [
      { initials:'GN', name:'Grace Nyarko',      location:'Accra',  rating:'★★★★★', reviews:76,  rate:25, tags:['Interior','Exterior'],      color:'#E8530A', verified:true  },
      { initials:'FO', name:'Felix Owusu',        location:'Kumasi', rating:'★★★★☆', reviews:44,  rate:20, tags:['Decorative','Texture'],     color:'#185FA5', verified:false },
      { initials:'RA', name:'Rosemary Amponsah',  location:'Accra',  rating:'★★★★★', reviews:110, rate:28, tags:['Interior','Feature Walls'], color:'#1D9E75', verified:true  },
    ]
  },
  'interior-designer': {
    icon: '🛋️',
    name: 'Interior Designer',
    count: 298,
    bg: '/images/3d-rendering-modern-dining-room-living-room-with-luxury-decor-yellow-lamp.jpg',
    contractors: [
      { initials:'FA', name:'Fatima Asante', location:'Accra',  rating:'★★★★★', reviews:212, rate:60, tags:['Residential','Staging'],   color:'#185FA5', verified:true  },
      { initials:'AK', name:'Abena Kyei',    location:'Accra',  rating:'★★★★★', reviews:88,  rate:55, tags:['Commercial','Minimalist'], color:'#E8530A', verified:true  },
      { initials:'MB', name:'Mercy Boateng', location:'Kumasi', rating:'★★★★☆', reviews:39,  rate:45, tags:['Luxury','Contemporary'],   color:'#534AB7', verified:false },
    ]
  },
  'carpenter': {
    icon: '🪚',
    name: 'Carpenter',
    count: 411,
    bg: '/images/black carpenter.webp',
    contractors: [
      { initials:'KM', name:'Kweku Mensah',     location:'Takoradi', rating:'★★★★☆', reviews:77,  rate:30, tags:['Furniture','Cabinets'], color:'#534AB7', verified:false },
      { initials:'IA', name:'Isaac Acheampong', location:'Accra',    rating:'★★★★★', reviews:145, rate:35, tags:['Bespoke','Joinery'],    color:'#E8530A', verified:true  },
      { initials:'SB', name:'Solomon Boakye',   location:'Kumasi',   rating:'★★★★☆', reviews:60,  rate:28, tags:['Doors','Windows'],      color:'#1D9E75', verified:false },
    ]
  },
  'truck-rental': {
    icon: '🚛',
    name: 'Truck Rental',
    count: 187,
    bg: '/images/construction-site-large-pile-sand.avif',
    contractors: [
      { initials:'BT', name:'Bright Transport Co.', location:'Accra',  rating:'★★★★★', reviews:320, rate:80, tags:['Long Haul','Moving'], color:'#E8530A', verified:true },
      { initials:'GT', name:'Ghanaian Truckers',     location:'Kumasi', rating:'★★★★☆', reviews:95,  rate:65, tags:['Local','Flatbed'],    color:'#185FA5', verified:true },
    ]
  }
};

// ═══════════════════════ SERVICE DETAIL ═══════════════════════
let currentService = null;

function loadServiceFromURL() {
  const params = new URLSearchParams(window.location.search);
  currentService = params.get("service") || "building-contractor";

  const svc = SERVICE_DATA[currentService];
  if (!svc) {
    document.querySelector(".dash-content").innerHTML =
      '<p style="padding:2rem;color:var(--text-secondary)">Service not found.</p>';
    return;
  }

  document.title = svc.name + " – BuilderQueries";
  document.getElementById("svc-hero-icon").textContent  = svc.icon;
  document.getElementById("svc-hero-title").textContent = svc.name;
  document.getElementById("svc-hero-count").textContent = svc.count + " contractors available";

  const hero = document.querySelector(".service-detail-hero");
  if (hero && svc.bg) hero.style.backgroundImage = `url('${svc.bg}')`;

  // Reset filters
  document.getElementById("svc-sort").value     = "rating";
  document.getElementById("svc-location").value = "";

  renderServiceContractors();
}

function renderServiceContractors() {
  const svc = SERVICE_DATA[currentService];
  if (!svc) return;

  const sortVal = document.getElementById("svc-sort").value;
  const locVal  = document.getElementById("svc-location").value;

  let list = [...svc.contractors];
  if (locVal) list = list.filter(c => c.location === locVal);

  list.sort((a, b) => {
    if (sortVal === "rating")     return b.reviews - a.reviews;
    if (sortVal === "price-low")  return a.rate - b.rate;
    if (sortVal === "price-high") return b.rate - a.rate;
    if (sortVal === "reviews")    return b.reviews - a.reviews;
    return 0;
  });

  const grid = document.getElementById("contractors-grid");
  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>No contractors found for this filter.</p></div>';
    return;
  }

  grid.innerHTML = list.map(c => `
    <div class="contractor-card">
      <div class="cc-header">
        <div class="cc-avatar" style="background:${c.color}">${c.initials}</div>
        <div>
          <div class="cc-name">${c.name}</div>
          <div class="cc-location">📍 ${c.location}</div>
        </div>
        ${c.verified ? '<span class="pro-badge verified" style="margin-left:auto;margin-top:0">✓ Verified</span>' : ''}
      </div>
      <div class="cc-stars">${c.rating} <span>(${c.reviews} reviews)</span></div>
      <div class="cc-tags">${c.tags.map(t => `<span class="cc-tag">${t}</span>`).join('')}</div>
      <div class="cc-footer">
        <div class="cc-rate">$${c.rate}<span>/hr</span></div>
        <button class="cc-book-btn" onclick="openBookingModal('${c.name}','${svc.name}','$${c.rate}/hr','${c.location}','${c.rating}','${c.reviews}')">Book Now</button>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════ BOOKING MODAL ═══════════════════════
const AVATAR_COLORS = ['#E8530A', '#1D9E75', '#185FA5', '#534AB7', '#B03E06'];
let activeBooking = null; // { name, role, rate, location }

function openBookingModal(name, role, rate, location, rating, reviews) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const color    = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  activeBooking = { name, role, rate, location };

  document.getElementById('booking-pro-info').innerHTML = `
    <div class="bk-avatar" style="background:${color}">${initials}</div>
    <div>
      <div class="bk-name">${name}</div>
      <div class="bk-meta">${role} · 📍 ${location}</div>
      <div class="bk-meta" style="margin-top:2px">${rating} (${reviews} reviews)</div>
    </div>
    <div class="bk-rate">${rate}</div>
  `;

  // Prefill from whatever the site already knows about the logged-in user
  document.getElementById('bk-name').value  = localStorage.getItem('userName')  || '';
  document.getElementById('bk-email').value = localStorage.getItem('userEmail') || '';

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bk-date').min   = today;
  document.getElementById('bk-date').value = '';
  document.getElementById('bk-desc').value     = '';
  document.getElementById('bk-location').value = '';
  document.getElementById('bk-lat').value      = '';
  document.getElementById('bk-lng').value      = '';
  document.getElementById('bk-location-status').textContent = '';

  document.getElementById('booking-modal').classList.add('open');
  if (typeof closeMenu === 'function') closeMenu();
}

function closeBookingModal() {
  document.getElementById('booking-modal').classList.remove('open');
}

function closeBookingOutside(e) {
  if (e.target === document.getElementById('booking-modal')) closeBookingModal();
}

// ═══════════════════════ GEOLOCATION ("Use my location") ═══════════════════════
async function useMyLocation() {
  const statusEl = document.getElementById('bk-location-status');
  const btn = document.getElementById('bk-locate-btn');

  if (!navigator.geolocation) {
    statusEl.textContent = "Your browser doesn't support location sharing — type your town/city instead.";
    return;
  }

  btn.disabled = true;
  statusEl.textContent = "Getting your location…";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      document.getElementById('bk-lat').value = lat.toFixed(5);
      document.getElementById('bk-lng').value = lng.toFixed(5);

      // Best-effort reverse geocode so the town/city text field fills in too
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const place = data.address ? (data.address.city || data.address.town || data.address.village || data.address.county || "") : "";
        if (place && !document.getElementById('bk-location').value.trim()) {
          document.getElementById('bk-location').value = place + (data.address.country ? ", " + data.address.country : "");
        }
        statusEl.textContent = "📍 Location captured — admin will see your exact spot in real time.";
      } catch (err) {
        statusEl.textContent = "📍 Coordinates captured — admin will see your exact spot in real time.";
      }
      btn.disabled = false;
    },
    (err) => {
      statusEl.textContent = "Couldn't get your location (permission denied) — type your town/city instead.";
      btn.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

async function submitBooking() {
  const name     = document.getElementById('bk-name').value.trim();
  const email    = document.getElementById('bk-email').value.trim();
  const date     = document.getElementById('bk-date').value;
  const time     = document.getElementById('bk-time').value;
  const desc     = document.getElementById('bk-desc').value.trim();
  const location = document.getElementById('bk-location').value.trim();
  const latVal   = document.getElementById('bk-lat').value.trim();
  const lngVal   = document.getElementById('bk-lng').value.trim();
  const lat      = latVal ? parseFloat(latVal) : null;
  const lng      = lngVal ? parseFloat(lngVal) : null;

  if (!name)                          { showToast('Please enter your name');           return; }
  if (!email || !email.includes('@')) { showToast('Please enter a valid email');       return; }
  if (!date)                          { showToast('Please select a date');             return; }
  if (!desc)                          { showToast('Please describe the work needed');  return; }
  if (!location)                      { showToast('Please enter your location');       return; }
  if ((latVal && isNaN(lat)) || (lngVal && isNaN(lng))) { showToast('Latitude/longitude must be numbers'); return; }

  const submitBtn = document.getElementById('bk-submit-btn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/public/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, date, time, description: desc, location, lat, lng,
        proName: activeBooking ? activeBooking.name : "",
        proRole: activeBooking ? activeBooking.role : "",
        proRate: activeBooking ? activeBooking.rate : ""
      })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showToast(data.msg || "Could not send the booking. Try again.");
      return;
    }

    // Remember who's booking so the next form is prefilled
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);

    closeBookingModal();
    showToast('Booking sent! The contractor will be in touch.');
  } catch (err) {
    showToast("Can't reach the server right now. Please try again later.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ═══════════════════════ INIT ═══════════════════════
document.addEventListener("DOMContentLoaded", () => {
  loadServiceFromURL();

  // Close booking modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBookingModal();
  });
});
