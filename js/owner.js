/* ── Owner Portal ── */
const _currentOwner = JSON.parse(localStorage.getItem('jopass_current_owner') || '{"vendorId":1}');
const OWNER_VENDOR  = VENDORS.find(v => v.id === _currentOwner.vendorId) || VENDORS[0];

const ownerState = {
  nextId: 3,
  currentView: 'listings',
  openings: [
    {
      id: 1,
      service: OWNER_VENDOR.services[0],
      date: new Date(2026, 3, 25),
      slots: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM'],
      capacity: 10,
      booked: ['10:00 AM'],
    },
    {
      id: 2,
      service: OWNER_VENDOR.services[1],
      date: new Date(2026, 3, 28),
      slots: ['9:00 AM', '11:00 AM', '3:00 PM'],
      capacity: 5,
      booked: [],
    },
  ],
  receivedBookings: [],
  reviews: {},
  addForm: {
    serviceName: '',
    duration: '',
    capacity: 1,
    date: null,
    selectedSlots: [],
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
  },
};

const OWNER_TZ = 'Asia/Amman';

const ALL_SLOTS = [
  '8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM',
];

document.addEventListener('DOMContentLoaded', () => {
  // Populate owner identity in sidebar
  const initials = (_currentOwner.name || OWNER_VENDOR.name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const nameEl  = document.getElementById('ownerNameDesk');
  const emailEl = document.getElementById('ownerEmailDesk');
  const avatarEl = document.getElementById('ownerAvatarDesk');
  if (nameEl)   nameEl.textContent   = _currentOwner.name || OWNER_VENDOR.name;
  if (emailEl)  emailEl.textContent  = _currentOwner.email || '';
  if (avatarEl) avatarEl.textContent = initials;

  loadServicesFromStorage();
  loadOpeningsFromStorage();
  loadBookingsAndReviews();
  ownerNav('listings');
  updateBadge();
  setInterval(() => {
    checkOwnerBookingStatuses();
    updateBadge();
    if (ownerState.currentView === 'received') {
      renderReceived(document.getElementById('ownerMain'));
    }
  }, 30000);
});

/* ── GMT+3 helper ── */
function ownerFmtDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: OWNER_TZ });
}

/* ── Bookings + reviews from localStorage ── */
function loadBookingsAndReviews() {
  const bStored = localStorage.getItem('jopass_bookings');
  if (bStored) {
    ownerState.receivedBookings = JSON.parse(bStored)
      .filter(b => b.vendorId === OWNER_VENDOR.id)
      .map(b => ({ ...b, date: new Date(b.date) }));
  }
  const rStored = localStorage.getItem('jopass_reviews');
  if (rStored) ownerState.reviews = JSON.parse(rStored);
}

function getOwnerBookingDateTime(b) {
  const d = new Date(b.date);
  const m = b.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return d;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  d.setHours(h, min, 0, 0);
  return d;
}

function checkOwnerBookingStatuses() {
  const now = new Date();
  ownerState.receivedBookings.forEach(b => {
    if (b.status === 'confirmed' && getOwnerBookingDateTime(b) < now) {
      b.status = 'completed';
    }
  });
  // re-read reviews in case consumer submitted one since last check
  const rStored = localStorage.getItem('jopass_reviews');
  if (rStored) ownerState.reviews = JSON.parse(rStored);
}

/* ── Services localStorage ── */
let ownerServices = [];
let ownerServicesNextId = 1;

function loadServicesFromStorage() {
  const stored = localStorage.getItem(`jopass_services_${OWNER_VENDOR.id}`);
  if (stored) {
    ownerServices = JSON.parse(stored);
    ownerServicesNextId = Math.max(...ownerServices.map(s => s.id), 0) + 1;
  } else {
    // seed with vendor's existing services
    ownerServices = OWNER_VENDOR.services.map(s => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: s.price,
      jopassPrice: s.jopassPrice,
      credits: s.jopassPrice,
    }));
    ownerServicesNextId = Math.max(...ownerServices.map(s => s.id), 0) + 1;
    saveServicesToStorage();
  }
}

function saveServicesToStorage() {
  localStorage.setItem(`jopass_services_${OWNER_VENDOR.id}`, JSON.stringify(ownerServices));
}

