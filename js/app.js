/* ── State ── */
const state = {
  credits: 15,
  bookings: [],
  currentView: 'browse',
  viewMode: 'mobile',
  selectedVendor: null,
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
};

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  updateCreditDisplay();
  navigateTo('browse');
});

/* ── View Mode Toggle ── */
function setViewMode(mode) {
  state.viewMode = mode;
  document.body.className = `mode-${mode}`;
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
}

/* ── Navigation ── */
function navigateTo(view, vendorId) {
  state.currentView = view;
  if (vendorId) state.selectedVendor = VENDORS.find(v => v.id === vendorId);

  // Update sidebar nav
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });

  // Update bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });

  const main = document.getElementById('mainContent');
  switch (view) {
    case 'browse': renderBrowse(main); break;
    case 'vendor': renderVendorDetail(main); break;
    case 'credits': renderCredits(main); break;
    case 'bookings': renderBookings(main); break;
    case 'profile': renderProfile(main); break;
  }

  // Scroll main to top
  main.scrollTop = 0;
}

/* ── Credit Display ── */
function updateCreditDisplay() {
  const sidebar = document.getElementById('creditCount');
  const header = document.getElementById('creditCountHeader');
  const bar = document.getElementById('creditBarCount');
  if (sidebar) sidebar.textContent = state.credits;
  if (header) header.textContent = state.credits;
  if (bar) bar.textContent = state.credits;
}

/* ── Browse View ── */
function renderBrowse(container) {
  const categories = ['All', ...new Set(VENDORS.map(v => v.category))];

  container.innerHTML = `
    <div class="page-header">
      <h2>Discover Deals</h2>
    </div>
    <div class="credit-bar">
      <div>
        <div class="label">Your Balance</div>
        <div class="balance" id="creditBarCount">${state.credits} Credits</div>
      </div>
      <button class="btn" onclick="navigateTo('credits')">+ Buy Credits</button>
    </div>
    <div class="filter-bar" id="filterBar">
      ${categories.map((c, i) => `
        <button class="filter-btn ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>
      `).join('')}
    </div>
    <div class="grid grid-3" id="vendorGrid">
      ${renderVendorCards(VENDORS)}
    </div>
  `;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      const filtered = cat === 'All' ? VENDORS : VENDORS.filter(v => v.category === cat);
      document.getElementById('vendorGrid').innerHTML = renderVendorCards(filtered);
    });
  });
}

