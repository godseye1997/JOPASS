/* ── Owner Portal ── */
let OWNER_VENDOR = null;
let _ownerUserId = null;

const ownerState = {
  nextId:       1,
  currentView:  'listings',
  openings:     [],
  receivedBookings: [],
  reviews:      {},
  addForm: {
    serviceName:   '',
    duration:      '',
    originalPrice: '',
    jopassPrice:   '',
    capacity:      1,
    date:          null,
    selectedSlots: [],
    calendarMonth: new Date().getMonth(),
    calendarYear:  new Date().getFullYear(),
  },
};

const OWNER_TZ = 'Asia/Amman';

const ALL_SLOTS = [
  '8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM',
  '7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM',
  '10:00 PM','10:30 PM','11:00 PM','11:30 PM','12:00 AM',
];

/* ── Services ── */
let ownerServices       = [];
let ownerServicesNextId = 1;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) { window.location.href = 'owner-login.html'; return; }

  _ownerUserId = session.user.id;

  const main = document.getElementById('ownerMain');
  if (main) main.innerHTML = '<div style="padding:60px 20px; text-align:center; color:var(--text-muted);">Loading…</div>';

  try {
    const { data: profile } = await _supabase.from('profiles').select('*').eq('id', _ownerUserId).single();
    if (!profile || profile.role === 'customer') {
      window.location.href = 'owner-login.html'; return;
    }

    if (!profile.vendor_id) {
      showOwnerToast('No venue linked to your account. Contact support.', 'error');
      return;
    }

    // Fetch vendor row
    OWNER_VENDOR = await dbGetOwnerVendor(profile.vendor_id);

    // Populate sidebar
    const name     = profile.full_name || OWNER_VENDOR.name || 'Owner';
    const email    = profile.email     || '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const nameEl   = document.getElementById('ownerNameDesk');
    const emailEl  = document.getElementById('ownerEmailDesk');
    const avatarEl = document.getElementById('ownerAvatarDesk');
    if (nameEl)   nameEl.textContent   = name;
    if (emailEl)  emailEl.textContent  = email;
    if (avatarEl) avatarEl.textContent = initials;

    // Mobile logout wiring
    const mobileLogout = document.querySelector('.mobile-header-right a');
    if (mobileLogout) {
      mobileLogout.removeAttribute('href');
      mobileLogout.style.cursor = 'pointer';
      mobileLogout.onclick = e => { e.preventDefault(); ownerSignOut(); };
    }

    // Load data in parallel
    await Promise.all([
      loadServicesFromDB(),
      loadOpeningsFromDB(),
      loadBookingsAndReviewsFromDB(),
    ]);

    ownerNav('listings');
    updateBadge();

    setInterval(async () => {
      await checkOwnerBookingStatuses();
      updateBadge();
      if (ownerState.currentView === 'received') {
        renderReceived(document.getElementById('ownerMain'));
      }
    }, 30000);
  } catch (err) {
    console.error('Owner init error:', err);
    if (main) main.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--danger);">Failed to load. Please refresh.</div>`;
  }
});

async function ownerSignOut() {
  await _supabase.auth.signOut();
  window.location.href = 'owner-login.html';
}

/* ── GMT+3 helper ── */
function ownerFmtDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: OWNER_TZ });
}

/* ── DB loaders ── */
async function loadServicesFromDB() {
  ownerServices = await dbGetOwnerServices(OWNER_VENDOR.id);
  ownerServicesNextId = ownerServices.length ? Math.max(...ownerServices.map(s => s.id)) + 1 : 1;
}

async function loadOpeningsFromDB() {
  ownerState.openings = await dbGetOwnerOpenings(OWNER_VENDOR.id);
}

async function loadBookingsAndReviewsFromDB() {
  ownerState.receivedBookings = await dbGetOwnerBookings(OWNER_VENDOR.id);
  ownerState.reviews          = await dbGetOwnerReviews(OWNER_VENDOR.id);
}

/* ── Booking status check ── */
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