/* ── My Services view ── */
function renderServices(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>My Services</h2>
    </div>
    <p style="font-size:.8rem; color:var(--text-muted); margin-bottom:16px;">
      These are your fixed offerings that customers can book anytime.
    </p>

    ${ownerServices.map(s => `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
          <div>
            <div style="font-weight:600; font-size:.9rem;">${s.name}</div>
            <div style="font-size:.8rem; color:var(--text-muted); margin-top:2px;">${s.duration || '—'}</div>
          </div>
          <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger); padding:4px 10px; flex-shrink:0;" onclick="removeService(${s.id})">✕</button>
        </div>
        <div style="display:flex; gap:16px; align-items:center;">
          ${s.jopassPrice < s.price ? `
            <div>
              <div style="font-size:.7rem; color:var(--text-muted);">Regular</div>
              <div style="font-size:.9rem; text-decoration:line-through; color:var(--text-muted);">${parseFloat(s.price).toFixed(2)} JOD</div>
            </div>
            <div>
              <div style="font-size:.7rem; color:var(--text-muted);">JoPass Price</div>
              <div style="font-size:.9rem; font-weight:700; color:var(--primary);">${parseFloat(s.jopassPrice).toFixed(2)} JOD</div>
            </div>
            <div style="margin-left:auto; text-align:right;">
              <div style="font-size:.7rem; color:var(--text-muted);">Discount</div>
              <div style="font-size:.9rem; font-weight:600; color:var(--success);">${Math.round((1 - s.jopassPrice / s.price) * 100)}% off</div>
            </div>
          ` : `
            <div>
              <div style="font-size:.7rem; color:var(--text-muted);">Price</div>
              <div style="font-size:.9rem; font-weight:700; color:var(--text);">${parseFloat(s.price).toFixed(2)} JOD</div>
            </div>
            <div style="margin-left:auto;">
              <span style="font-size:.75rem; color:var(--text-muted); background:var(--bg); padding:3px 9px; border-radius:20px;">No discount</span>
            </div>
          `}
        </div>
      </div>
    `).join('')}

    ${ownerServices.length === 0 ? `
      <div class="empty-state" style="padding:24px 0;">
        <div class="icon">🛎️</div>
        <h3>No Services Yet</h3>
        <p>Add your first service below.</p>
      </div>
    ` : ''}

    <div class="card" style="margin-top:8px; border:2px dashed var(--border); box-shadow:none;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:14px;">+ Add New Service</div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Service Name</label>
          <input id="svcName" type="text" placeholder="e.g. Hot Yoga Class"
            style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
            oninput="updateAddServiceBtn()">
        </div>
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Duration <span style="font-weight:400; color:var(--text-muted);">(optional)</span></label>
          <input id="svcDuration" type="text" placeholder="e.g. 60 min"
            style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Regular Price (JOD)</label>
          <input id="svcPrice" type="number" min="0" step="0.5" placeholder="15.00"
            style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
            oninput="updateAddServiceBtn()">
        </div>
        <div>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:.88rem; font-weight:500; user-select:none;">
            <input type="checkbox" id="svcNoDiscount" onchange="toggleJopassPriceField()"
              style="width:16px; height:16px; accent-color:var(--primary); cursor:pointer;">
            No discount — list at regular price
          </label>
        </div>
        <div id="svcJopassWrapper">
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">JoPass Price (JOD)</label>
          <input id="svcJopassPrice" type="number" min="0" step="0.5" placeholder="e.g. 10.00"
            style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
            oninput="updateAddServiceBtn()">
        </div>
        <div style="display:none;">
        </div>
        <button id="addServiceBtn" class="btn btn-primary btn-full" disabled onclick="addService()">Add Service</button>
      </div>
    </div>
  `;
}

function toggleJopassPriceField() {
  const noDiscount = document.getElementById('svcNoDiscount')?.checked;
  const wrapper    = document.getElementById('svcJopassWrapper');
  if (wrapper) wrapper.style.display = noDiscount ? 'none' : 'block';
  updateAddServiceBtn();
}

function updateAddServiceBtn() {
  const name       = document.getElementById('svcName')?.value.trim();
  const price      = parseFloat(document.getElementById('svcPrice')?.value);
  const noDiscount = document.getElementById('svcNoDiscount')?.checked;
  const jPrice     = parseFloat(document.getElementById('svcJopassPrice')?.value);
  const btn        = document.getElementById('addServiceBtn');
  if (!btn) return;
  const jopassOk = noDiscount || (jPrice > 0 && jPrice <= price);
  btn.disabled = !(name && price > 0 && jopassOk);
}

function addService() {
  const name       = document.getElementById('svcName').value.trim();
  const duration   = document.getElementById('svcDuration').value.trim();
  const price      = parseFloat(document.getElementById('svcPrice').value);
  const noDiscount = document.getElementById('svcNoDiscount').checked;
  const rawJ       = document.getElementById('svcJopassPrice').value.trim();
  const jPrice     = noDiscount ? price : parseFloat(rawJ);
  if (!name || !price || (!noDiscount && (!jPrice || jPrice > price))) return;

  ownerServices.push({
    id: ownerServicesNextId++,
    name,
    duration: duration || null,
    price,
    jopassPrice: jPrice,
    credits: jPrice,
  });
  saveServicesToStorage();
  showOwnerToast('Service added!', 'success');
  renderServices(document.getElementById('ownerMain'));
}

function removeService(id) {
  ownerServices = ownerServices.filter(s => s.id !== id);
  saveServicesToStorage();
  showOwnerToast('Service removed.', 'info');
  renderServices(document.getElementById('ownerMain'));
}

/* ── localStorage sync ── */
function saveOpeningsToStorage() {
  const serialized = ownerState.openings.map(o => ({
    ...o,
    vendorId: OWNER_VENDOR.id,
    date: o.date.toISOString(),
  }));
  localStorage.setItem('jopass_openings', JSON.stringify(serialized));
}

function loadOpeningsFromStorage() {
  const stored = localStorage.getItem('jopass_openings');
  if (stored) {
    const parsed = JSON.parse(stored);
    ownerState.openings = parsed.map(o => ({ ...o, date: new Date(o.date) }));
    ownerState.nextId = Math.max(...ownerState.openings.map(o => o.id), 0) + 1;
  } else {
    saveOpeningsToStorage(); // seed storage with defaults
  }
}

/* ── View Mode ── */
function setViewMode(mode) {
  document.body.className = `mode-${mode}`;
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
}

/* ── Navigation ── */
function ownerNav(view) {
  ownerState.currentView = view;
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });
  document.querySelectorAll('.bottom-nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });
  const main = document.getElementById('ownerMain');
  switch (view) {
    case 'profile':   renderBusinessProfile(main); break;
    case 'services':  renderServices(main); break;
    case 'listings':  renderListings(main); break;
    case 'add':       renderAddOpening(main); break;
    case 'received':  loadBookingsAndReviews(); renderReceived(main); break;
  }
  main.scrollTop = 0;
}

function updateBadge() {
  loadBookingsAndReviews();
  const count = ownerState.receivedBookings.length;
  const badge = document.getElementById('sidebarBadge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
  badge.textContent = count;
}

/* ── My Openings ── */
function slotIsPast(date, slot) {
  const d = new Date(date);
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return false;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  d.setHours(h, min, 0, 0);
  return d < new Date();
}

function renderListings(container) {
  // auto-remove openings where every slot has passed
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const before = ownerState.openings.length;
  ownerState.openings = ownerState.openings.filter(o => {
    if (new Date(o.date) < today) return false;
    return o.slots.some(s => !slotIsPast(o.date, s));
  });
  if (ownerState.openings.length !== before) saveOpeningsToStorage();

  const openings = [...ownerState.openings]
    .sort((a, b) => a.date - b.date)
    .map(o => ({ ...o, slots: o.slots.filter(s => !slotIsPast(o.date, s)) }));

  container.innerHTML = `
    <div class="page-header">
      <h2>My Openings</h2>
      <button class="btn btn-primary btn-sm" onclick="ownerNav('add')">+ Add</button>
    </div>

    <div class="card" style="margin-bottom:16px; display:flex; align-items:center; gap:14px;">
      <span style="font-size:2.2rem;">${OWNER_VENDOR.icon}</span>
      <div style="flex:1;">
        <div style="font-weight:700;">${OWNER_VENDOR.name}</div>
        <div style="font-size:.8rem; color:var(--text-muted);">${OWNER_VENDOR.category} · ${OWNER_VENDOR.services.length} services</div>
      </div>
      <span style="font-size:.75rem; font-weight:600; color:var(--success); background:rgba(0,184,148,.1); padding:4px 10px; border-radius:20px;">Active</span>
    </div>

    ${openings.length === 0 ? `
      <div class="empty-state">
        <div class="icon">📋</div>
        <h3>No Openings Yet</h3>
        <p>Add available time slots to start receiving bookings from customers.</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="ownerNav('add')">Add Opening</button>
      </div>
    ` : openings.map(o => {
      const dateStr = o.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      const capacity = o.capacity || 1;
      const totalBooked = o.booked.length;
      const totalCapacity = o.slots.length * capacity;
      const isFull = totalBooked >= totalCapacity;
      return `
        <div class="card" style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
            <div>
              <div style="font-weight:600; font-size:.9rem;">${o.service.name}</div>
              <div style="font-size:.8rem; color:var(--text-muted); margin-top:2px;">${dateStr}${o.service.duration ? ' · ' + o.service.duration : ''}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:.72rem; font-weight:600; padding:3px 9px; border-radius:20px;
                background:${isFull ? 'rgba(225,112,85,.1)' : 'rgba(0,184,148,.1)'};
                color:${isFull ? 'var(--danger)' : 'var(--success)'};">
                ${isFull ? 'Full' : `${totalCapacity - totalBooked} open`}
              </span>
              <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger); padding:4px 10px;" onclick="removeOpening(${o.id})">✕</button>
            </div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
            ${o.slots.map(slot => {
              const bookedCount = o.booked.filter(b => b === slot).length;
              const slotFull = bookedCount >= capacity;
              return `<span style="
                padding:4px 10px; border-radius:20px; font-size:.75rem; font-weight:500;
                background:${slotFull ? 'var(--bg)' : 'rgba(0,184,148,.12)'};
                color:${slotFull ? 'var(--text-muted)' : 'var(--success)'};
                border:1px solid ${slotFull ? 'var(--border)' : 'rgba(0,184,148,.3)'};
              ">${slot} · ${bookedCount}/${capacity}</span>`;
            }).join('')}
          </div>
          <div style="font-size:.78rem; color:var(--text-muted); border-top:1px solid var(--border); padding-top:10px; margin-top:2px;">
            ${o.slots.length} time slots · ${capacity} seat${capacity !== 1 ? 's' : ''} each · ${totalBooked} booked · ${totalCapacity - totalBooked} remaining
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function removeOpening(id) {
  const opening = ownerState.openings.find(o => o.id === id);
  if (opening) cancelBookingsForOpening(opening);
  ownerState.openings = ownerState.openings.filter(o => o.id !== id);
  saveOpeningsToStorage();
  showOwnerToast('Opening removed. Affected customers have been notified.', 'info');
  renderListings(document.getElementById('ownerMain'));
}

function cancelBookingsForOpening(opening) {
  const bStored = localStorage.getItem('jopass_bookings');
  if (!bStored) return;
  const bookings = JSON.parse(bStored);
  let cancelled = 0;
  bookings.forEach(b => {
    if (
      b.vendorId === OWNER_VENDOR.id &&
      new Date(b.date).toDateString() === new Date(opening.date).toDateString() &&
      opening.slots.includes(b.time) &&
      b.service?.name === opening.service?.name &&
      b.status === 'confirmed'
    ) {
      b.status = 'cancelled';
      cancelled++;
    }
  });
  if (cancelled > 0) {
    localStorage.setItem('jopass_bookings', JSON.stringify(bookings));
    if (Notification.permission === 'granted') {
      const dateStr = new Date(opening.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Amman' });
      new Notification('Opening Cancelled — JoPass', {
        body: `${opening.service.name} at ${OWNER_VENDOR.name} on ${dateStr} has been cancelled. ${cancelled} customer${cancelled > 1 ? 's' : ''} notified.`,
      });
    }
  }
}

/* ── Add Opening ── */
function renderAddOpening(container) {
  const f = ownerState.addForm;
  const year = f.calendarYear;
  const month = f.calendarMonth;
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  let calHtml = `
    <div class="calendar-header">
      <button onclick="ownerChangeMonth(-1)">‹</button>
      <span>${monthNames[month]} ${year}</span>
      <button onclick="ownerChangeMonth(1)">›</button>
    </div>
    <div class="calendar-grid">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="day-name">${d}</div>`).join('')}
  `;
  for (let i = 0; i < firstDay; i++) calHtml += `<div class="day disabled"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isSelected = f.date && date.toDateString() === f.date.toDateString();
    const cls = ['day', isPast ? 'disabled' : 'has-slots', isSelected ? 'selected' : ''].join(' ');
    calHtml += `<div class="${cls}" ${!isPast ? `onclick="ownerSelectDate(${year},${month},${d})"` : ''}>${d}</div>`;
  }
  calHtml += `</div>`;

  const canSubmit = f.serviceName.trim() && f.date && f.selectedSlots.length > 0;

  container.innerHTML = `
    <div class="page-header">
      <h2>Add Opening</h2>
    </div>

    <div class="card" style="margin-bottom:14px;">
      <label style="font-size:.85rem; font-weight:600; display:block; margin-bottom:8px;">Service Name</label>
      <input id="ownerServiceName" type="text" placeholder="e.g. Deep Tissue Massage"
        value="${f.serviceName}"
        oninput="ownerState.addForm.serviceName = this.value; updateOwnerSubmitBtn()"
        style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
      <label style="font-size:.85rem; font-weight:600; display:block; margin-top:12px; margin-bottom:8px;">Duration <span style="font-weight:400; color:var(--text-muted);">(optional)</span></label>
      <input id="ownerDuration" type="text" placeholder="e.g. 60 min"
        value="${f.duration}"
        oninput="ownerState.addForm.duration = this.value"
        style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
      <label style="font-size:.85rem; font-weight:600; display:block; margin-top:12px; margin-bottom:6px;">Slots Available per Time <span style="font-weight:400; color:var(--text-muted);">(1–100)</span></label>
      <div style="display:flex; align-items:center; gap:12px;">
        <input id="ownerCapacity" type="range" min="1" max="100" value="${f.capacity}"
          oninput="ownerState.addForm.capacity = parseInt(this.value); document.getElementById('ownerCapacityVal').textContent = this.value"
          style="flex:1; accent-color:var(--primary);">
        <span id="ownerCapacityVal" style="font-size:1.1rem; font-weight:700; color:var(--primary); min-width:36px; text-align:right;">${f.capacity}</span>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px;">
      <label style="font-size:.85rem; font-weight:600; display:block; margin-bottom:10px;">Date</label>
      <div class="calendar">${calHtml}</div>
    </div>

    ${f.date ? `
      <div class="card" style="margin-bottom:16px;">
        <label style="font-size:.85rem; font-weight:600; display:block; margin-bottom:4px;">Available Time Slots</label>
        <p style="font-size:.8rem; color:var(--text-muted); margin-bottom:12px;">Select every slot when this service is open for booking.</p>
        <div class="time-slots">
          ${ALL_SLOTS.map(slot => `
            <div class="time-slot ${f.selectedSlots.includes(slot) ? 'selected' : ''}"
              onclick="ownerToggleSlot('${slot}')">${slot}</div>
          `).join('')}
        </div>
        <p id="ownerSlotCount" style="font-size:.78rem; color:var(--text-muted); margin-top:10px;">
          ${f.selectedSlots.length} slot${f.selectedSlots.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      <button id="ownerSubmitBtn" class="btn btn-primary btn-full" onclick="ownerSubmitOpening()" ${canSubmit ? '' : 'disabled'}>
        Publish Opening
      </button>
    ` : ''}
  `;
}

