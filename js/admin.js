/* ── Admin Dashboard ── */
const TZ_ADMIN = 'Asia/Amman';

function adminFmtDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ_ADMIN,
  });
}

/* ── Data helpers ── */
function getAllBookings() {
  const stored = localStorage.getItem('jopass_bookings');
  if (!stored) return [];
  return JSON.parse(stored).map(b => ({ ...b, date: new Date(b.date) }));
}

function getAllReviews() {
  const rStored = localStorage.getItem('jopass_reviews');
  const bStored = localStorage.getItem('jopass_bookings');
  if (!rStored) return [];
  const reviews  = JSON.parse(rStored);
  const bookings = bStored ? JSON.parse(bStored) : [];
  return Object.values(reviews).map(r => {
    const booking = bookings.find(b => b.id === r.bookingId);
    return { ...r, booking };
  });
}

function getAllOpenings() {
  const stored = localStorage.getItem('jopass_openings');
  return stored ? JSON.parse(stored).map(o => ({ ...o, date: new Date(o.date) })) : [];
}

function getApprovedOwners() {
  return JSON.parse(localStorage.getItem('jopass_approved_owners') || '[]');
}

function saveApprovedOwners(list) {
  localStorage.setItem('jopass_approved_owners', JSON.stringify(list));
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => adminNav('overview'));

/* ── View Mode ── */
function setViewMode(mode) {
  document.body.className = `mode-${mode}`;
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
}

