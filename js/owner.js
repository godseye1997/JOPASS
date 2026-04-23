/* ── Owner Portal ── */
const OWNER_VENDOR = VENDORS.find(v => v.id === 1); // FitZone Gym as demo owner

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
  receivedBookings: [
    {
      id: 1,
      customer: 'Sarah K.',
      avatar: 'SK',
      service: OWNER_VENDOR.services[0],
      date: new Date(2026, 3, 25),
      time: '10:00 AM',
      status: 'confirmed',
    },
    {
      id: 2,
      customer: 'Mohammed A.',
      avatar: 'MA',
      service: OWNER_VENDOR.services[2],
      date: new Date(2026, 3, 27),
      time: '3:00 PM',
      status: 'confirmed',
    },
  ],
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

const ALL_SLOTS = [
  '8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM',
];

document.addEventListener('DOMContentLoaded', () => {
  loadServicesFromStorage();
  loadOpeningsFromStorage();
  ownerNav('listings');
  updateBadge();
});

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
        <div style="display:flex; gap:16px;">
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
        <div style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Regular Price (JOD)</label>
            <input id="svcPrice" type="number" min="0" step="0.5" placeholder="15.00"
              style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
              oninput="updateAddServiceBtn()">
          </div>
          <div style="flex:1;">
            <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">JoPass Price (JOD)</label>
            <input id="svcJopassPrice" type="number" min="0" step="0.5" placeholder="10.00"
              style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
              oninput="updateAddServiceBtn()">
          </div>
        </div>
        <button id="addServiceBtn" class="btn btn-primary btn-full" disabled onclick="addService()">Add Service</button>
      </div>
    </div>
  `;
}

function updateAddServiceBtn() {
  const name   = document.getElementById('svcName')?.value.trim();
  const price  = parseFloat(document.getElementById('svcPrice')?.value);
  const jPrice = parseFloat(document.getElementById('svcJopassPrice')?.value);
  const btn    = document.getElementById('addServiceBtn');
  if (btn) btn.disabled = !(name && price > 0 && jPrice > 0 && jPrice <= price);
}

function addService() {
  const name    = document.getElementById('svcName').value.trim();
  const duration = document.getElementById('svcDuration').value.trim();
  const price   = parseFloat(document.getElementById('svcPrice').value);
  const jPrice  = parseFloat(document.getElementById('svcJopassPrice').value);
  if (!name || !price || !jPrice || jPrice > price) return;

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
    case 'services': renderServices(main); break;
    case 'listings': renderListings(main); break;
    case 'add':      renderAddOpening(main); break;
    case 'received': renderReceived(main); break;
  }
  main.scrollTop = 0;
}

function updateBadge() {
  const count = ownerState.receivedBookings.filter(b => b.status === 'confirmed').length;
  const badge = document.getElementById('sidebarBadge');
  if (!badge) return;
  if (count > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = count;
  } else {
    badge.style.display = 'none';
  }
}

/* ── My Openings ── */
function renderListings(container) {
  const openings = [...ownerState.openings].sort((a, b) => a.date - b.date);

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
  ownerState.openings = ownerState.openings.filter(o => o.id !== id);
  saveOpeningsToStorage();
  showOwnerToast('Opening removed.', 'info');
  renderListings(document.getElementById('ownerMain'));
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
  const bookings = ownerState.receivedBookings;

  container.innerHTML = `
    <div class="page-header">
      <h2>Bookings Received</h2>
    </div>

    <div class="card" style="margin-bottom:16px; display:flex; gap:24px; text-align:center;">
      <div style="flex:1; border-right:1px solid var(--border);">
        <div style="font-size:1.6rem; font-weight:700; color:var(--primary);">${bookings.length}</div>
        <div style="font-size:.75rem; color:var(--text-muted);">Total</div>
      </div>
      <div style="flex:1; border-right:1px solid var(--border);">
        <div style="font-size:1.6rem; font-weight:700; color:var(--success);">${bookings.filter(b => b.status === 'confirmed').length}</div>
        <div style="font-size:.75rem; color:var(--text-muted);">Confirmed</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:1.6rem; font-weight:700; color:var(--accent);">${ownerState.openings.reduce((n, o) => n + o.slots.filter(s => !o.booked.includes(s)).length, 0)}</div>
        <div style="font-size:.75rem; color:var(--text-muted);">Open Slots</div>
      </div>
    </div>

    ${bookings.length === 0 ? `
      <div class="empty-state">
        <div class="icon">📥</div>
        <h3>No Bookings Yet</h3>
        <p>Once customers book your openings, they'll appear here.</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="ownerNav('add')">Add an Opening</button>
      </div>
    ` : bookings.map(b => {
      const dateStr = b.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `
        <div class="booking-item">
          <div class="booking-icon" style="background:var(--primary)15; color:var(--primary); font-size:.85rem; font-weight:700;">
            ${b.avatar}
          </div>
          <div class="booking-details">
            <h4>${b.service.name}</h4>
            <p>${b.customer} · ${dateStr} at ${b.time}</p>
          </div>
          <span class="booking-status confirmed">${b.status}</span>
        </div>
      `;
    }).join('')}
  `;
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