function ownerChangeMonth(delta) {
  const f = ownerState.addForm;
  f.calendarMonth += delta;
  if (f.calendarMonth > 11) { f.calendarMonth = 0; f.calendarYear++; }
  if (f.calendarMonth < 0) { f.calendarMonth = 11; f.calendarYear--; }
  renderAddOpening(document.getElementById('ownerMain'));
}

function ownerSelectDate(y, m, d) {
  ownerState.addForm.date = new Date(y, m, d);
  ownerState.addForm.selectedSlots = [];
  renderAddOpening(document.getElementById('ownerMain'));
}

function updateOwnerSubmitBtn() {
  const f = ownerState.addForm;
  const btn = document.getElementById('ownerSubmitBtn');
  if (btn) btn.disabled = !(f.serviceName.trim() && f.date && f.selectedSlots.length > 0);
}

function ownerToggleSlot(slot) {
  const slots = ownerState.addForm.selectedSlots;
  const idx = slots.indexOf(slot);
  if (idx === -1) slots.push(slot);
  else slots.splice(idx, 1);
  // Toggle selected class without full re-render so text inputs keep focus
  document.querySelectorAll('.time-slot').forEach(el => {
    el.classList.toggle('selected', slots.includes(el.textContent.trim()));
  });
  const countEl = document.getElementById('ownerSlotCount');
  if (countEl) countEl.textContent = `${slots.length} slot${slots.length !== 1 ? 's' : ''} selected`;
  updateOwnerSubmitBtn();
}