/* ── Navigation ── */
function adminNav(view) {
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });
  document.querySelectorAll('.bottom-nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });
  const main = document.getElementById('adminMain');
  switch (view) {
    case 'overview': renderOverview(main); break;
    case 'owners':   renderOwners(main); break;
    case 'bookings': renderAllBookings(main); break;
    case 'reviews':  renderAllReviews(main); break;
  }
  main.scrollTop = 0;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── Overview ── */
function renderOverview(container) {
  const bookings  = getAllBookings();
  const reviews   = getAllReviews();
  const openings  = getAllOpenings();
  const owners    = getApprovedOwners();
  const completed = bookings.filter(b => b.status === 'completed').length;
  const upcoming  = bookings.filter(b => b.status === 'confirmed').length;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const activeSlots = openings.reduce((n, o) => {
    const cap = o.capacity || 1;
    return n + o.slots.filter(s => o.booked.filter(b => b === s).length < cap).length;
  }, 0);

  const vendorStats = VENDORS.map(v => {
    const vBookings = bookings.filter(b => b.vendorId === v.id);
    const vReviews  = reviews.filter(r => r.booking?.vendorId === v.id);
    const vOpenings = openings.filter(o => o.vendorId === v.id);
    return { v, bookings: vBookings.length, reviews: vReviews.length, openings: vOpenings.length };
  }).filter(s => s.bookings > 0 || s.openings > 0);

  container.innerHTML = `
    <div class="page-header"><h2>Overview</h2></div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
      ${[
        { label: 'Total Bookings', value: bookings.length,  color: 'var(--primary)', icon: '📅' },
        { label: 'Upcoming',       value: upcoming,         color: 'var(--success)', icon: '✅' },
        { label: 'Completed',      value: completed,        color: 'var(--accent)',  icon: '🏁' },
        { label: 'Avg Rating',     value: avgRating + (reviews.length ? ' ★' : ''), color: '#f4b942', icon: '⭐' },
        { label: 'Active Slots',   value: activeSlots,      color: 'var(--primary)', icon: '🕐' },
        { label: 'Owner Accounts', value: owners.length,    color: 'var(--danger)',  icon: '🏢' },
      ].map(s => `
        <div class="card" style="padding:14px; display:flex; align-items:center; gap:12px;">
          <span style="font-size:1.6rem;">${s.icon}</span>
          <div>
            <div style="font-size:1.3rem; font-weight:800; color:${s.color};">${s.value}</div>
            <div style="font-size:.72rem; color:var(--text-muted);">${s.label}</div>
          </div>
        </div>
      `).join('')}
    </div>

    ${vendorStats.length > 0 ? `
      <h4 style="margin-bottom:12px;">Vendor Activity</h4>
      ${vendorStats.map(s => `
        <div class="card" style="margin-bottom:10px; display:flex; align-items:center; gap:12px;">
          <span style="font-size:1.5rem;">${s.v.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:.9rem;">${s.v.name}</div>
            <div style="font-size:.75rem; color:var(--text-muted);">${s.v.category}</div>
          </div>
          <div style="display:flex; gap:14px; text-align:center;">
            <div><div style="font-weight:700; color:var(--primary);">${s.bookings}</div><div style="font-size:.68rem; color:var(--text-muted);">bookings</div></div>
            <div><div style="font-weight:700; color:var(--success);">${s.openings}</div><div style="font-size:.68rem; color:var(--text-muted);">openings</div></div>
            <div><div style="font-weight:700; color:#f4b942;">${s.reviews}</div><div style="font-size:.68rem; color:var(--text-muted);">reviews</div></div>
          </div>
        </div>
      `).join('')}
    ` : `
      <div class="empty-state">
        <div class="icon">📊</div>
        <h3>No Activity Yet</h3>
        <p>Bookings and reviews will appear here once customers start using the app.</p>
      </div>
    `}
  `;
}

/* ── Approved Owners ── */
function renderOwners(container) {
  const owners = getApprovedOwners();

  container.innerHTML = `
    <div class="page-header"><h2>Approved Owners</h2></div>
    <p style="font-size:.82rem; color:var(--text-muted); margin-bottom:16px;">
      Only accounts on this list can sign in to the owner portal.
    </p>

    <div class="card" style="margin-bottom:20px; border:2px dashed var(--border); box-shadow:none;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:12px;">+ Add New Owner Account</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <input id="newOwnerName" type="text" placeholder="Business name (e.g. FitZone Gym)"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
          oninput="checkAddOwnerBtn()">
        <input id="newOwnerEmail" type="email" placeholder="owner@business.com"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
          oninput="checkAddOwnerBtn()">
        <input id="newOwnerPass" type="text" placeholder="Password"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
          oninput="checkAddOwnerBtn()">
        <select id="newOwnerVendor"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
          onchange="checkAddOwnerBtn()">
          <option value="">Assign to vendor…</option>
          ${VENDORS.map(v => `<option value="${v.id}">${v.icon} ${v.name}</option>`).join('')}
        </select>
        <button id="addOwnerBtn" class="btn btn-primary btn-full" disabled onclick="addOwner()">Add Owner</button>
      </div>
    </div>

    ${owners.length === 0 ? `
      <div class="empty-state" style="padding:30px 0;">
        <div class="icon">🏢</div>
        <h3>No Owners Yet</h3>
        <p>Add an owner account above to grant portal access.</p>
      </div>
    ` : owners.map(o => {
      const vendor = VENDORS.find(v => v.id === o.vendorId);
      return `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:38px; height:38px; border-radius:50%; background:var(--primary)20; color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0;">
              ${(o.name || o.email)[0].toUpperCase()}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:.88rem;">${o.name || o.email}</div>
              <div style="font-size:.75rem; color:var(--text-muted);">${o.email}</div>
              ${vendor ? `<div style="font-size:.72rem; color:var(--accent); margin-top:2px;">${vendor.icon} ${vendor.name}</div>` : ''}
            </div>
            <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger); flex-shrink:0;" onclick="removeOwner('${o.email}')">Revoke</button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function checkAddOwnerBtn() {
  const name  = document.getElementById('newOwnerName')?.value.trim();
  const email = document.getElementById('newOwnerEmail')?.value.trim();
  const pass  = document.getElementById('newOwnerPass')?.value.trim();
  const vendor = document.getElementById('newOwnerVendor')?.value;
  const btn   = document.getElementById('addOwnerBtn');
  if (btn) btn.disabled = !(name && email && pass && vendor);
}