async function checkOwnerBookingStatuses() {
  const now = new Date();
  for (const b of ownerState.receivedBookings) {
    if (b.status === 'confirmed' && getOwnerBookingDateTime(b) < now) {
      b.status = 'completed';
      await dbUpdateBookingStatus(b.id, 'completed').catch(() => {});
    }
  }
  // Refresh reviews
  ownerState.reviews = await dbGetOwnerReviews(OWNER_VENDOR.id).catch(() => ownerState.reviews);
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
        <div style="display:flex; gap:16px; flex-wrap:wrap;">
          ${s.price > s.jopassPrice ? `
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
        <div class="icon"><i data-lucide="layers" style="width:40px;height:40px;color:var(--primary);"></i></div>
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
        <button id="addServiceBtn" class="btn btn-primary btn-full" disabled onclick="addService()">Add Service</button>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
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

async function addService() {
  const name       = document.getElementById('svcName').value.trim();
  const duration   = document.getElementById('svcDuration').value.trim();
  const price      = parseFloat(document.getElementById('svcPrice').value);
  const noDiscount = document.getElementById('svcNoDiscount').checked;
  const rawJ       = document.getElementById('svcJopassPrice').value.trim();
  const jPrice     = noDiscount ? price : parseFloat(rawJ);
  if (!name || !price || (!noDiscount && (!jPrice || jPrice > price))) return;

  const btn = document.getElementById('addServiceBtn');
  btn.disabled = true;

  try {
    const svc = await dbAddService({
      vendorId:   OWNER_VENDOR.id,
      name, duration: duration || null, price, jopassPrice: jPrice,
    });
    ownerServices.push(svc);
    showOwnerToast('Service added!', 'success');
    renderServices(document.getElementById('ownerMain'));
  } catch (err) {
    console.error(err);
    showOwnerToast('Failed to add service. Please try again.', 'error');
    btn.disabled = false;
  }
}

async function removeService(id) {
  try {
    await dbDeleteService(id);
    ownerServices = ownerServices.filter(s => s.id !== id);
    showOwnerToast('Service removed.', 'info');
    renderServices(document.getElementById('ownerMain'));
  } catch (err) {
    showOwnerToast('Failed to remove service.', 'error');
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
    case 'profile':  renderBusinessProfile(main); break;
    case 'services': renderServices(main);        break;
    case 'listings': renderListings(main);        break;
    case 'add':      renderAddOpening(main);      break;
    case 'received':
      loadBookingsAndReviewsFromDB()
        .then(() => renderReceived(main))
        .catch(err => {
          console.error('Bookings load error:', err);
          main.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);">Failed to load bookings: ${err.message}</div>`;
        });
      break;
  }
  main.scrollTop = 0;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateBadge() {
  const count = ownerState.receivedBookings.filter(b => b.status === 'confirmed').length;
  const badge = document.getElementById('sidebarBadge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
  badge.textContent   = count;
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
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Auto-remove fully past openings (delete from DB)
  const stale = ownerState.openings.filter(o => {
    if (new Date(o.date) < today) return true;
    return !o.slots.some(s => !slotIsPast(o.date, s));
  });
  if (stale.length) {
    Promise.all(stale.map(o => dbDeleteOpening(o.id))).catch(() => {});
    ownerState.openings = ownerState.openings.filter(o => !stale.find(s => s.id === o.id));
  }

  const openings = [...ownerState.openings]
    .sort((a, b) => a.date - b.date)
    .map(o => ({ ...o, slots: o.slots.filter(s => !slotIsPast(o.date, s)) }));

  const services = ownerServices;

  container.innerHTML = `
    <div class="page-header">
      <h2>My Openings</h2>
      <button class="btn btn-primary btn-sm" onclick="ownerNav('add')">+ Add</button>
    </div>

    <div class="card" style="margin-bottom:16px; display:flex; align-items:center; gap:14px;">
      <span style="font-size:2.2rem;">${OWNER_VENDOR.icon || '🏢'}</span>
      <div style="flex:1;">
        <div style="font-weight:700;">${OWNER_VENDOR.name}</div>
        <div style="font-size:.8rem; color:var(--text-muted);">${OWNER_VENDOR.category || 'No category'} · ${services.length} service${services.length !== 1 ? 's' : ''}</div>
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
      const dateStr      = o.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      const capacity     = o.capacity || 1;
      const totalBooked  = o.booked.length;
      const totalCapacity = o.slots.length * capacity;
      const isFull       = totalBooked >= totalCapacity;
      return `
        <div class="card" style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
            <div>
              <div style="font-weight:600; font-size:.9rem;">${o.service.name}</div>
              <div style="font-size:.8rem; color:var(--text-muted); margin-top:2px;">${dateStr}${o.service.duration ? ' · ' + o.service.duration : ''}</div>
              ${o.jopassPrice ? `<div style="font-size:.8rem; margin-top:3px;">
                <span style="text-decoration:line-through; color:var(--text-muted);">${parseFloat(o.originalPrice).toFixed(2)} JOD</span>
                <span style="font-weight:700; color:var(--primary); margin-left:6px;">${parseFloat(o.jopassPrice).toFixed(2)} JOD</span>
                <span style="color:var(--accent-dark); margin-left:4px;">(${o.credits} credits)</span>
              </div>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:.72rem; font-weight:600; padding:3px 9px; border-radius:20px;
                background:${isFull ? 'rgba(225,112,85,.1)' : 'rgba(0,184,148,.1)'};
                color:${isFull ? 'var(--danger)' : 'var(--success)'};">
                ${isFull ? 'Full' : `${totalCapacity - totalBooked} open`}
              </span>
              <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger); padding:4px 10px;" onclick="removeOpening('${o.id}')">✕</button>
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

async function removeOpening(id) {
  const opening = ownerState.openings.find(o => o.id === id);
  if (!opening) return;

  try {
    // Cancel related confirmed bookings
    const dateStr = opening.date.toISOString().slice(0, 10);
    await dbCancelBookingsForOpening(OWNER_VENDOR.id, opening.service.name, dateStr);
    await dbDeleteOpening(id);

    ownerState.openings = ownerState.openings.filter(o => o.id !== id);
    showOwnerToast('Opening removed. Affected customers have been notified.', 'info');
    renderListings(document.getElementById('ownerMain'));
  } catch (err) {
    showOwnerToast('Failed to remove opening.', 'error');
  }
}

/* ── Add Opening ── */
function renderAddOpening(container) {
  const f = ownerState.addForm;
  const year = f.calendarYear;
  const month = f.calendarMonth;
  const today = new Date();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
      <div style="display:flex; gap:10px; margin-top:12px;">
        <div style="flex:1;">
          <label style="font-size:.85rem; font-weight:600; display:block; margin-bottom:6px;">Original Price (JOD)</label>
          <input id="ownerOriginalPrice" type="number" min="0" step="0.5" placeholder="10.00"
            value="${f.originalPrice}"
            oninput="ownerState.addForm.originalPrice = this.value; updateOpeningPricePreview(); updateOwnerSubmitBtn()"
            style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
        <div style="flex:1;">
          <label style="font-size:.85rem; font-weight:600; display:block; margin-bottom:6px;">JoPass Price (JOD)</label>
          <input id="ownerJopassPrice" type="number" min="0" step="0.5" placeholder="7.00"
            value="${f.jopassPrice}"
            oninput="ownerState.addForm.jopassPrice = this.value; updateOpeningPricePreview(); updateOwnerSubmitBtn()"
            style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
      </div>
      <div id="openingPricePreview" style="margin-top:10px; min-height:28px;">
        ${(() => { const op = parseFloat(f.originalPrice), jp = parseFloat(f.jopassPrice); return op > 0 && jp > 0 && jp <= op ? _openingPricePreviewHtml(op, jp) : ''; })()}
      </div>

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
  if (f.calendarMonth < 0)  { f.calendarMonth = 11; f.calendarYear--; }
  renderAddOpening(document.getElementById('ownerMain'));
}

function ownerSelectDate(y, m, d) {
  ownerState.addForm.date          = new Date(y, m, d);
  ownerState.addForm.selectedSlots = [];
  renderAddOpening(document.getElementById('ownerMain'));
}

function _openingPricePreviewHtml(op, jp) {
  const credits = Math.round(jp / 0.5); // 1 JOD = 2 credits
  const saving  = (op - jp).toFixed(2);
  const pct     = Math.round((1 - jp / op) * 100);
  return `<div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
    <span style="font-size:.82rem; background:rgba(30,207,195,.12); color:var(--accent-dark); padding:4px 10px; border-radius:20px; font-weight:600;">${credits} credits</span>
    <span style="font-size:.8rem; color:var(--text-muted); text-decoration:line-through;">${parseFloat(op).toFixed(2)} JOD</span>
    <span style="font-size:.88rem; font-weight:700; color:var(--primary);">${parseFloat(jp).toFixed(2)} JOD</span>
    <span style="font-size:.78rem; color:var(--success); font-weight:600;">Save ${saving} JOD (${pct}% off)</span>
  </div>`;
}

function updateOpeningPricePreview() {
  const el = document.getElementById('openingPricePreview');
  if (!el) return;
  const op = parseFloat(document.getElementById('ownerOriginalPrice')?.value);
  const jp = parseFloat(document.getElementById('ownerJopassPrice')?.value);
  el.innerHTML = (op > 0 && jp > 0 && jp <= op) ? _openingPricePreviewHtml(op, jp) : '';
}

function updateOwnerSubmitBtn() {
  const f   = ownerState.addForm;
  const op  = parseFloat(f.originalPrice);
  const jp  = parseFloat(f.jopassPrice);
  const btn = document.getElementById('ownerSubmitBtn');
  if (btn) btn.disabled = !(f.serviceName.trim() && f.date && f.selectedSlots.length > 0 && op > 0 && jp > 0 && jp <= op);
}

function ownerToggleSlot(slot) {
  const slots = ownerState.addForm.selectedSlots;
  const idx   = slots.indexOf(slot);
  if (idx === -1) slots.push(slot);
  else slots.splice(idx, 1);
  document.querySelectorAll('.time-slot').forEach(el => {
    el.classList.toggle('selected', slots.includes(el.textContent.trim()));
  });
  const countEl = document.getElementById('ownerSlotCount');
  if (countEl) countEl.textContent = `${slots.length} slot${slots.length !== 1 ? 's' : ''} selected`;
  updateOwnerSubmitBtn();
}

async function ownerSubmitOpening() {
  const f = ownerState.addForm;
  if (!f.serviceName.trim() || !f.date || f.selectedSlots.length === 0) return;

  const op  = parseFloat(f.originalPrice);
  const jp  = parseFloat(f.jopassPrice);
  const btn = document.getElementById('ownerSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Publishing…'; }

  try {
    const opening = await dbAddOpening({
      vendorId:     OWNER_VENDOR.id,
      serviceName:  f.serviceName.trim(),
      duration:     f.duration.trim() || null,
      originalPrice: op,
      jopassPrice:  jp,
      credits:      Math.round(jp / 0.5),
      capacity:     f.capacity,
      date:         new Date(f.date),
      slots:        [...f.selectedSlots].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b)),
    });

    ownerState.openings.push(opening);

    ownerState.addForm = {
      serviceName: '', duration: '', originalPrice: '', jopassPrice: '',
      capacity: 1, date: null, selectedSlots: [],
      calendarMonth: new Date().getMonth(), calendarYear: new Date().getFullYear(),
    };

    showOwnerToast('Opening published!', 'success');
    ownerNav('listings');
  } catch (err) {
    console.error(err);
    showOwnerToast('Failed to publish opening. Please try again.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Publish Opening'; }
  }
}

/* ── Bookings Received ── */
function renderReceived(container) {
  checkOwnerBookingStatuses();
  const bookings  = ownerState.receivedBookings;
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
      const dateStr  = ownerFmtDate(b.date);
      const isComp   = b.status === 'completed';
      const review   = ownerState.reviews[b.id];
      const initials = (b.service?.name || 'SV').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

      const reviewBlock = review ? `
        <div style="margin-top:10px; padding:10px 12px; background:var(--bg); border-radius:var(--radius-sm); border-left:3px solid #f4b942;">
          <div style="color:#f4b942; font-size:.95rem; margin-bottom:4px;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
          ${review.comment ? `<p style="font-size:.8rem; color:var(--text-muted); margin:0;">"${review.comment}"</p>` : ''}
        </div>` : (isComp ? `<p style="font-size:.75rem; color:var(--text-muted); margin-top:6px; font-style:italic;">No review yet</p>` : '');

      return `
        <div class="card" style="margin-bottom:10px; ${isComp ? 'opacity:.9;' : ''}">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:var(--radius-sm); background:rgba(108,92,231,.1); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; flex-shrink:0;">
              ${initials}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:.9rem;">${b.service?.name || 'Service'}</div>
              <div style="font-size:.78rem; color:var(--text-muted);">${b.userName} · ${dateStr} at ${b.time}</div>
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

let _ownerProfile = null;

async function loadProfile() {
  if (_ownerProfile) return _ownerProfile;
  const dbProfile = await dbGetOwnerVendorProfile(OWNER_VENDOR.id);
  _ownerProfile = dbProfile ? {
    logoUrl:  dbProfile.logo_url  || '',
    category: OWNER_VENDOR.category || '',
    about:    dbProfile.about     || OWNER_VENDOR.description || '',
    phone:    dbProfile.phone     || '',
    website:  dbProfile.website   || '',
    socials: {
      instagram: dbProfile.instagram || '',
      facebook:  dbProfile.facebook  || '',
      whatsapp:  dbProfile.whatsapp  || '',
      twitter:   dbProfile.twitter   || '',
    },
    amenities: dbProfile.amenities || [],
    photos:    (dbProfile.photos   || []).concat(Array(6).fill('')).slice(0, 6),
    location: {
      address: dbProfile.location_address || '',
      lat:     dbProfile.location_lat ? parseFloat(dbProfile.location_lat) : null,
      lng:     dbProfile.location_lng ? parseFloat(dbProfile.location_lng) : null,
    },
  } : {
    logoUrl: '', category: OWNER_VENDOR.category || '', about: OWNER_VENDOR.description || '',
    phone: '', website: '',
    socials: { instagram: '', facebook: '', whatsapp: '', twitter: '' },
    amenities: [], photos: ['','','','','',''],
    location: { address: '', lat: null, lng: null },
  };
  return _ownerProfile;
}

async function renderBusinessProfile(container) {
  container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">Loading profile…</div>';
  const p = await loadProfile();
  _renderBusinessProfileWith(container, p);
}

function _renderBusinessProfileWith(container, p) {
  container.innerHTML = `
    <div class="page-header"><h2>Business Profile</h2></div>
    <p style="font-size:.8rem; color:var(--text-muted); margin-bottom:16px;">This information is shown to customers on your venue page.</p>

    <!-- Business Name -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Business Name</div>
      <input id="profBizName" type="text" value="${OWNER_VENDOR.name || ''}"
        style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
    </div>

    <!-- Logo -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:12px;">Business Logo</div>
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:14px;">
        <div id="logoPreviewContainer" style="width:68px; height:68px; border-radius:var(--radius-sm); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden; background:var(--bg); flex-shrink:0;">
          ${p.logoUrl
            ? `<img src="${p.logoUrl}" style="width:100%; height:100%; object-fit:contain;">`
            : `<span style="font-size:2.2rem;">${OWNER_VENDOR.icon || '🏢'}</span>`}
        </div>
        <div style="flex:1;">
          <label class="btn btn-outline" style="cursor:pointer; font-size:.85rem; display:inline-block; margin-bottom:6px;">
            Upload Image
            <input type="file" accept="image/*" style="display:none;" onchange="handleLogoUpload(this)">
          </label>
          <p style="font-size:.75rem; color:var(--text-muted);">PNG or JPG · shown on your venue page</p>
        </div>
      </div>
      <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:6px;">Or paste image URL</label>
      <div style="display:flex; gap:8px;">
        <input id="profLogoUrl" type="url" placeholder="https://..."
          value="${p.logoUrl && p.logoUrl.startsWith('http') ? p.logoUrl : ''}"
          style="flex:1; padding:9px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.88rem; background:var(--surface); color:var(--text);">
        <button class="btn btn-outline" onclick="applyLogoUrl()" style="padding:9px 14px; flex-shrink:0;">Apply</button>
      </div>
    </div>

    <!-- Category -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Category</div>
      <select id="profCategory"
        style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        <option value="">Select a category…</option>
        ${VENUE_CATEGORIES.map(c => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>

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
        <input id="profWebsite" type="url" placeholder="Website (e.g. https://yoursite.jo)" value="${p.website}"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.88rem; background:var(--surface); color:var(--text);">
      </div>
    </div>

    <!-- Socials -->
    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:10px;">Social Media</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${[
          { id: 'profIg', key: 'instagram', ph: '@yourbusiness',      color:'#E1306C', icon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>` },
          { id: 'profFb', key: 'facebook',  ph: 'facebook.com/yourpage', color:'#1877F2', icon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>` },
          { id: 'profWa', key: 'whatsapp',  ph: '+962 79 123 4567',    color:'#25D366', icon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>` },
          { id: 'profTw', key: 'twitter',   ph: '@yourbusiness',       color:'#000000', icon:`<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
        ].map(s => `
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:${s.color}; flex-shrink:0;">${s.icon}</span>
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

function handleLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    if (_ownerProfile) _ownerProfile.logoUrl = e.target.result;
    _updateLogoPreview(e.target.result);
    showOwnerToast('Logo updated! Save profile to apply.', 'info');
  };
  reader.readAsDataURL(file);
}

function applyLogoUrl() {
  const url = document.getElementById('profLogoUrl')?.value.trim();
  if (!url) return;
  if (_ownerProfile) _ownerProfile.logoUrl = url;
  _updateLogoPreview(url);
  showOwnerToast('Logo updated! Save profile to apply.', 'info');
}

function _updateLogoPreview(url) {
  const el = document.getElementById('logoPreviewContainer');
  if (el) el.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:contain;">`;
}

function toggleAmenityStyle(checkbox) {
  const label   = checkbox.closest('label');
  const checked = checkbox.checked;
  label.style.borderColor = checked ? 'var(--primary)' : 'var(--border)';
  label.style.background  = checked ? 'rgba(108,92,231,.08)' : 'transparent';
  label.style.color       = checked ? 'var(--primary)' : 'var(--text)';
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
    status.dataset.lat = lat;
    status.dataset.lng = lng;
  }, () => {
    status.textContent = 'Could not get location. Please allow location access and try again.';
    status.style.color = 'var(--danger)';
  });
}