function ownerSubmitOpening() {
  const f = ownerState.addForm;
  if (!f.serviceName.trim() || !f.date || f.selectedSlots.length === 0) return;

  ownerState.openings.push({
    id: ownerState.nextId++,
    service: { name: f.serviceName.trim(), duration: f.duration.trim() || null },
    date: new Date(f.date),
    slots: [...f.selectedSlots].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b)),
    capacity: f.capacity,
    booked: [],
  });

  ownerState.addForm = {
    serviceName: '',
    duration: '',
    capacity: 1,
    date: null,
    selectedSlots: [],
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
  };

  saveOpeningsToStorage();
  showOwnerToast('Opening published!', 'success');
  ownerNav('listings');
}

/* ── Bookings Received ── */
function renderReceived(container) {
  loadBookingsAndReviews();
  checkOwnerBookingStatuses();
  const bookings = ownerState.receivedBookings;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const reviewed  = bookings.filter(b => ownerState.reviews[b.id]).length;

  container.innerHTML = `
    <div class="page-header">
      <h2>Bookings Received</h2>
    </div>

    <div class="card" style="margin-bottom:16px; display:flex; gap:0; text-align:center;">
      <div style="flex:1; border-right:1px solid var(--border); padding:8px 0;">
        <div style="font-size:1.4rem; font-weight:700; color:var(--primary);">${bookings.length}</div>
        <div style="font-size:.7rem; color:var(--text-muted);">Total</div>
      </div>
      <div style="flex:1; border-right:1px solid var(--border); padding:8px 0;">
        <div style="font-size:1.4rem; font-weight:700; color:var(--success);">${bookings.filter(b => b.status === 'confirmed').length}</div>
        <div style="font-size:.7rem; color:var(--text-muted);">Upcoming</div>
      </div>
      <div style="flex:1; border-right:1px solid var(--border); padding:8px 0;">
        <div style="font-size:1.4rem; font-weight:700; color:var(--accent);">${completed}</div>
        <div style="font-size:.7rem; color:var(--text-muted);">Completed</div>
      </div>
      <div style="flex:1; padding:8px 0;">
        <div style="font-size:1.4rem; font-weight:700; color:#f4b942;">${reviewed}</div>
        <div style="font-size:.7rem; color:var(--text-muted);">Reviewed</div>
      </div>
    </div>

    ${bookings.length === 0 ? `
      <div class="empty-state">
        <div class="icon">📥</div>
        <h3>No Bookings Yet</h3>
        <p>Once customers book your services or openings, they'll appear here.</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="ownerNav('add')">Add an Opening</button>
      </div>
    ` : [...bookings].reverse().map(b => {
      const dateStr   = ownerFmtDate(b.date);
      const isComp    = b.status === 'completed';
      const review    = ownerState.reviews[b.id];
      const initials  = (b.service?.name || 'SV').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

      const reviewBlock = review ? `
        <div style="margin-top:10px; padding:10px 12px; background:var(--bg); border-radius:var(--radius-sm); border-left:3px solid #f4b942;">
          <div style="color:#f4b942; font-size:.95rem; margin-bottom:4px;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
          ${review.comment ? `<p style="font-size:.8rem; color:var(--text-muted); margin:0;">"${review.comment}"</p>` : ''}
        </div>` : (isComp ? `<p style="font-size:.75rem; color:var(--text-muted); margin-top:6px; font-style:italic;">No review yet</p>` : '');

      return `
        <div class="card" style="margin-bottom:10px; ${isComp ? 'opacity:.9;' : ''}">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:var(--radius-sm); background:var(--primary)15; color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; flex-shrink:0;">
              ${initials}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:.9rem;">${b.service?.name || 'Service'}</div>
              <div style="font-size:.78rem; color:var(--text-muted);">${dateStr} at ${b.time}</div>
            </div>
            <span style="font-size:.72rem; font-weight:600; padding:3px 9px; border-radius:20px; flex-shrink:0;
              background:${isComp ? 'rgba(0,184,148,.1)' : 'rgba(108,92,231,.1)'};
              color:${isComp ? 'var(--success)' : 'var(--primary)'};">
              ${isComp ? 'Completed' : 'Confirmed'}
            </span>
          </div>
          ${reviewBlock}
        </div>
      `;
    }).join('')}
  `;
}