function addOwner() {
  const name     = document.getElementById('newOwnerName').value.trim();
  const email    = document.getElementById('newOwnerEmail').value.trim().toLowerCase();
  const password = document.getElementById('newOwnerPass').value.trim();
  const vendorId = parseInt(document.getElementById('newOwnerVendor').value);
  if (!name || !email || !password || !vendorId) return;

  const owners = getApprovedOwners();
  if (owners.find(o => o.email === email)) {
    showAdminToast('This email already has an account.', 'info');
    return;
  }
  owners.push({ email, password, vendorId, name });
  saveApprovedOwners(owners);
  showAdminToast(`${name} added as owner.`, 'success');
  renderOwners(document.getElementById('adminMain'));
}

function removeOwner(email) {
  const owners = getApprovedOwners().filter(o => o.email !== email);
  saveApprovedOwners(owners);
  showAdminToast(`Access revoked.`, 'info');
  renderOwners(document.getElementById('adminMain'));
}

/* ── All Bookings ── */
function renderAllBookings(container) {
  const bookings = getAllBookings().reverse();

  container.innerHTML = `
    <div class="page-header"><h2>All Bookings</h2></div>

    ${bookings.length === 0 ? `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>No Bookings Yet</h3>
      </div>
    ` : bookings.map(b => {
      const vendor = VENDORS.find(v => v.id === b.vendorId);
      const isComp = b.status === 'completed';
      return `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:1.4rem;">${vendor?.icon || '🏪'}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:.88rem;">${b.service?.name || 'Service'}</div>
              <div style="font-size:.75rem; color:var(--text-muted);">${vendor?.name || 'Vendor'} · ${adminFmtDate(b.date)} at ${b.time}</div>
            </div>
            <span style="font-size:.72rem; font-weight:600; padding:3px 9px; border-radius:20px; flex-shrink:0;
              background:${isComp ? 'rgba(0,184,148,.1)' : 'rgba(108,92,231,.1)'};
              color:${isComp ? 'var(--success)' : 'var(--primary)'};">
              ${isComp ? 'Completed' : 'Confirmed'}
            </span>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

/* ── All Reviews ── */
function renderAllReviews(container) {
  const reviews = getAllReviews();
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  container.innerHTML = `
    <div class="page-header"><h2>Reviews</h2></div>

    ${reviews.length > 0 ? `
      <div class="card" style="margin-bottom:16px; display:flex; align-items:center; gap:16px;">
        <div style="text-align:center; flex:1; border-right:1px solid var(--border);">
          <div style="font-size:1.8rem; font-weight:800; color:#f4b942;">${avg}</div>
          <div style="font-size:.72rem; color:var(--text-muted);">Avg Rating</div>
        </div>
        <div style="text-align:center; flex:1;">
          <div style="font-size:1.8rem; font-weight:800; color:var(--primary);">${reviews.length}</div>
          <div style="font-size:.72rem; color:var(--text-muted);">Total Reviews</div>
        </div>
      </div>
    ` : ''}

    ${reviews.length === 0 ? `
      <div class="empty-state">
        <div class="icon">⭐</div>
        <h3>No Reviews Yet</h3>
        <p>Reviews will appear here once customers complete and rate their sessions.</p>
      </div>
    ` : reviews.map(r => {
      const vendor = r.booking ? VENDORS.find(v => v.id === r.booking.vendorId) : null;
      return `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
            <div>
              <div style="color:#f4b942; font-size:1rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
              <div style="font-size:.75rem; color:var(--text-muted); margin-top:3px;">
                ${vendor ? vendor.icon + ' ' + vendor.name : 'Venue'} · ${r.booking ? adminFmtDate(r.booking.date) : ''}
              </div>
            </div>
            <span style="font-size:.7rem; background:var(--bg); color:var(--text-muted); padding:2px 8px; border-radius:20px;">Verified</span>
          </div>
          ${r.comment ? `<p style="font-size:.85rem; color:var(--text);">"${r.comment}"</p>` : '<p style="font-size:.8rem; color:var(--text-muted); font-style:italic;">No comment left.</p>'}
        </div>
      `;
    }).join('')}
  `;
}

/* ── Toast ── */
function showAdminToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