function renderVendorCards(vendors) {
  return vendors.map(v => {
    const cheapest = v.services.reduce((a, b) => a.jopassPrice < b.jopassPrice ? a : b);
    const discount = Math.round((1 - cheapest.jopassPrice / cheapest.price) * 100);
    return `
      <div class="vendor-card" onclick="navigateTo('vendor', ${v.id})">
        <div class="thumb" style="background-image:url('${v.image}')">
          <span class="badge">${discount}% OFF</span>
        </div>
        <div class="card-body">
          <h3>${v.icon} ${v.name}</h3>
          <p class="category">${v.category}</p>
          <p>
            <span class="original-price" style="margin-left:0;">${toJOD(cheapest.price)} JOD</span>
            <span class="price">From ${toJOD(cheapest.jopassPrice)} JOD</span>
          </p>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Vendor Detail ── */
function renderVendorDetail(container) {
  const v = state.selectedVendor;
  if (!v) return navigateTo('browse');

  container.innerHTML = `
    <div class="page-header">
      <h2>
        <a href="#" onclick="navigateTo('browse'); return false;" style="color:var(--text-muted); font-size:.9rem;">← Back</a>
      </h2>
    </div>
    <div style="margin-bottom:16px;">
      <h3>${v.icon} ${v.name}</h3>
      <p style="font-size:.8rem; color:var(--text-muted); margin-top:4px;">${v.description}</p>
    </div>
    <h4 style="margin-bottom:12px;">Available Services</h4>
    <div class="grid grid-2">
      ${v.services.map(s => {
        const discount = Math.round((1 - s.jopassPrice / s.price) * 100);
        return `
        <div class="card" style="cursor:pointer;" onclick="openBookingModal(${v.id}, ${s.id})">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div>
              <h4 style="font-size:.9rem;">${s.name}</h4>
              <p style="font-size:.8rem; color:var(--text-muted);">${s.duration}</p>
            </div>
            <div style="text-align:right;">
              <div class="original-price" style="margin-left:0; font-size:.8rem;">${toJOD(s.price)} JOD</div>
              <div class="price" style="font-size:.95rem;">${toJOD(s.jopassPrice)} JOD</div>
              <div style="font-size:.7rem; color:var(--text-muted);">(${s.credits} credits)</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
            <span style="font-size:.75rem; font-weight:600; color:var(--success);">Save ${discount}%</span>
            <button class="btn btn-primary btn-sm">Book Now</button>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
}

/* ── Booking Modal ── */
function openBookingModal(vendorId, serviceId) {
  const vendor = VENDORS.find(v => v.id === vendorId);
  const service = vendor.services.find(s => s.id === serviceId);
  state.selectedVendor = vendor;
  state.selectedService = service;
  state.selectedDate = null;
  state.selectedTime = null;
  state.calendarMonth = new Date().getMonth();
  state.calendarYear = new Date().getFullYear();

  const modal = document.getElementById('bookingModal');
  modal.classList.add('open');
  renderBookingModalContent();
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
}

function renderBookingModalContent() {
  const s = state.selectedService;
  const v = state.selectedVendor;

  const discount = Math.round((1 - s.jopassPrice / s.price) * 100);
  document.getElementById('modalTitle').textContent = `Book: ${s.name}`;
  document.getElementById('modalBody').innerHTML = `
    <p style="margin-bottom:4px;"><strong>${v.icon} ${v.name}</strong></p>
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap;">
      <span style="font-size:.9rem; text-decoration:line-through; color:var(--text-muted);">${toJOD(s.price)} JOD</span>
      <span style="font-size:1.05rem; font-weight:700; color:var(--primary);">${toJOD(s.jopassPrice)} JOD</span>
      <span style="font-size:.75rem; color:var(--text-muted);">(${s.credits} credits)</span>
      <span style="font-size:.75rem; font-weight:600; color:var(--success);">Save ${discount}%</span>
    </div>
    <p style="font-size:.8rem; color:var(--text-muted); margin-bottom:14px;">${s.duration}</p>

    <h4 style="margin-bottom:8px; font-size:.9rem;">Select a Date</h4>
    <div class="calendar" id="bookingCalendar"></div>

    <div id="timeSlotsContainer" style="display:none;">
      <h4 style="margin:14px 0 8px; font-size:.9rem;">Select a Time</h4>
      <div class="time-slots" id="timeSlots"></div>
    </div>

    <div id="bookingSummary" style="display:none; margin-top:16px; padding:14px; background:var(--bg); border-radius:var(--radius-sm);">
      <h4 style="margin-bottom:8px; font-size:.9rem;">Booking Summary</h4>
      <div id="summaryContent" style="font-size:.85rem;"></div>
    </div>
  `;

  renderCalendar();
  updateConfirmButton();
}

function renderCalendar() {
  const cal = document.getElementById('bookingCalendar');
  const year = state.calendarYear;
  const month = state.calendarMonth;
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  let html = `
    <div class="calendar-header">
      <button onclick="changeMonth(-1)">‹</button>
      <span>${monthNames[month]} ${year}</span>
      <button onclick="changeMonth(1)">›</button>
    </div>
    <div class="calendar-grid">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="day-name">${d}</div>`).join('')}
  `;

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="day disabled"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = state.selectedDate && date.toDateString() === state.selectedDate.toDateString();
    const isWeekday = date.getDay() !== 0;
    const hasSlots = !isPast && isWeekday;

    let classes = 'day';
    if (isPast) classes += ' disabled';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';
    if (hasSlots && !isPast) classes += ' has-slots';

    html += `<div class="${classes}" ${!isPast ? `onclick="selectDate(${year},${month},${d})"` : ''}>${d}</div>`;
  }

  html += `</div>`;
  cal.innerHTML = html;
}

function changeMonth(delta) {
  state.calendarMonth += delta;
  if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
  if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
  renderCalendar();
}

function selectDate(y, m, d) {
  state.selectedDate = new Date(y, m, d);
  state.selectedTime = null;
  renderCalendar();
  showTimeSlots();
  updateConfirmButton();
}

function showTimeSlots() {
  const container = document.getElementById('timeSlotsContainer');
  const slotsDiv = document.getElementById('timeSlots');
  container.style.display = 'block';

  const allSlots = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
    '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM'];

  const seed = state.selectedDate.getDate();
  const available = allSlots.filter((_, i) => (i * seed + 3) % 3 !== 0);

  slotsDiv.innerHTML = available.map(t => `
    <div class="time-slot" onclick="selectTime(this, '${t}')">${t}</div>
  `).join('');
}

function selectTime(el, time) {
  state.selectedTime = time;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  showBookingSummary();
  updateConfirmButton();
}

function showBookingSummary() {
  const container = document.getElementById('bookingSummary');
  const content = document.getElementById('summaryContent');
  container.style.display = 'block';

  const dateStr = state.selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const s = state.selectedService;
  const saved = s.price - s.jopassPrice;
  content.innerHTML = `
    <p><strong>Service:</strong> ${s.name}</p>
    <p><strong>Provider:</strong> ${state.selectedVendor.name}</p>
    <p><strong>Date:</strong> ${dateStr}</p>
    <p><strong>Time:</strong> ${state.selectedTime}</p>
    <p><strong>Normal Price:</strong> <span style="text-decoration:line-through; color:var(--text-muted);">${toJOD(s.price)} JOD</span></p>
    <p><strong>JoPass Price:</strong> <span style="color:var(--primary); font-weight:700;">${toJOD(s.jopassPrice)} JOD</span>
      <span style="font-size:.8rem; color:var(--text-muted); margin-left:4px;">(${s.credits} credits)</span>
    </p>
    <p style="font-size:.85rem; color:var(--success); margin-top:4px;">
      You save ${toJOD(saved)} JOD!
    </p>
  `;
}

function updateConfirmButton() {
  const btn = document.getElementById('confirmBookingBtn');
  const canBook = state.selectedDate && state.selectedTime;
  btn.disabled = !canBook;

  if (canBook && state.credits < state.selectedService.credits) {
    btn.textContent = 'Not Enough Credits';
    btn.disabled = true;
  } else if (canBook) {
    btn.textContent = `Confirm — ${toJOD(state.selectedService.jopassPrice)} JOD (${state.selectedService.credits} credits)`;
  } else {
    btn.textContent = 'Select Date & Time';
  }
}

function confirmBooking() {
  const s = state.selectedService;
  if (state.credits < s.credits) {
    showToast('Not enough credits! Buy more to continue.', 'error');
    return;
  }

  state.credits -= s.credits;
  state.bookings.push({
    id: Date.now(),
    vendor: state.selectedVendor,
    service: s,
    date: state.selectedDate,
    time: state.selectedTime,
    status: 'confirmed',
  });

  updateCreditDisplay();
  closeBookingModal();
  showToast(`Booked ${s.name} at ${state.selectedVendor.name}!`, 'success');

  if (state.currentView === 'browse') renderBrowse(document.getElementById('mainContent'));
  if (state.currentView === 'vendor') renderVendorDetail(document.getElementById('mainContent'));
}

/* ── Credits View ── */
function renderCredits(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Buy Credits</h2>
    </div>
    <div class="credit-bar">
      <div>
        <div class="label">Current Balance</div>
        <div class="balance" id="creditBarCount">${state.credits} Credits</div>
      </div>
    </div>
    <h4 style="margin-bottom:12px;">Credit Packs</h4>
    ${CREDIT_PACKS.map(p => `
      <div class="credit-pack" onclick="buyCredits(${p.id})">
        <div class="pack-info">
          <h4 style="font-size:.9rem;">${p.label} — ${p.credits} Credits</h4>
          <p>${p.description}</p>
        </div>
        <div class="pack-price">${p.price.toFixed(2)} JOD</div>
      </div>
    `).join('')}
    <div class="card" style="margin-top:20px;">
      <h4 style="margin-bottom:12px;">How It Works</h4>
      <div style="margin-bottom:12px;">
        <strong>1. Buy Credits</strong>
        <p style="font-size:.8rem; color:var(--text-muted);">Choose a pack that fits your needs.</p>
      </div>
      <div style="margin-bottom:12px;">
        <strong>2. Browse Deals</strong>
        <p style="font-size:.8rem; color:var(--text-muted);">Discover discounted services nearby.</p>
      </div>
      <div style="margin-bottom:12px;">
        <strong>3. Book & Save</strong>
        <p style="font-size:.8rem; color:var(--text-muted);">Use credits to book at up to 50% off.</p>
      </div>
      <div>
        <strong>4. Enjoy!</strong>
        <p style="font-size:.8rem; color:var(--text-muted);">Show up and enjoy the experience.</p>
      </div>
    </div>
  `;
}

function buyCredits(packId) {
  const pack = CREDIT_PACKS.find(p => p.id === packId);
  state.credits += pack.credits;
  updateCreditDisplay();
  showToast(`Added ${pack.credits} credits to your balance!`, 'success');
  renderCredits(document.getElementById('mainContent'));
}

/* ── Bookings View ── */
function renderBookings(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>My Bookings</h2>
    </div>
    ${state.bookings.length === 0 ? `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>No Bookings Yet</h3>
        <p>Browse deals and book your first experience!</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('browse')">Browse Deals</button>
      </div>
    ` : `
      ${state.bookings.map(b => {
        const dateStr = b.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return `
          <div class="booking-item">
            <div class="booking-icon" style="background:${b.vendor.color}15; color:${b.vendor.color};">
              ${b.vendor.icon}
            </div>
            <div class="booking-details">
              <h4>${b.service.name}</h4>
              <p>${b.vendor.name} · ${dateStr} at ${b.time}</p>
            </div>
            <span class="booking-status confirmed">Confirmed</span>
            <button class="btn btn-sm btn-outline" onclick="cancelBooking(${b.id})">Cancel</button>
          </div>
        `;
      }).join('')}
    `}
  `;
}

function cancelBooking(id) {
  const idx = state.bookings.findIndex(b => b.id === id);
  if (idx === -1) return;
  const booking = state.bookings[idx];
  state.credits += booking.service.credits;
  state.bookings.splice(idx, 1);
  updateCreditDisplay();
  showToast(`Booking cancelled. ${booking.service.credits} credits refunded.`, 'info');
  renderBookings(document.getElementById('mainContent'));
}

/* ── Profile View ── */
function renderProfile(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Profile</h2>
    </div>
    <div class="profile-card">
      <div class="profile-avatar">TU</div>
      <div>
        <div style="font-weight:600;">Test User</div>
        <div style="font-size:.8rem; color:var(--text-muted);">demo@jopass.com</div>
      </div>
    </div>

    <div class="credit-bar" style="cursor:pointer;" onclick="navigateTo('credits')">
      <div>
        <div class="label">Credit Balance</div>
        <div class="balance" id="creditBarCount">${state.credits} Credits</div>
      </div>
      <span style="font-size:1.2rem;">→</span>
    </div>

    <div class="profile-menu-item" onclick="navigateTo('bookings')">
      <span class="pm-icon">📅</span>
      <span class="pm-label">My Bookings</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item" onclick="navigateTo('credits')">
      <span class="pm-icon">💳</span>
      <span class="pm-label">Buy Credits</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item">
      <span class="pm-icon">🔔</span>
      <span class="pm-label">Notifications</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item">
      <span class="pm-icon">⚙️</span>
      <span class="pm-label">Settings</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item">
      <span class="pm-icon">❓</span>
      <span class="pm-label">Help & Support</span>
      <span class="pm-arrow">›</span>
    </div>

    <a href="index.html" class="profile-menu-item" style="margin-top:20px; color:var(--danger);">
      <span class="pm-icon">🚪</span>
      <span class="pm-label" style="color:var(--danger);">Log Out</span>
      <span class="pm-arrow">›</span>
    </a>
  `;
}

/* ── Toast ── */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