/* ── Business Profile ── */
const AMENITY_OPTIONS = [
  'Free Parking','Street Parking','WiFi','Air Conditioning','Changing Rooms',
  'Showers','Lockers','Towels Provided','Coffee & Tea','Juice Bar',
  'Music','TV Screens','Wheelchair Accessible','Family Friendly','Pet Friendly',
];

function loadProfile() {
  const stored = localStorage.getItem(`jopass_profile_${OWNER_VENDOR.id}`);
  return stored ? JSON.parse(stored) : {
    about: OWNER_VENDOR.description || '',
    phone: '',
    website: '',
    socials: { instagram: '', facebook: '', whatsapp: '', twitter: '' },
    amenities: [],
    photos: ['', '', '', '', '', ''],
    location: { address: '', lat: null, lng: null },
  };
}

function saveProfile(profile) {
  localStorage.setItem(`jopass_profile_${OWNER_VENDOR.id}`, JSON.stringify(profile));
}

function renderBusinessProfile(container) {
  const p = loadProfile();

  container.innerHTML = `
    <div class="page-header"><h2>Business Profile</h2></div>
    <p style="font-size:.8rem; color:var(--text-muted); margin-bottom:16px;">This information is shown to customers on your venue page.</p>

    <!-- About -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">About</div>
      <textarea id="profAbout" rows="3" placeholder="Tell customers about your business…"
        style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.88rem; resize:none; background:var(--surface); color:var(--text);">${p.about}</textarea>
    </div>

    <!-- Contact -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Contact</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <input id="profPhone" type="tel" placeholder="Phone number (e.g. +962 79 123 4567)" value="${p.phone}"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.88rem; background:var(--surface); color:var(--text);">
        <input id="profWebsite" type="url" placeholder="Website (e.g. https://fitzone.jo)" value="${p.website}"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.88rem; background:var(--surface); color:var(--text);">
      </div>
    </div>

    <!-- Socials -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Social Media</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${[
          { id: 'profIg',  icon: '📸', key: 'instagram', ph: '@fitzonegym'           },
          { id: 'profFb',  icon: '👥', key: 'facebook',  ph: 'facebook.com/fitzone'  },
          { id: 'profWa',  icon: '💬', key: 'whatsapp',  ph: '+962 79 123 4567'      },
          { id: 'profTw',  icon: '🐦', key: 'twitter',   ph: '@fitzonegym'           },
        ].map(s => `
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.1rem; width:24px; text-align:center;">${s.icon}</span>
            <input id="${s.id}" type="text" placeholder="${s.ph}" value="${p.socials[s.key] || ''}"
              style="flex:1; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.88rem; background:var(--surface); color:var(--text);">
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Amenities -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Amenities</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${AMENITY_OPTIONS.map(a => `
          <label style="display:flex; align-items:center; gap:6px; padding:6px 12px; border:1.5px solid ${p.amenities.includes(a) ? 'var(--primary)' : 'var(--border)'}; border-radius:20px; cursor:pointer; font-size:.8rem; font-weight:500; background:${p.amenities.includes(a) ? 'rgba(108,92,231,.08)' : 'transparent'}; color:${p.amenities.includes(a) ? 'var(--primary)' : 'var(--text)'}; transition:all .15s;">
            <input type="checkbox" data-amenity="${a}" ${p.amenities.includes(a) ? 'checked' : ''} style="display:none;" onchange="toggleAmenityStyle(this)">
            ${a}
          </label>
        `).join('')}
      </div>
    </div>

    <!-- Photos -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Photos <span style="font-weight:400; color:var(--text-muted); font-size:.8rem;">(paste image URLs)</span></div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${p.photos.map((url, i) => `
          <div>
            <input id="profPhoto${i}" type="url" placeholder="https://..." value="${url}"
              oninput="updatePhotoPreview(${i})"
              style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.85rem; background:var(--surface); color:var(--text);">
            <div id="photoPreview${i}" style="margin-top:6px; ${url ? '' : 'display:none;'}">
              <img src="${url}" onerror="this.parentElement.style.display='none'" style="width:100%; height:120px; object-fit:cover; border-radius:var(--radius-sm);">
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Location -->
    <div class="card" style="margin-bottom:20px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Location</div>
      <input id="profAddress" type="text" placeholder="Street address, city"
        value="${p.location.address}"
        style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.88rem; background:var(--surface); color:var(--text); margin-bottom:10px;">
      <button class="btn btn-outline btn-full" onclick="getGPSLocation()" style="margin-bottom:10px;">
        📍 Use My Current Location
      </button>
      <div id="locationStatus" style="font-size:.78rem; color:var(--text-muted); margin-bottom:10px;">
        ${p.location.lat ? `📍 Coordinates saved: ${p.location.lat.toFixed(5)}, ${p.location.lng.toFixed(5)}` : ''}
      </div>
      ${p.location.lat ? `
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=${p.location.lng - 0.008},${p.location.lat - 0.008},${p.location.lng + 0.008},${p.location.lat + 0.008}&layer=mapnik&marker=${p.location.lat},${p.location.lng}"
          style="width:100%; height:180px; border:1px solid var(--border); border-radius:var(--radius-sm);" loading="lazy">
        </iframe>
        <a href="https://www.google.com/maps?q=${p.location.lat},${p.location.lng}" target="_blank"
          style="display:block; text-align:center; font-size:.8rem; margin-top:8px;">Open in Google Maps ↗</a>
      ` : ''}
    </div>

    <button class="btn btn-primary btn-full" onclick="saveProfileForm()" style="margin-bottom:24px;">Save Profile</button>
  `;
}

function toggleAmenityStyle(checkbox) {
  const label = checkbox.closest('label');
  const checked = checkbox.checked;
  label.style.borderColor  = checked ? 'var(--primary)' : 'var(--border)';
  label.style.background   = checked ? 'rgba(108,92,231,.08)' : 'transparent';
  label.style.color        = checked ? 'var(--primary)' : 'var(--text)';
}

function updatePhotoPreview(i) {
  const url     = document.getElementById(`profPhoto${i}`).value.trim();
  const preview = document.getElementById(`photoPreview${i}`);
  if (!url) { preview.style.display = 'none'; return; }
  preview.style.display = 'block';
  preview.innerHTML = `<img src="${url}" onerror="this.parentElement.style.display='none'" style="width:100%; height:120px; object-fit:cover; border-radius:var(--radius-sm);">`;
}

function getGPSLocation() {
  const status = document.getElementById('locationStatus');
  if (!navigator.geolocation) {
    status.textContent = 'Geolocation is not supported by your browser.';
    return;
  }
  status.textContent = 'Getting location…';
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    status.textContent = `📍 Location found: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    status.style.color = 'var(--success)';
    // Temporarily store so saveProfileForm picks it up
    status.dataset.lat = lat;
    status.dataset.lng = lng;
  }, () => {
    status.textContent = 'Could not get location. Please allow location access and try again.';
    status.style.color = 'var(--danger)';
  });
}

function saveProfileForm() {
  const p = loadProfile();
  const status = document.getElementById('locationStatus');

  p.about   = document.getElementById('profAbout').value.trim();
  p.phone   = document.getElementById('profPhone').value.trim();
  p.website = document.getElementById('profWebsite').value.trim();
  p.socials = {
    instagram: document.getElementById('profIg').value.trim(),
    facebook:  document.getElementById('profFb').value.trim(),
    whatsapp:  document.getElementById('profWa').value.trim(),
    twitter:   document.getElementById('profTw').value.trim(),
  };
  p.amenities = [...document.querySelectorAll('[data-amenity]:checked')].map(el => el.dataset.amenity);
  p.photos = Array.from({ length: 6 }, (_, i) => document.getElementById(`profPhoto${i}`)?.value.trim() || '');

  if (status.dataset.lat) {
    p.location.lat = parseFloat(status.dataset.lat);
    p.location.lng = parseFloat(status.dataset.lng);
  }
  p.location.address = document.getElementById('profAddress').value.trim();

  saveProfile(p);
  showOwnerToast('Profile saved!', 'success');
  renderBusinessProfile(document.getElementById('ownerMain'));
}

/* ── Toast ── */
function showOwnerToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
