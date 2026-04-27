/* ── State ── */
const state = {
  userId:    null,
  userName:  '',
  userEmail: '',
  userPhone: '',
  credits:  0,
  bookings: [],
  reviews:  {},           // bookingId  → { rating, comment }
  servicesMap:      {},   // vendorId   → [services]
  openingsMap:      {},   // vendorId   → [openings]
  vendorProfilesMap:{},   // vendorId   → profile
  vendorReviewsMap: {},   // vendorId   → [review objects]
  currentView:   'browse',
  viewMode:      'mobile',
  selectedVendor:  null,
  selectedService: null,
  selectedDate:    null,
  selectedTime:    null,
  selectedReviewBookingId: null,
  selectedReviewRating: 0,
  calendarMonth: new Date().getMonth(),
  calendarYear:  new Date().getFullYear(),
};

const TZ = 'Asia/Amman'; // GMT+3

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  state.userId = session.user.id;

  const main = document.getElementById('mainContent');
  main.innerHTML = '<div style="padding:60px 20px; text-align:center; color:var(--text-muted);">Loading…</div>';

  try {
    const d = await dbFetchInitData(state.userId);

    if (d.profile) {
      state.credits   = d.profile.credits   || 0;
      state.userName  = d.profile.full_name  || '';
      state.userEmail = d.profile.email      || session.user.email || '';
      state.userPhone = d.profile.phone      || '';
    }

    VENDORS = d.vendors;

    // Services map
    state.servicesMap = {};
    d.services.forEach(s => {
      const vid = s.vendor_id;
      if (!state.servicesMap[vid]) state.servicesMap[vid] = [];
      state.servicesMap[vid].push({
        id: s.id, vendor_id: vid, name: s.name, duration: s.duration,
        price: parseFloat(s.price), jopassPrice: parseFloat(s.jopass_price), credits: s.credits,
      });
    });

    // Openings map
    state.openingsMap = {};
    d.openings.forEach(o => {
      const vid = o.vendor_id;
      if (!state.openingsMap[vid]) state.openingsMap[vid] = [];
      state.openingsMap[vid].push(dbParseOpening(o));
    });

    // Vendor profiles map
    state.vendorProfilesMap = {};
    d.vendorProfiles.forEach(p => {
      state.vendorProfilesMap[p.vendor_id] = {
        logoUrl:   p.logo_url,
        about:     p.about,
        phone:     p.phone,
        website:   p.website,
        socials: {
          instagram: p.instagram,
          facebook:  p.facebook,
          whatsapp:  p.whatsapp,
          twitter:   p.twitter,
        },
        amenities: p.amenities || [],
        photos:    p.photos    || [],
        location: {
          address: p.location_address,
          lat: p.location_lat ? parseFloat(p.location_lat) : null,
          lng: p.location_lng ? parseFloat(p.location_lng) : null,
        },
      };
    });

    // All-vendor reviews map (for browse cards + vendor detail pages)
    state.vendorReviewsMap = {};
    d.allReviews.forEach(r => {
      const vid = r.vendor_id;
      if (!state.vendorReviewsMap[vid]) state.vendorReviewsMap[vid] = [];
      state.vendorReviewsMap[vid].push({
        rating:  r.rating,
        comment: r.comment,
        service: r.bookings?.service_name || '',
        date:    r.bookings?.date ? new Date(r.bookings.date + 'T00:00:00') : new Date(r.created_at),
      });
    });

    // User's own bookings
    state.bookings = _parseBookings(d.bookings);

    // User's reviews keyed by booking_id
    state.reviews = {};
    d.userReviews.forEach(r => {
      state.reviews[r.booking_id] = { rating: r.rating, comment: r.comment, bookingId: r.booking_id };
    });

    updateCreditDisplay();
    updateUserDisplay();
    navigateTo('browse');

    setInterval(() => { checkBookingStatuses(); refreshBookings(); }, 30000);
    scheduleReminders();
  } catch (err) {
    console.error('Init error:', err);
    main.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--danger);">Failed to load. Please refresh the page.</div>`;
  }
});

function _parseBookings(rows) {
  return rows.map(b => ({
    id:       b.id,
    vendorId: b.vendor_id,
    vendor: b.vendors
      ? { id: b.vendor_id, name: b.vendors.name, icon: b.vendors.icon, color: b.vendors.color }
      : VENDORS.find(v => v.id === b.vendor_id) || { id: b.vendor_id, name: 'Unknown', icon: '🏢', color: '#0C5467' },
    service: {
      name:        b.service_name,
      credits:     b.service_credits,
      jopassPrice: parseFloat(b.service_price),
      price:       parseFloat(b.original_price),
    },
    date:   new Date(b.date + 'T00:00:00'),
    time:   b.time,
    status: b.status,
  }));
}

function updateUserDisplay() {
  const name     = state.userName || 'User';
  const email    = state.userEmail || '';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initials);
  document.querySelectorAll('.user-avatar-sm').forEach(el => el.textContent = initials);
  const nameEl  = document.querySelector('.sidebar-footer .name');
  const emailEl = document.querySelector('.sidebar-footer .email');
  if (nameEl)  nameEl.textContent  = name;
  if (emailEl) emailEl.textContent = email;

  const logoutLink = document.querySelector('.sidebar-footer a[href="index.html"]');
  if (logoutLink) {
    logoutLink.removeAttribute('href');
    logoutLink.style.cursor = 'pointer';
    logoutLink.onclick = e => { e.preventDefault(); signOutUser(); };
  }
}

async function refreshBookings() {
  const rows = await dbFetchUserBookings(state.userId);
  const fresh = _parseBookings(rows);

  const notified = JSON.parse(localStorage.getItem('jopass_notified_cancellations') || '[]');
  let changed = false;

  fresh
    .filter(b => b.status === 'cancelled' && !notified.includes(b.id))
    .forEach(b => {
      sendNotification('Booking Cancelled', `Your ${b.service.name} booking was cancelled.`);
      showToast(`Your ${b.service.name} booking was cancelled by the venue.`, 'error');
      notified.push(b.id);
      changed = true;
    });

  if (changed) localStorage.setItem('jopass_notified_cancellations', JSON.stringify(notified));
  state.bookings = fresh;
}

/* ── GMT+3 date helpers ── */
function fmtDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ });
}
function fmtDateLong(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ });
}

/* ── Notifications ── */
async function openNotificationSettings() {
  const LN = window.Capacitor?.Plugins?.LocalNotifications;
  if (LN) {
    try {
      const { display } = await LN.checkPermissions();
      if (display === 'granted') {
        showToast('Notifications are already enabled.', 'success');
        return;
      }
      if (display === 'denied') {
        // Already denied — send user to system settings
        const AppPlugin = window.Capacitor?.Plugins?.App;
        if (AppPlugin?.openUrl) AppPlugin.openUrl({ url: 'app-settings:' });
        else showToast('Go to Settings → Apps → JoPass → Notifications and enable them.', 'info');
        return;
      }
      // Not yet asked — request permission natively
      const { display: result } = await LN.requestPermissions();
      if (result === 'granted') {
        showToast('Notifications enabled!', 'success');
      } else {
        showToast('Notifications were not enabled.', 'error');
      }
    } catch (_) {
      showToast('Go to Settings → Apps → JoPass → Notifications to enable alerts.', 'info');
    }
  } else {
    showToast('Go to Settings → Apps → JoPass → Notifications to enable alerts.', 'info');
  }
}