async function saveProfileForm() {
  const p      = _ownerProfile || {};
  const status = document.getElementById('locationStatus');

  const urlInput = document.getElementById('profLogoUrl')?.value.trim();
  if (urlInput) p.logoUrl = urlInput;

  const bizName  = document.getElementById('profBizName')?.value.trim();
  const category = document.getElementById('profCategory')?.value || '';
  p.category = category;
  p.about    = document.getElementById('profAbout').value.trim();
  p.phone    = document.getElementById('profPhone').value.trim();
  p.website  = document.getElementById('profWebsite').value.trim();
  p.socials  = {
    instagram: document.getElementById('profIg').value.trim(),
    facebook:  document.getElementById('profFb').value.trim(),
    whatsapp:  document.getElementById('profWa').value.trim(),
    twitter:   document.getElementById('profTw').value.trim(),
  };
  p.amenities = [...document.querySelectorAll('[data-amenity]:checked')].map(el => el.dataset.amenity);
  p.photos    = Array.from({ length: 6 }, (_, i) => document.getElementById(`profPhoto${i}`)?.value.trim() || '');

  if (status?.dataset.lat) {
    p.location = p.location || {};
    p.location.lat = parseFloat(status.dataset.lat);
    p.location.lng = parseFloat(status.dataset.lng);
  }
  if (!p.location) p.location = {};
  p.location.address = document.getElementById('profAddress').value.trim();

  const saveBtn = document.querySelector('button[onclick="saveProfileForm()"]');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  try {
    // Update vendor row (name + category + description)
    const vendorUpdates = {};
    if (bizName && bizName !== OWNER_VENDOR.name)     vendorUpdates.name     = bizName;
    if (category !== OWNER_VENDOR.category)           vendorUpdates.category = category;
    if (p.about  !== OWNER_VENDOR.description)        vendorUpdates.description = p.about;
    if (Object.keys(vendorUpdates).length) {
      await dbUpdateVendor(OWNER_VENDOR.id, vendorUpdates);
      Object.assign(OWNER_VENDOR, vendorUpdates);
    }

    // Save vendor_profiles row
    await dbSaveVendorProfile(OWNER_VENDOR.id, p);
    _ownerProfile = p;

    showOwnerToast('Profile saved!', 'success');
    _renderBusinessProfileWith(document.getElementById('ownerMain'), p);
  } catch (err) {
    console.error(err);
    showOwnerToast('Failed to save profile. Please try again.', 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Profile'; }
  }
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
