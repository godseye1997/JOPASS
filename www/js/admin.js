/* ── Admin Dashboard ── */
const TZ_ADMIN = 'Asia/Amman';

function adminFmtDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ_ADMIN,
  });
}

/* ── Data helpers (Supabase) ── */
async function getAllBookings() {
  const { data } = await _supabase
    .from('bookings')
    .select('*')
    .order('date', { ascending: false });
  const vendors = await getAllVendors();
  const vMap = {};
  vendors.forEach(v => { vMap[v.id] = v; });
  return (data || []).map(b => ({
    id: b.id, vendorId: b.vendor_id,
    vendor: vMap[b.vendor_id] || { name: 'Unknown', icon: '🏢', color: '#0C5467' },
    service: { name: b.service_name, credits: b.service_credits },
    date: new Date(b.date + 'T00:00:00'), time: b.time, status: b.status,
  }));
}

async function getAllReviews() {
  const { data } = await _supabase
    .from('reviews')
    .select('*, bookings(date, vendor_id, vendors(name,icon))')
    .order('created_at', { ascending: false });
  return (data || []).map(r => ({
    id: r.id, rating: r.rating, comment: r.comment,
    booking: r.bookings ? {
      date: new Date(r.bookings.date + 'T00:00:00'),
      vendorId: r.bookings.vendor_id,
      vendor: r.bookings.vendors,
    } : null,
  }));
}

async function getAllOpenings() {
  const { data } = await _supabase.from('openings').select('*').order('date');
  return (data || []).map(o => ({
    id: o.id, vendorId: o.vendor_id,
    service: { name: o.service_name, duration: o.duration },
    slots: o.slots || [], booked: o.booked_slots || [],
    capacity: o.capacity, date: new Date(o.date + 'T00:00:00'),
  }));
}

async function getAllVendors() {
  const { data } = await _supabase.from('vendors').select('*').order('name');
  return data || [];
}

async function getApprovedOwners() {
  const { data } = await _supabase.from('approved_owners').select('*').order('created_at');
  return data || [];
}

async function saveApprovedOwner(owner) {
  await _supabase.from('approved_owners').upsert(owner);
}

async function deleteApprovedOwner(email) {
  await _supabase.from('approved_owners').delete().eq('email', email);
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
    case 'owners':   renderOwners(main);   break;
    case 'bookings': renderAllBookings(main); break;
    case 'reviews':  renderAllReviews(main);  break;
  }
  main.scrollTop = 0;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── Overview ── */
async function renderOverview(container) {
  container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">Loading…</div>';

  const [bookings, reviews, openings, owners, vendors] = await Promise.all([
    getAllBookings(), getAllReviews(), getAllOpenings(), getApprovedOwners(), getAllVendors(),
  ]);

  const completed = bookings.filter(b => b.status === 'completed').length;
  const upcoming  = bookings.filter(b => b.status === 'confirmed').length;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const activeSlots = openings.reduce((n, o) => {
    const cap = o.capacity || 1;
    return n + o.slots.filter(s => o.booked.filter(b => b === s).length < cap).length;
  }, 0);

  const vendorStats = vendors.map(v => {
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
async function renderOwners(container) {
  container.innerHTML = `<div class="page-header"><h2>Approved Owners</h2></div><div class="empty-state"><div class="icon" style="font-size:1.5rem;">⏳</div><p>Loading…</p></div>`;
  const owners = await getApprovedOwners();

  container.innerHTML = `
    <div class="page-header"><h2>Approved Owners</h2></div>
    <p style="font-size:.82rem; color:var(--text-muted); margin-bottom:16px;">
      Only accounts on this list can sign in to the owner portal.
    </p>

    <div class="card" style="margin-bottom:20px; border:2px dashed var(--border); box-shadow:none;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:12px;">+ Approve New Owner</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <input id="newOwnerName" type="text" placeholder="Business name (e.g. FitZone Gym)"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
          oninput="checkAddOwnerBtn()">
        <input id="newOwnerEmail" type="email" placeholder="owner@business.com"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);"
          oninput="checkAddOwnerBtn()">
        <input id="newOwnerPhone" type="tel" placeholder="Phone number (e.g. +962 79 123 4567)"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        <button id="addOwnerBtn" class="btn btn-primary btn-full" disabled onclick="addOwner()">Approve Owner</button>
      </div>
    </div>

    ${owners.length === 0 ? `
      <div class="empty-state" style="padding:30px 0;">
        <div class="icon">🏢</div>
        <h3>No Owners Yet</h3>
        <p>Add an owner account above to grant portal access.</p>
      </div>
    ` : owners.map(o => `
        <div class="card" style="margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:38px; height:38px; border-radius:50%; background:var(--primary)20; color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0;">
              ${(o.name || o.email)[0].toUpperCase()}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:.88rem;">${o.name || '—'}</div>
              <div style="font-size:.75rem; color:var(--text-muted);">${o.email}</div>
              ${o.phone ? `<div style="font-size:.72rem; color:var(--text-muted);">${o.phone}</div>` : ''}
              <div style="font-size:.7rem; margin-top:3px;">
                ${o.claimed ? `<span style="color:var(--success);">✓ Account created</span>` : `<span style="color:var(--warning);">Pending signup</span>`}
              </div>
            </div>
            <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger); flex-shrink:0;" onclick="removeOwner('${o.email}')">Revoke</button>
          </div>
        </div>
      `).join('')}
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function checkAddOwnerBtn() {
  const name  = document.getElementById('newOwnerName')?.value.trim();
  const email = document.getElementById('newOwnerEmail')?.value.trim();
  const btn   = document.getElementById('addOwnerBtn');
  if (btn) btn.disabled = !(name && email);
}

async function addOwner() {
  const name  = document.getElementById('newOwnerName').value.trim();
  const email = document.getElementById('newOwnerEmail').value.trim().toLowerCase();
  const phone = document.getElementById('newOwnerPhone').value.trim();
  if (!name || !email) return;

  const { error } = await _supabase.from('approved_owners').upsert({ email, name, phone, claimed: false });
  if (error) { showAdminToast('Error: ' + error.message, 'error'); return; }
  showAdminToast(`${name} approved. They can now sign up at owner-signup.html`, 'success');
  renderOwners(document.getElementById('adminMain'));
}

async function removeOwner(email) {
  await _supabase.from('approved_owners').delete().eq('email', email);
  showAdminToast('Access revoked.', 'info');
  renderOwners(document.getElementById('adminMain'));
}

/* ── All Bookings ── */
async function renderAllBookings(container) {
  container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">Loading…</div>';
  const bookings = await getAllBookings();

  container.innerHTML = `
    <div class="page-header"><h2>All Bookings</h2></div>

    ${bookings.length === 0 ? `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>No Bookings Yet</h3>
      </div>
    ` : bookings.map(b => {
      const vendor = b.vendor;
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
async function renderAllReviews(container) {
  container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">Loading…</div>';
  const reviews = await getAllReviews();
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
      const vendor = r.booking?.vendor || null;
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