/* ── Session completion ── */
function getBookingDateTime(booking) {
  const d = new Date(booking.date);
  const m = booking.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return d;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  d.setHours(h, min, 0, 0);
  return d;
}

async function checkBookingStatuses() {
  const now = new Date();
  const toComplete = state.bookings.filter(b => b.status === 'confirmed' && getBookingDateTime(b) < now);
  if (!toComplete.length) return;

  for (const b of toComplete) {
    b.status = 'completed';
    await dbUpdateBookingStatus(b.id, 'completed').catch(() => {});
    if (!state.reviews[b.id]) openReviewModal(b.id);
  }

  if (state.currentView === 'bookings') renderBookings(document.getElementById('mainContent'));
  if (state.currentView === 'vendor')   renderVendorDetail(document.getElementById('mainContent'));
}

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
  if (window._navPush) window._navPush(view);

  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });
  document.querySelectorAll('.bottom-nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });

  const main = document.getElementById('mainContent');
  switch (view) {
    case 'browse':   renderBrowse(main);        break;
    case 'vendor':
      main.innerHTML = '<div style="padding:60px 20px; text-align:center; color:var(--text-muted);">Loading…</div>';
      renderVendorDetail(main).then(() => {
        main.scrollTop = 0;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
      return;
    case 'credits':  renderCredits(main);       break;
    case 'bookings': renderBookings(main);       break;
    case 'profile':      renderProfile(main);      break;
    case 'editProfile':  renderEditProfile(main); break;
    case 'settings':     renderSettings(main);     break;
  }

  main.scrollTop = 0;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── Credit Display ── */
function updateCreditDisplay() {
  const sidebar = document.getElementById('creditCount');
  const header  = document.getElementById('creditCountHeader');
  const bar     = document.getElementById('creditBarCount');
  if (sidebar) sidebar.textContent = state.credits;
  if (header)  header.textContent  = state.credits;
  if (bar)     bar.textContent     = state.credits;
}

/* ── Browse View ── */
function renderBrowse(container) {
  const categories = ['All', ...VENUE_CATEGORIES];

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
    <div style="position:relative; margin-bottom:12px;">
      <i data-lucide="search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--text-muted); pointer-events:none;"></i>
      <input id="browseSearch" type="text" placeholder="Search venues…"
        style="width:100%; padding:10px 12px 10px 36px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text); box-sizing:border-box;"
        oninput="filterBrowse()">
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
      filterBrowse();
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterBrowse() {
  const query    = (document.getElementById('browseSearch')?.value || '').toLowerCase().trim();
  const activeBtn = document.querySelector('.filter-btn.active');
  const cat      = activeBtn?.dataset.cat || 'All';

  let results = cat === 'All' ? VENDORS : VENDORS.filter(v => parseCategories(v.category).includes(cat));
  if (query) {
    results = results.filter(v =>
      v.name.toLowerCase().includes(query) ||
      getVendorCategory(v).toLowerCase().includes(query)
    );
  }

  const grid = document.getElementById('vendorGrid');
  if (!grid) return;
  grid.innerHTML = results.length
    ? renderVendorCards(results)
    : `<div style="grid-column:1/-1; padding:40px 0; text-align:center; color:var(--text-muted);">No venues found for "<strong>${query}</strong>"</div>`;
}

function renderVendorCards(vendors) {
  return vendors.map(v => {
    const services = getServicesForVendor(v.id);
    const openings = getOpeningsForVendor(v.id);
    if (!services.length && !openings.length) return '';

    const reviews   = getReviewsForVendor(v.id);
    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    let badge, priceHtml;
    if (services.length) {
      const cheapest = services.reduce((a, b) => a.jopassPrice < b.jopassPrice ? a : b);
      const saving   = (cheapest.price - cheapest.jopassPrice).toFixed(2);
      const discount = Math.round((1 - cheapest.jopassPrice / cheapest.price) * 100);
      badge     = discount > 0 ? `<span class="badge">${discount}% OFF</span>` : '';
      priceHtml = discount > 0
        ? `<span class="price">From ${cheapest.credits} credits</span>
           <span style="font-size:.75rem; color:var(--success); display:block; margin-top:2px;">Save ${saving} JOD</span>`
        : `<span class="price">From ${cheapest.credits} credits</span>`;
    } else {
      const totalSlots = openings.reduce((n, o) => n + o.slots.length, 0);
      badge     = `<span class="badge" style="background:var(--accent);">${totalSlots} Slot${totalSlots !== 1 ? 's' : ''}</span>`;
      const next = openings[0];
      priceHtml = next.credits
        ? `<span class="price">From ${next.credits} credits</span>`
        : `<span class="price">${fmtDate(next.date)}</span>`;
    }

    return `
      <div class="vendor-card" onclick="navigateTo('vendor', ${v.id})">
        <div class="thumb" style="background-image:url('${v.image}')">
          ${badge}
        </div>
        <div class="card-body">
          <h3>${vendorIcon(v, '20px')} ${v.name}</h3>
          <p class="category">${getVendorCategory(v)}</p>
          <p>${priceHtml}</p>
          ${avgRating ? `<p style="font-size:.78rem; color:#f4b942; margin-top:4px;">★ ${avgRating} <span style="color:var(--text-muted);">(${reviews.length})</span></p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* ── Vendor Detail ── */
function getReviewsForVendor(vendorId) {
  return state.vendorReviewsMap?.[vendorId] || [];
}

function getServicesForVendor(vendorId) {
  return state.servicesMap?.[vendorId] || [];
}

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

function getOpeningsForVendor(vendorId) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return (state.openingsMap?.[vendorId] || [])
    .filter(o => o.date >= today)
    .map(o => ({
      ...o,
      slots: o.slots.filter(s => !slotIsPast(o.date, s)),
    }))
    .filter(o => o.slots.length > 0)
    .sort((a, b) => a.date - b.date);
}

function getVendorCategory(vendor) {
  return parseCategories(vendor.category).join(' · ') || '';
}

function vendorIcon(vendor, size) {
  const profile = getVendorProfile(vendor?.id);
  if (profile?.logoUrl) {
    const s = size || '24px';
    return `<img src="${profile.logoUrl}" style="width:${s};height:${s};object-fit:contain;border-radius:4px;vertical-align:middle;">`;
  }
  return vendor?.icon || '';
}

function getVendorProfile(vendorId) {
  return state.vendorProfilesMap?.[vendorId] || null;
}

async function renderVendorDetail(container) {
  const v = state.selectedVendor;
  if (!v) return navigateTo('browse');

  // Re-fetch openings fresh so customer always sees latest slots
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await _supabase.from('openings').select('*')
      .eq('vendor_id', v.id).gte('date', today).order('date');
    if (data) {
      state.openingsMap[v.id] = data.map(dbParseOpening);
    }
  } catch (_) {}

  const openings = getOpeningsForVendor(v.id);
  const services = getServicesForVendor(v.id);
  const profile  = getVendorProfile(v.id);
  const photos   = profile?.photos?.filter(u => u) || [];

  container.innerHTML = `
    <div class="page-header">
      <h2>
        <a href="#" onclick="navigateTo('browse'); return false;" style="color:var(--text-muted); font-size:.9rem;">← Back</a>
      </h2>
    </div>

    ${photos.length > 0 ? `
      <div style="display:flex; gap:6px; overflow-x:auto; margin-bottom:16px; padding-bottom:4px; -webkit-overflow-scrolling:touch;">
        ${photos.map(url => `
          <img src="${url}" onerror="this.style.display='none'"
            style="height:140px; min-width:200px; object-fit:cover; border-radius:var(--radius-sm); flex-shrink:0;">
        `).join('')}
      </div>
    ` : ''}

    <div style="margin-bottom:16px;">
      <h3>${vendorIcon(v, '24px')} ${v.name}</h3>
      <p style="font-size:.8rem; color:var(--text-muted); margin-top:4px;">${profile?.about || v.description || ''}</p>

      ${profile?.phone || profile?.website ? `
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
          ${profile.phone ? `<a href="tel:${profile.phone}" style="font-size:.82rem; color:var(--primary);">📞 ${profile.phone}</a>` : ''}
          ${profile.website ? `<a href="${profile.website}" target="_blank" style="font-size:.82rem; color:var(--primary);">🌐 Website</a>` : ''}
        </div>
      ` : ''}

      ${profile?.socials ? (() => {
        const s = profile.socials;
        const links = [
          s.instagram ? `<a href="https://instagram.com/${s.instagram.replace('@','')}" target="_blank" title="Instagram" style="color:#E1306C; display:inline-flex;"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>` : '',
          s.facebook  ? `<a href="${s.facebook.startsWith('http') ? s.facebook : 'https://'+s.facebook}" target="_blank" title="Facebook" style="color:#1877F2; display:inline-flex;"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>` : '',
          s.whatsapp  ? `<a href="https://wa.me/${s.whatsapp.replace(/\D/g,'')}" target="_blank" title="WhatsApp" style="color:#25D366; display:inline-flex;"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>` : '',
          s.twitter   ? `<a href="https://twitter.com/${s.twitter.replace('@','')}" target="_blank" title="X" style="color:#000; display:inline-flex;"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>` : '',
        ].filter(Boolean).join('');
        return links ? `<div style="display:flex; gap:12px; margin-top:10px;">${links}</div>` : '';
      })() : ''}
    </div>

    ${profile?.amenities?.length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:.82rem; font-weight:600; color:var(--text-muted); margin-bottom:8px;">AMENITIES</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${profile.amenities.map(a => `
            <span style="padding:4px 10px; border-radius:20px; font-size:.75rem; font-weight:500; background:var(--bg); border:1px solid var(--border);">${a}</span>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${profile?.location?.address || profile?.location?.lat ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:.82rem; font-weight:600; color:var(--text-muted); margin-bottom:8px;">LOCATION</div>
        ${profile.location.address ? `<p style="font-size:.85rem; margin-bottom:8px;">📍 ${profile.location.address}</p>` : ''}
        ${profile.location.lat ? `
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=${profile.location.lng-0.008},${profile.location.lat-0.008},${profile.location.lng+0.008},${profile.location.lat+0.008}&layer=mapnik&marker=${profile.location.lat},${profile.location.lng}"
            style="width:100%; height:160px; border:1px solid var(--border); border-radius:var(--radius-sm);" loading="lazy">
          </iframe>
          <a href="https://www.google.com/maps?q=${profile.location.lat},${profile.location.lng}" target="_blank"
            style="display:block; text-align:center; font-size:.78rem; margin-top:6px; color:var(--primary);">Open in Google Maps ↗</a>
        ` : ''}
      </div>
    ` : ''}

    ${services.length > 0 ? `<h4 style="margin-bottom:12px;">Standard</h4>` : ''}
    <div class="grid grid-2">
      ${services.map(s => {
        const discount = Math.round((1 - s.jopassPrice / s.price) * 100);
        return `
        <div class="card" style="cursor:pointer;" onclick="openBookingModal(${v.id}, ${s.id})">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div>
              <h4 style="font-size:.9rem;">${s.name}</h4>
              <p style="font-size:.8rem; color:var(--text-muted);">${s.duration || ''}</p>
            </div>
            <div style="text-align:right;">
              <div class="price" style="font-size:1rem;">${s.credits} credits</div>
              ${s.price > s.jopassPrice ? `<div style="font-size:.75rem; color:var(--success); font-weight:600;">Save ${toJOD(s.price - s.jopassPrice)} JOD</div>` : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
            <span style="font-size:.75rem; font-weight:600; color:var(--success);">Save ${discount}%</span>
            <button class="btn btn-primary btn-sm">Book Now</button>
          </div>
        </div>
      `}).join('')}
    </div>

    ${openings.length > 0 ? `
      <h4 style="margin:20px 0 12px;">Deals</h4>
      ${openings.map(o => {
        const capacity  = o.capacity || 1;
        const dateStr   = fmtDate(o.date);
        const hasPrice  = o.jopassPrice > 0;
        const canAfford = !hasPrice || state.credits >= o.credits;
        return `
          <div class="card" style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px; flex-wrap:wrap; gap:6px;">
              <div>
                <div style="font-weight:600; font-size:.9rem;">${o.service.name}</div>
                <div style="font-size:.8rem; color:var(--text-muted); margin-top:2px;">${dateStr}${o.service.duration ? ' · ' + o.service.duration : ''}</div>
              </div>
              ${hasPrice ? `
                <div style="text-align:right;">
                  <div style="font-weight:700; color:var(--primary); font-size:.98rem;">${o.credits} credits</div>
                  <div style="font-size:.75rem; color:var(--success); font-weight:600;">Save ${(o.originalPrice - o.jopassPrice).toFixed(2)} JOD</div>
                </div>
              ` : ''}
            </div>
            ${hasPrice && !canAfford ? `<p style="font-size:.78rem; color:var(--danger); margin-bottom:8px;">Not enough credits — <a href="#" onclick="navigateTo('credits'); return false;">buy more</a></p>` : ''}
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              ${o.slots.map(slot => {
                const bookedCount = o.booked.filter(b => b === slot).length;
                const isFull   = bookedCount >= capacity;
                const disabled = isFull || !canAfford;
                return `
                  <button
                    onclick="${disabled ? '' : `reserveOpeningSlot('${o.id}', '${slot}')`}"
                    style="padding:7px 14px; border-radius:var(--radius-sm); font-size:.8rem; font-weight:500; cursor:${disabled ? 'default' : 'pointer'};
                      border:2px solid ${isFull ? 'var(--border)' : disabled ? 'var(--border)' : 'var(--primary)'};
                      background:${isFull ? 'var(--bg)' : 'transparent'};
                      color:${isFull ? 'var(--text-muted)' : disabled ? 'var(--text-muted)' : 'var(--primary)'};">
                    ${slot}${capacity > 1 ? ` · ${capacity - bookedCount} left` : ''}${isFull ? ' · Full' : ''}
                  </button>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}
    ` : ''}

    ${renderVendorReviews(v.id)}
  `;
}

function renderVendorReviews(vendorId) {
  const reviews = getReviewsForVendor(vendorId);
  if (reviews.length === 0) return '';

  const avg     = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;

  return `
    <div style="margin-top:20px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <h4>Reviews</h4>
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="color:#f4b942; font-size:1rem;">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</span>
          <span style="font-weight:700; font-size:.9rem;">${rounded}</span>
          <span style="font-size:.8rem; color:var(--text-muted);">(${reviews.length})</span>
        </div>
      </div>
      ${reviews.map(r => `
        <div class="card" style="margin-bottom:10px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:6px;">
            <div>
              <div style="color:#f4b942; font-size:.95rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
              <div style="font-size:.75rem; color:var(--text-muted); margin-top:2px;">
                ${r.service ? r.service + ' · ' : ''}${fmtDate(r.date)}
              </div>
            </div>
            <span style="font-size:.7rem; color:var(--text-muted); background:var(--bg); padding:2px 8px; border-radius:20px;">Verified</span>
          </div>
          ${r.comment ? `<p style="font-size:.85rem; color:var(--text); margin:0;">"${r.comment}"</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function reserveOpeningSlot(openingId, slot) {
  let opening = null;
  for (const vid in state.openingsMap) {
    const found = state.openingsMap[vid].find(o => o.id === openingId);
    if (found) { opening = found; break; }
  }
  if (!opening) return;

  const capacity    = opening.capacity || 1;
  const bookedCount = opening.booked.filter(b => b === slot).length;
  if (bookedCount >= capacity) return;

  const credits = opening.credits || 0;
  if (credits > 0 && state.credits < credits) {
    showToast('Not enough credits to book this slot.', 'error');
    return;
  }

  const vendor = state.selectedVendor;
  const dateStr = fmtDate(opening.date);
  showConfirmDialog({
    title: 'Confirm Booking',
    message: `Book <strong>${opening.service.name}</strong> at <strong>${vendor.name}</strong><br>${dateStr} at <strong>${slot}</strong>${credits > 0 ? `<br><br>This will use <strong>${credits} credits</strong> from your balance.` : ''}`,
    confirmLabel: credits > 0 ? `Book — ${credits} credits` : 'Confirm Booking',
    onConfirm: () => _doReserveOpeningSlot(openingId, slot),
  });
}

async function _doReserveOpeningSlot(openingId, slot) {
  let opening = null;
  for (const vid in state.openingsMap) {
    const found = state.openingsMap[vid].find(o => o.id === openingId);
    if (found) { opening = found; break; }
  }
  if (!opening) return;

  const credits = opening.credits || 0;

  try {
    await dbAppendBookedSlot(openingId, slot);

    const bookingId = await dbCreateBooking({
      userId:   state.userId,
      vendorId: state.selectedVendor.id,
      service: {
        name:        opening.service.name,
        credits:     opening.credits,
        jopassPrice: opening.jopassPrice,
        price:       opening.originalPrice || opening.jopassPrice,
      },
      date: opening.date,
      time: slot,
    });

    if (credits > 0) {
      state.credits -= credits;
      await dbUpdateCredits(state.userId, state.credits);
      updateCreditDisplay();
    }

    opening.booked.push(slot);

    state.bookings.unshift({
      id:       bookingId,
      vendorId: state.selectedVendor.id,
      vendor:   state.selectedVendor,
      service: {
        name:        opening.service.name,
        credits:     opening.credits,
        jopassPrice: opening.jopassPrice,
        price:       opening.originalPrice || opening.jopassPrice,
      },
      date:   new Date(opening.date),
      time:   slot,
      status: 'confirmed',
    });

    showToast(`Reserved ${slot} for ${opening.service.name}!`, 'success');
    renderVendorDetail(document.getElementById('mainContent'));
  } catch (err) {
    console.error(err);
    showToast('Could not reserve slot. Please try again.', 'error');
  }
}

/* ── Booking Modal ── */
function openBookingModal(vendorId, serviceId) {
  const vendor  = VENDORS.find(v => v.id === vendorId);
  const service = getServicesForVendor(vendorId).find(s => s.id === serviceId);
  state.selectedVendor  = vendor;
  state.selectedService = service;
  state.selectedDate    = null;
  state.selectedTime    = null;
  state.calendarMonth   = new Date().getMonth();
  state.calendarYear    = new Date().getFullYear();

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

  document.getElementById('modalTitle').textContent = `Book: ${s.name}`;
  document.getElementById('modalBody').innerHTML = `
    <p style="margin-bottom:4px;"><strong>${vendorIcon(v, '20px')} ${v.name}</strong></p>
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap;">
      <span style="font-size:1.15rem; font-weight:700; color:var(--primary);">${s.credits} credits</span>
      ${s.price > s.jopassPrice ? `<span style="font-size:.82rem; color:var(--success); font-weight:600;">Save ${toJOD(s.price - s.jopassPrice)} JOD</span>` : ''}
    </div>
    <p style="font-size:.8rem; color:var(--text-muted); margin-bottom:14px;">${s.duration || ''}</p>

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
  const cal   = document.getElementById('bookingCalendar');
  const year  = state.calendarYear;
  const month = state.calendarMonth;
  const today = new Date();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  let html = `
    <div class="calendar-header">
      <button onclick="changeMonth(-1)">‹</button>
      <span>${monthNames[month]} ${year}</span>
      <button onclick="changeMonth(1)">›</button>
    </div>
    <div class="calendar-grid">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="day-name">${d}</div>`).join('')}
  `;

  for (let i = 0; i < firstDay; i++) html += `<div class="day disabled"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const date     = new Date(year, month, d);
    const isPast   = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday  = date.toDateString() === today.toDateString();
    const isSelected = state.selectedDate && date.toDateString() === state.selectedDate.toDateString();
    let classes = 'day';
    if (isPast)     classes += ' disabled';
    if (isToday)    classes += ' today';
    if (isSelected) classes += ' selected';
    if (!isPast)    classes += ' has-slots';

    html += `<div class="${classes}" ${!isPast ? `onclick="selectDate(${year},${month},${d})"` : ''}>${d}</div>`;
  }

  html += `</div>`;
  cal.innerHTML = html;
}

function changeMonth(delta) {
  state.calendarMonth += delta;
  if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
  if (state.calendarMonth < 0)  { state.calendarMonth = 11; state.calendarYear--; }
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
  const slotsDiv  = document.getElementById('timeSlots');
  container.style.display = 'block';

  const allSlots = [
    '8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
    '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM',
    '7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM',
    '10:00 PM','10:30 PM','11:00 PM','11:30 PM','12:00 AM',
  ];

  const isToday = state.selectedDate.toDateString() === new Date().toDateString();

  const available = allSlots.filter(slot => {
    if (isToday && slotIsPast(state.selectedDate, slot)) return false;
    return true;
  });

  if (available.length === 0) {
    slotsDiv.innerHTML = `<p style="font-size:.82rem; color:var(--text-muted); padding:8px 0;">No more available slots for today. Please select another date.</p>`;
    return;
  }

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
  const content   = document.getElementById('summaryContent');
  container.style.display = 'block';

  const dateStr = fmtDateLong(state.selectedDate);
  const s = state.selectedService;
  content.innerHTML = `
    <p><strong>Service:</strong> ${s.name}</p>
    <p><strong>Provider:</strong> ${state.selectedVendor.name}</p>
    <p><strong>Date:</strong> ${dateStr}</p>
    <p><strong>Time:</strong> ${state.selectedTime}</p>
    <p><strong>Price:</strong> <span style="color:var(--primary); font-weight:700;">${s.credits} credits</span></p>
    ${s.price > s.jopassPrice ? `<p style="color:var(--success); font-weight:600;">You save ${toJOD(s.price - s.jopassPrice)} JOD!</p>` : ''}
  `;
}

function updateConfirmButton() {
  const btn    = document.getElementById('confirmBookingBtn');
  const canBook = state.selectedDate && state.selectedTime;
  btn.disabled = !canBook;

  if (canBook && state.credits < state.selectedService.credits) {
    btn.textContent = 'Not Enough Credits';
    btn.disabled    = true;
  } else if (canBook) {
    btn.textContent = `Confirm — ${state.selectedService.credits} credits`;
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
  showConfirmDialog({
    title: `Confirm Booking`,
    message: `Book <strong>${s.name}</strong> at <strong>${state.selectedVendor.name}</strong> on ${fmtDate(state.selectedDate)} at ${state.selectedTime}?<br><br>This will use <strong>${s.credits} credits</strong> from your balance.`,
    confirmLabel: `Book — ${s.credits} credits`,
    onConfirm: _doConfirmBooking,
  });
}

async function _doConfirmBooking() {
  const s = state.selectedService;
  const btn = document.getElementById('confirmBookingBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Booking…'; }

  try {
    const bookingId = await dbCreateBooking({
      userId:   state.userId,
      vendorId: state.selectedVendor.id,
      service:  s,
      date:     state.selectedDate,
      time:     state.selectedTime,
    });

    state.credits -= s.credits;
    await dbUpdateCredits(state.userId, state.credits);

    state.bookings.unshift({
      id:       bookingId,
      vendorId: state.selectedVendor.id,
      vendor:   state.selectedVendor,
      service:  s,
      date:     new Date(state.selectedDate),
      time:     state.selectedTime,
      status:   'confirmed',
    });

    updateCreditDisplay();
    closeBookingModal();
    showToast(`Booked ${s.name} at ${state.selectedVendor.name}!`, 'success');

    if (state.currentView === 'browse') renderBrowse(document.getElementById('mainContent'));
    if (state.currentView === 'vendor') renderVendorDetail(document.getElementById('mainContent'));
  } catch (err) {
    console.error(err);
    showToast('Booking failed. Please try again.', 'error');
    btn.disabled    = false;
    btn.textContent = `Confirm — ${s.credits} credits`;
  }
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
        <strong>3. Book &amp; Save</strong>
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
  openPaymentModal(pack);
}

/* ── Payment Modal ── */
function openPaymentModal(pack) {
  state.selectedPack = pack;
  const body = document.getElementById('paymentModalBody');

  body.innerHTML = `
    <div style="background:linear-gradient(135deg,var(--primary),var(--primary-dark)); border-radius:var(--radius); padding:16px 20px; margin-bottom:20px; color:#fff;">
      <div style="font-size:.75rem; opacity:.8; margin-bottom:4px;">Purchasing</div>
      <div style="font-size:1.1rem; font-weight:700;">${pack.label} — ${pack.credits} Credits</div>
      <div style="font-size:1.5rem; font-weight:800; margin-top:4px;">${pack.price.toFixed(2)} JOD</div>
    </div>

    <div id="cardPreview" style="
      background:linear-gradient(135deg,#2d3436,#636e72);
      border-radius:12px; padding:18px; margin-bottom:20px; color:#fff; font-family:monospace;
      display:flex; flex-direction:column; gap:10px; min-height:96px; position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:.7rem; opacity:.7; letter-spacing:.05em;">CARD NUMBER</span>
        <span id="cardBrand" style="font-size:1rem; font-weight:700; letter-spacing:.05em; opacity:.9;"></span>
      </div>
      <div id="cardNumPreview" style="font-size:1rem; letter-spacing:.18em; opacity:.9;">•••• •••• •••• ••••</div>
      <div style="display:flex; justify-content:space-between;">
        <div>
          <div style="font-size:.6rem; opacity:.6; margin-bottom:2px;">CARDHOLDER</div>
          <div id="cardNamePreview" style="font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; opacity:.85;">YOUR NAME</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:.6rem; opacity:.6; margin-bottom:2px;">EXPIRES</div>
          <div id="cardExpiryPreview" style="font-size:.8rem; letter-spacing:.05em; opacity:.85;">MM/YY</div>
        </div>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:14px;">
      <div>
        <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:6px;">Cardholder Name</label>
        <input id="cardName" type="text" placeholder="Yazeed Hijazi" autocomplete="cc-name"
          oninput="updateCardPreview()"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
      </div>
      <div>
        <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:6px;">Card Number</label>
        <input id="cardNumber" type="text" placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number"
          oninput="formatCardNumber(this); updateCardPreview()"
          style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text); letter-spacing:.05em;">
      </div>
      <div style="display:flex; gap:12px;">
        <div style="flex:1;">
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:6px;">Expiry</label>
          <input id="cardExpiry" type="text" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp"
            oninput="formatExpiry(this); updateCardPreview()"
            style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
        <div style="flex:1;">
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:6px;">CVV</label>
          <input id="cardCVV" type="password" placeholder="•••" maxlength="4" autocomplete="cc-csc"
            oninput="updateCardPreview()"
            style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
      </div>
    </div>
  `;

  document.getElementById('payBtn').textContent = `Pay ${pack.price.toFixed(2)} JOD`;
  document.getElementById('payBtn').disabled = true;
  document.getElementById('paymentModal').classList.add('open');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('open');
}

function formatCardNumber(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 16);
  input.value  = digits.match(/.{1,4}/g)?.join(' ') || digits;
}

function formatExpiry(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 4);
  input.value  = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
}

function updateCardPreview() {
  const name   = document.getElementById('cardName')?.value.trim() || '';
  const number = document.getElementById('cardNumber')?.value || '';
  const expiry = document.getElementById('cardExpiry')?.value || '';
  const cvv    = document.getElementById('cardCVV')?.value || '';
  const digits = number.replace(/\D/g, '');

  const padded  = digits.padEnd(16, '•');
  const grouped = padded.match(/.{1,4}/g).join(' ');
  document.getElementById('cardNumPreview').textContent   = grouped;
  document.getElementById('cardNamePreview').textContent  = name.toUpperCase() || 'YOUR NAME';
  document.getElementById('cardExpiryPreview').textContent = expiry || 'MM/YY';

  const brand = digits[0] === '4' ? 'VISA' : digits[0] === '5' ? 'MASTERCARD' : digits.startsWith('34') || digits.startsWith('37') ? 'AMEX' : '';
  document.getElementById('cardBrand').textContent = brand;

  const gradients = {
    VISA: 'linear-gradient(135deg,#1a1a6e,#2d5be3)',
    MASTERCARD: 'linear-gradient(135deg,#8b0000,#c0392b)',
    AMEX: 'linear-gradient(135deg,#006241,#00a878)',
  };
  document.getElementById('cardPreview').style.background = gradients[brand] || 'linear-gradient(135deg,#2d3436,#636e72)';

  const validNumber = digits.length === 16;
  const validExpiry = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const validCVV    = cvv.length >= 3;
  const validName   = name.length > 0;
  document.getElementById('payBtn').disabled = !(validNumber && validExpiry && validCVV && validName);
}

function processPayment() {
  const btn = document.getElementById('payBtn');
  btn.disabled    = true;
  btn.textContent = 'Processing…';

  setTimeout(async () => {
    const pack = state.selectedPack;
    state.credits += pack.credits;
    await dbUpdateCredits(state.userId, state.credits).catch(console.error);
    updateCreditDisplay();
    closePaymentModal();
    showToast(`${pack.credits} credits added to your balance!`, 'success');
    renderCredits(document.getElementById('mainContent'));
  }, 1800);
}

/* ── Bookings View ── */
function renderBookings(container) {
  checkBookingStatuses();
  container.innerHTML = `
    <div class="page-header">
      <h2>My Bookings</h2>
    </div>
    ${state.bookings.length === 0 ? `
      <div class="empty-state">
        <div class="icon"><i data-lucide="calendar" style="width:48px;height:48px;color:var(--primary);opacity:.4;"></i></div>
        <h3>No Bookings Yet</h3>
        <p>Browse deals and book your first experience!</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('browse')">Browse Deals</button>
      </div>
    ` : state.bookings.map(b => {
      const dateStr     = fmtDate(b.date);
      const review      = state.reviews[b.id];
      const isCompleted = b.status === 'completed';
      const isCancelled = b.status === 'cancelled';

      const stars = review
        ? `<div style="color:#f4b942; font-size:1rem; margin-top:4px;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>`
        : '';

      const hoursUntil = (getBookingDateTime(b) - new Date()) / 3600000;
      const refundable = hoursUntil >= 12;
      const action = isCancelled ? '' :
        isCompleted
          ? (review
              ? `<span class="booking-status" style="background:rgba(108,92,231,.1); color:var(--primary);">Reviewed</span>`
              : `<button class="btn btn-sm btn-primary" onclick="openReviewModal('${b.id}')">Review</button>`)
          : `<button class="btn btn-sm btn-outline" style="${refundable ? '' : 'color:var(--danger);border-color:var(--danger);'}"
               title="${refundable ? 'Full credit refund' : 'No refund — within 12-hour window'}"
               onclick="cancelBooking('${b.id}')">
               ${refundable ? 'Cancel' : 'Cancel (no refund)'}
             </button>`;

      return `
        <div class="booking-item" style="flex-wrap:wrap; ${isCancelled ? 'opacity:.6;' : isCompleted ? 'opacity:.85;' : ''}">
          <div class="booking-icon" style="background:${b.vendor.color}15; color:${b.vendor.color};">
            ${vendorIcon(b.vendor, '22px') || b.vendor.icon || '🏢'}
          </div>
          <div class="booking-details" style="flex:1; min-width:0;">
            <h4>${b.service.name}</h4>
            <p>${b.vendor.name} · ${dateStr} at ${b.time}</p>
            ${stars}
          </div>
          <span class="booking-status ${isCompleted ? '' : isCancelled ? '' : 'confirmed'}" style="
            ${isCancelled ? 'background:rgba(225,112,85,.1); color:var(--danger);' :
              isCompleted && !review ? 'background:rgba(0,184,148,.1); color:var(--success);' : ''}">
            ${isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : 'Confirmed'}
          </span>
          ${action ? `<div style="width:100%; padding-left:54px; margin-top:8px;">${action}</div>` : ''}
        </div>
      `;
    }).join('')}
  `;
}

/* ── Review Modal ── */
function openReviewModal(bookingId) {
  const booking = state.bookings.find(b => b.id === bookingId);
  if (!booking) return;
  state.selectedReviewBookingId = bookingId;
  state.selectedReviewRating    = 0;

  document.getElementById('reviewModalBody').innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
      <div style="width:42px; height:42px; border-radius:var(--radius-sm); background:${booking.vendor.color}15; color:${booking.vendor.color}; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
        ${booking.vendor.icon || '🏢'}
      </div>
      <div>
        <div style="font-weight:600; font-size:.9rem;">${booking.service.name}</div>
        <div style="font-size:.8rem; color:var(--text-muted);">${booking.vendor.name} · ${fmtDate(booking.date)} at ${booking.time}</div>
      </div>
    </div>
    <p style="font-size:.85rem; font-weight:600; margin-bottom:10px;">How was your experience?</p>
    <div id="starRow" style="display:flex; gap:8px; margin-bottom:16px;">
      ${[1,2,3,4,5].map(n => `
        <span data-star="${n}" onclick="setReviewRating(${n})"
          style="font-size:2rem; cursor:pointer; color:#dfe6e9; transition:color .15s;">★</span>
      `).join('')}
    </div>
    <label style="font-size:.85rem; font-weight:600; display:block; margin-bottom:6px;">Comments <span style="font-weight:400; color:var(--text-muted);">(optional)</span></label>
    <textarea id="reviewComment" rows="3" placeholder="Tell others about your experience…"
      style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; resize:none; background:var(--surface); color:var(--text);"></textarea>
  `;

  document.getElementById('submitReviewBtn').disabled = true;
  document.getElementById('reviewModal').classList.add('open');
}

function setReviewRating(rating) {
  state.selectedReviewRating = rating;
  document.querySelectorAll('#starRow span').forEach(el => {
    el.style.color = parseInt(el.dataset.star) <= rating ? '#f4b942' : '#dfe6e9';
  });
  document.getElementById('submitReviewBtn').disabled = false;
}

async function submitReview() {
  const id      = state.selectedReviewBookingId;
  const rating  = state.selectedReviewRating;
  const comment = document.getElementById('reviewComment').value.trim();
  if (!id || !rating) return;

  const booking = state.bookings.find(b => b.id === id);
  if (!booking) return;

  const btn = document.getElementById('submitReviewBtn');
  btn.disabled = true;

  try {
    await dbSubmitReview({
      userId:    state.userId,
      vendorId:  booking.vendorId,
      bookingId: id,
      rating,
      comment,
    });

    state.reviews[id] = { rating, comment, bookingId: id };

    // Update vendor reviews map
    const vid = booking.vendorId;
    if (!state.vendorReviewsMap[vid]) state.vendorReviewsMap[vid] = [];
    state.vendorReviewsMap[vid].unshift({
      rating,
      comment,
      service: booking.service.name,
      date:    new Date(booking.date),
    });

    closeReviewModal();
    showToast('Thanks for your review!', 'success');
    if (state.currentView === 'bookings') renderBookings(document.getElementById('mainContent'));
  } catch (err) {
    console.error(err);
    showToast('Could not submit review. Please try again.', 'error');
    btn.disabled = false;
  }
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('open');
}

function cancelBooking(id) {
  const idx = state.bookings.findIndex(b => b.id === id);
  if (idx === -1) return;
  const booking    = state.bookings[idx];
  const hoursUntil = (getBookingDateTime(booking) - new Date()) / 3600000;
  const refundable = hoursUntil >= 12;

  showConfirmDialog({
    title: 'Cancel Booking?',
    message: refundable
      ? `Cancel <strong>${booking.service.name}</strong> at <strong>${booking.vendor.name}</strong>?<br><br>You will receive a full refund of <strong>${booking.service.credits} credits</strong>.`
      : `Cancel <strong>${booking.service.name}</strong> at <strong>${booking.vendor.name}</strong>?<br><br>This booking is within 12 hours — <strong>no credits will be refunded</strong>.`,
    confirmLabel: refundable ? `Cancel & Refund ${booking.service.credits} credits` : 'Cancel (no refund)',
    confirmStyle: 'background:var(--danger);color:#fff;',
    onConfirm: () => _doCancelBooking(id),
  });
}

async function _doCancelBooking(id) {
  const idx = state.bookings.findIndex(b => b.id === id);
  if (idx === -1) return;
  const booking    = state.bookings[idx];
  const hoursUntil = (getBookingDateTime(booking) - new Date()) / 3600000;
  const refundable = hoursUntil >= 12;

  try {
    await dbUpdateBookingStatus(id, 'cancelled');

    if (refundable && booking.service.credits > 0) {
      state.credits += booking.service.credits;
      await dbUpdateCredits(state.userId, state.credits);
      showToast(`Booking cancelled. ${booking.service.credits} credits refunded.`, 'info');
    } else {
      showToast('Booking cancelled. No refund — cancellation was within the 12-hour window.', 'error');
    }

    state.bookings[idx].status = 'cancelled';
    updateCreditDisplay();
    renderBookings(document.getElementById('mainContent'));
  } catch (err) {
    console.error(err);
    showToast('Could not cancel booking. Please try again.', 'error');
  }
}

/* ── Profile View ── */
function renderProfile(container) {
  const name     = state.userName || 'User';
  const email    = state.userEmail || '';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';


  container.innerHTML = `
    <div class="page-header">
      <h2>Profile</h2>
    </div>
    <div class="profile-card">
      <div class="profile-avatar">${initials}</div>
      <div>
        <div style="font-weight:600;">${name}</div>
        <div style="font-size:.8rem; color:var(--text-muted);">${email}</div>
      </div>
    </div>

    <div class="credit-bar" style="cursor:pointer;" onclick="navigateTo('credits')">
      <div>
        <div class="label">Credit Balance</div>
        <div class="balance" id="creditBarCount">${state.credits} Credits</div>
      </div>
      <span style="font-size:1.2rem;">→</span>
    </div>

    <div class="profile-menu-item" onclick="navigateTo('editProfile')">
      <span class="pm-icon"><i data-lucide="user-pen"></i></span>
      <span class="pm-label">Edit Profile</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item" onclick="navigateTo('bookings')">
      <span class="pm-icon"><i data-lucide="calendar"></i></span>
      <span class="pm-label">My Bookings</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item" onclick="navigateTo('credits')">
      <span class="pm-icon"><i data-lucide="credit-card"></i></span>
      <span class="pm-label">Buy Credits</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item" onclick="openNotificationSettings()" style="cursor:pointer;">
      <span class="pm-icon"><i data-lucide="bell"></i></span>
      <span class="pm-label">Notifications</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item" onclick="navigateTo('settings')">
      <span class="pm-icon"><i data-lucide="settings"></i></span>
      <span class="pm-label">Settings</span>
      <span class="pm-arrow">›</span>
    </div>
    <div class="profile-menu-item" onclick="navigateTo('settings')">
      <span class="pm-icon"><i data-lucide="help-circle"></i></span>
      <span class="pm-label">Help &amp; Support</span>
      <span class="pm-arrow">›</span>
    </div>
    <a href="privacy.html" target="_blank" class="profile-menu-item" style="text-decoration:none; color:inherit;">
      <span class="pm-icon"><i data-lucide="shield"></i></span>
      <span class="pm-label">Privacy Policy</span>
      <span class="pm-arrow">›</span>
    </a>
    <a href="terms.html" target="_blank" class="profile-menu-item" style="text-decoration:none; color:inherit;">
      <span class="pm-icon"><i data-lucide="file-text"></i></span>
      <span class="pm-label">Terms &amp; Conditions</span>
      <span class="pm-arrow">›</span>
    </a>

    <div class="profile-menu-item" onclick="signOutUser()" style="margin-top:20px; color:var(--danger); cursor:pointer;">
      <span class="pm-icon"><i data-lucide="log-out" style="color:var(--danger);"></i></span>
      <span class="pm-label" style="color:var(--danger);">Log Out</span>
      <span class="pm-arrow">›</span>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── Edit Profile View ── */
function renderEditProfile(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>
        <a href="#" onclick="navigateTo('profile'); return false;" style="color:var(--text-muted); font-size:.9rem;">← Back</a>
      </h2>
    </div>
    <h2 style="margin-bottom:20px;">Edit Profile</h2>

    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:14px;">Personal Info</div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Full Name</label>
          <input id="editName" type="text" value="${state.userName || ''}" placeholder="Your name"
            style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Phone <span style="font-weight:400; color:var(--text-muted);">(optional)</span></label>
          <input id="editPhone" type="tel" value="${state.userPhone || ''}" placeholder="+962 79 123 4567"
            style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Email</label>
          <input type="email" value="${state.userEmail || ''}" disabled
            style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--bg); color:var(--text-muted); cursor:not-allowed;">
          <p style="font-size:.75rem; color:var(--text-muted); margin-top:4px;">Email cannot be changed.</p>
        </div>
      </div>
      <p id="infoMsg" style="font-size:.82rem; margin-top:12px; display:none;"></p>
      <button class="btn btn-primary btn-full" style="margin-top:14px;" onclick="saveProfileInfo()">Save Changes</button>
    </div>

    <div class="card" style="margin-bottom:14px;">
      <div style="font-weight:600; font-size:.9rem; margin-bottom:14px;">Change Password</div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">New Password</label>
          <input id="newPass" type="password" placeholder="At least 6 characters"
            style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Confirm Password</label>
          <input id="confirmPass" type="password" placeholder="••••••••"
            style="width:100%; padding:10px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-size:.9rem; background:var(--surface); color:var(--text);">
        </div>
      </div>
      <p id="passMsg" style="font-size:.82rem; margin-top:12px; display:none;"></p>
      <button class="btn btn-primary btn-full" style="margin-top:14px;" onclick="saveNewPassword()">Update Password</button>
    </div>
  `;
}

async function saveProfileInfo() {
  const name  = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const msgEl = document.getElementById('infoMsg');
  const btn   = document.querySelector('#infoMsg + button') || document.querySelector('[onclick="saveProfileInfo()"]');

  if (!name) { msgEl.textContent = 'Name cannot be empty.'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }

  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    await _supabase.from('profiles').update({ full_name: name, phone }).eq('id', state.userId);
    state.userName  = name;
    state.userPhone = phone;
    updateUserDisplay();
    msgEl.textContent = 'Profile updated!';
    msgEl.style.color = 'var(--success)';
    msgEl.style.display = 'block';
  } catch (err) {
    msgEl.textContent = 'Failed to save. Please try again.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.display = 'block';
  }
  btn.disabled = false; btn.textContent = 'Save Changes';
}

async function saveNewPassword() {
  const pass    = document.getElementById('newPass').value;
  const confirm = document.getElementById('confirmPass').value;
  const msgEl   = document.getElementById('passMsg');
  const btn     = document.querySelector('[onclick="saveNewPassword()"]');

  if (pass.length < 6) { msgEl.textContent = 'Password must be at least 6 characters.'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }
  if (pass !== confirm) { msgEl.textContent = 'Passwords do not match.'; msgEl.style.color = 'var(--danger)'; msgEl.style.display = 'block'; return; }

  btn.disabled = true; btn.textContent = 'Updating…';

  const { error } = await _supabase.auth.updateUser({ password: pass });
  if (error) {
    msgEl.textContent = error.message;
    msgEl.style.color = 'var(--danger)';
  } else {
    msgEl.textContent = 'Password updated!';
    msgEl.style.color = 'var(--success)';
    document.getElementById('newPass').value    = '';
    document.getElementById('confirmPass').value = '';
  }
  msgEl.style.display = 'block';
  btn.disabled = false; btn.textContent = 'Update Password';
}

/* ── Settings View ── */
const SETTINGS_SECTIONS = [
  {
    id: 'about',
    icon: '<img src="icon.png" alt="" style="height:22px; vertical-align:middle; margin-right:4px;">',
    title: 'About JoPass',
    content: `
      <p style="margin-bottom:10px;">JoPass is a pass-based booking platform that lets you discover and book fitness, wellness, and beauty services at discounted rates across Jordan.</p>
      <p style="margin-bottom:10px;">Buy a credit pack once and use your credits to book sessions at any partnered venue — no subscriptions, no hidden fees.</p>
      <p style="color:var(--text-muted); font-size:.8rem;">Version 1.0.0 · Built with ❤️ in Jordan</p>
    `,
  },
  {
    id: 'support',
    icon: '<i data-lucide="headphones"></i>',
    title: 'Help &amp; Support',
    content: `
      <p style="margin-bottom:12px;">We're here to help. Reach out through any of the channels below:</p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="mailto:jopasscc@gmail.com" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg); border-radius:var(--radius-sm); text-decoration:none; color:var(--text);">
          <span style="font-size:1.2rem;">📧</span>
          <div><div style="font-weight:600; font-size:.88rem;">Email Support</div><div style="font-size:.78rem; color:var(--text-muted);">jopasscc@gmail.com</div></div>
        </a>
        <a href="https://wa.me/96279000000" target="_blank" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg); border-radius:var(--radius-sm); text-decoration:none; color:var(--text);">
          <span style="font-size:1.2rem;">💬</span>
          <div><div style="font-weight:600; font-size:.88rem;">WhatsApp</div><div style="font-size:.78rem; color:var(--text-muted);">+962 79 000 0000</div></div>
        </a>
      </div>
      <p style="font-size:.78rem; color:var(--text-muted); margin-top:12px;">Support hours: Sun–Thu, 9:00 AM – 6:00 PM (GMT+3)</p>
    `,
  },
  {
    id: 'terms',
    icon: '<i data-lucide="file-text"></i>',
    title: 'Terms &amp; Conditions',
    content: `
      <p style="margin-bottom:8px; font-weight:600; font-size:.85rem;">Last updated: April 2026</p>
      <p style="margin-bottom:8px;"><strong>1. Credits</strong> — Credits are non-refundable once purchased. Unused credits do not expire.</p>
      <p style="margin-bottom:8px;"><strong>2. Bookings</strong> — You may cancel up to 12 hours before the session for a full credit refund. Cancellations within 12 hours are non-refundable.</p>
      <p style="margin-bottom:8px;"><strong>3. Venue Changes</strong> — JoPass is not responsible for venue cancellations. Full credits are automatically refunded in such cases.</p>
      <p style="margin-bottom:8px;"><strong>4. Account</strong> — You are responsible for keeping your login credentials secure.</p>
      <p style="margin-bottom:8px;"><strong>5. Conduct</strong> — Users must comply with each venue's rules. JoPass reserves the right to suspend accounts for misconduct.</p>
    `,
  },
  {
    id: 'privacy',
    icon: '<i data-lucide="lock"></i>',
    title: 'Privacy Policy',
    content: `
      <p style="margin-bottom:8px; font-weight:600; font-size:.85rem;">Last updated: April 2026</p>
      <p style="margin-bottom:8px;"><strong>What we collect</strong> — Name, email address, phone number, and booking history.</p>
      <p style="margin-bottom:8px;"><strong>How we use it</strong> — To process bookings, send reminders, and improve the service. We do not sell your data.</p>
      <p style="margin-bottom:8px;"><strong>Data storage</strong> — Your data is stored securely and retained only as long as your account is active.</p>
      <p style="margin-bottom:8px;"><strong>Your rights</strong> — You may request deletion of your account and data by contacting support.</p>
    `,
  },
  {
    id: 'faq',
    icon: '<i data-lucide="help-circle"></i>',
    title: 'FAQ',
    content: `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div><p style="font-weight:600; font-size:.88rem; margin-bottom:4px;">How do credits work?</p><p style="font-size:.83rem; color:var(--text-muted);">1 JOD = 2 credits. Buy a pack and spend credits on any service. The JoPass price is always lower than the walk-in rate.</p></div>
        <div><p style="font-weight:600; font-size:.88rem; margin-bottom:4px;">Do credits expire?</p><p style="font-size:.83rem; color:var(--text-muted);">No. Your credits stay in your account until you use them.</p></div>
        <div><p style="font-weight:600; font-size:.88rem; margin-bottom:4px;">How do I cancel a booking?</p><p style="font-size:.83rem; color:var(--text-muted);">Go to My Bookings and tap Cancel on a confirmed booking. Credits are refunded if cancelled 12+ hours before the session.</p></div>
      </div>
    `,
  },
];

function renderSettings(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>
        <a href="#" onclick="navigateTo('profile'); return false;" style="color:var(--text-muted); font-size:.9rem;">← Back</a>
      </h2>
    </div>
    <h2 style="margin-bottom:20px;">Settings</h2>
    ${SETTINGS_SECTIONS.map(s => `
      <div class="card" style="margin-bottom:10px; padding:0; overflow:hidden;">
        <div onclick="toggleSettingsSection('${s.id}')" style="display:flex; align-items:center; gap:12px; padding:14px 16px; cursor:pointer;">
          <span style="font-size:1.2rem; width:28px; text-align:center;">${s.icon}</span>
          <span style="flex:1; font-weight:500; font-size:.92rem;">${s.title}</span>
          <span id="arrow_${s.id}" style="color:var(--text-muted); font-size:.9rem; transition:transform .2s;">›</span>
        </div>
        <div id="section_${s.id}" style="display:none; padding:0 16px 16px; font-size:.83rem; line-height:1.65; color:var(--text); border-top:1px solid var(--border);">
          <div style="padding-top:14px;">${s.content}</div>
        </div>
      </div>
    `).join('')}
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleSettingsSection(id) {
  const section = document.getElementById(`section_${id}`);
  const arrow   = document.getElementById(`arrow_${id}`);
  const open    = section.style.display !== 'none';
  section.style.display   = open ? 'none'        : 'block';
  arrow.style.transform   = open ? 'rotate(0deg)' : 'rotate(90deg)';
}

/* ── Confirm Dialog ── */
function showConfirmDialog({ title, message, confirmLabel = 'Confirm', confirmStyle = '', onConfirm }) {
  const existing = document.getElementById('confirmDialog');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'confirmDialog';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:var(--radius) var(--radius) 0 0;padding:24px 20px 32px;width:100%;max-width:480px;box-shadow:0 -4px 24px rgba(0,0,0,.12);">
      <div style="font-weight:700;font-size:1rem;margin-bottom:8px;">${title}</div>
      <p style="font-size:.88rem;color:var(--text-muted);margin-bottom:20px;line-height:1.5;">${message}</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button id="confirmDialogYes" style="padding:14px;border:none;border-radius:var(--radius-sm);font-size:.95rem;font-weight:700;cursor:pointer;${confirmStyle || 'background:var(--primary);color:#fff;'}">${confirmLabel}</button>
        <button onclick="document.getElementById('confirmDialog').remove()" style="padding:14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.95rem;font-weight:600;cursor:pointer;background:transparent;color:var(--text);">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('confirmDialogYes').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

async function signOutUser() {
  await _supabase.auth.signOut();
  window.location.href = 'index.html';
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
