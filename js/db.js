/* ── JoPass — Supabase Data Layer ── */

/* ─── Consumer: fetch all init data ─── */
async function dbFetchInitData(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const [
    { data: profile },
    { data: vendors },
    { data: services },
    { data: openings },
    { data: vendorProfiles },
    { data: allReviews },
    { data: bookings },
    { data: userReviews },
  ] = await Promise.all([
    _supabase.from('profiles').select('*').eq('id', userId).single(),
    _supabase.from('vendors').select('*').order('name'),
    _supabase.from('services').select('*').order('vendor_id, id'),
    _supabase.from('openings').select('*').gte('date', today).order('date'),
    _supabase.from('vendor_profiles').select('*'),
    _supabase.from('reviews').select('*, bookings(service_name, date)').order('created_at', { ascending: false }),
    _supabase.from('bookings')
      .select('*, vendors(name,icon,color,category)')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    _supabase.from('reviews').select('*').eq('user_id', userId),
  ]);
  return {
    profile,
    vendors:        vendors        || [],
    services:       services       || [],
    openings:       openings       || [],
    vendorProfiles: vendorProfiles || [],
    allReviews:     allReviews     || [],
    bookings:       bookings       || [],
    userReviews:    userReviews    || [],
  };
}

/* ─── Consumer: refresh bookings ─── */
async function dbFetchUserBookings(userId) {
  const { data } = await _supabase
    .from('bookings')
    .select('*, vendors(name,icon,color,category)')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  return data || [];
}

/* ─── Consumer writes ─── */

async function dbCreateBooking({ userId, vendorId, service, date, time }) {
  const { data, error } = await _supabase.from('bookings').insert({
    user_id:        userId,
    vendor_id:      vendorId,
    service_name:   service.name,
    service_credits: service.credits,
    service_price:  service.jopassPrice,
    original_price: service.price,
    date:           date.toISOString().slice(0, 10),
    time,
    status:         'confirmed',
  }).select().single();
  if (error) throw error;
  return data.id;
}

async function dbUpdateBookingStatus(bookingId, status) {
  const { error } = await _supabase.from('bookings').update({ status }).eq('id', bookingId);
  if (error) throw error;
}

async function dbAppendBookedSlot(openingId, slot) {
  const { error } = await _supabase.rpc('append_booked_slot', {
    opening_id: openingId,
    slot_time:  slot,
  });
  if (error) throw error;
}

async function dbUpdateCredits(userId, newAmount) {
  const { error } = await _supabase.from('profiles').update({ credits: newAmount }).eq('id', userId);
  if (error) throw error;
}

async function dbSubmitReview({ userId, vendorId, bookingId, rating, comment }) {
  const { error } = await _supabase.from('reviews').insert({
    user_id:    userId,
    vendor_id:  vendorId,
    booking_id: bookingId,
    rating,
    comment:    comment || null,
  });
  if (error) throw error;
}

/* ─── Owner: fetch ─── */

async function dbGetOwnerVendor(vendorId) {
  const { data, error } = await _supabase.from('vendors').select('*').eq('id', vendorId).single();
  if (error) throw error;
  return data;
}

async function dbGetOwnerVendorProfile(vendorId) {
  const { data } = await _supabase.from('vendor_profiles').select('*').eq('vendor_id', vendorId).maybeSingle();
  return data || null;
}

async function dbGetOwnerServices(vendorId) {
  const { data, error } = await _supabase.from('services').select('*').eq('vendor_id', vendorId).order('id');
  if (error) throw error;
  return (data || []).map(s => ({
    id: s.id, name: s.name, duration: s.duration,
    price: parseFloat(s.price), jopassPrice: parseFloat(s.jopass_price), credits: s.credits,
  }));
}

async function dbGetOwnerOpenings(vendorId) {
  const { data, error } = await _supabase.from('openings').select('*').eq('vendor_id', vendorId).order('date');
  if (error) throw error;
  return (data || []).map(dbParseOpening);
}

async function dbGetOwnerBookings(vendorId) {
  const { data, error } = await _supabase
    .from('bookings')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('date', { ascending: false });
  if (error) throw error;

  const bookings = data || [];

  // Fetch customer names separately (no direct FK between bookings and profiles)
  const userIds = [...new Set(bookings.map(b => b.user_id))];
  let profileMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await _supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    (profiles || []).forEach(p => { profileMap[p.id] = p; });
  }

  return bookings.map(b => ({
    id:       b.id,
    userId:   b.user_id,
    vendorId: b.vendor_id,
    userName: profileMap[b.user_id]?.full_name || profileMap[b.user_id]?.email || 'Customer',
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

async function dbGetOwnerReviews(vendorId) {
  const { data, error } = await _supabase
    .from('reviews')
    .select('booking_id, rating, comment')
    .eq('vendor_id', vendorId);
  if (error) throw error;
  const map = {};
  (data || []).forEach(r => { map[r.booking_id] = { rating: r.rating, comment: r.comment }; });
  return map;
}

/* ─── Owner: write services ─── */

async function dbAddService({ vendorId, name, duration, price, jopassPrice }) {
  const credits = Math.round(jopassPrice); // 1 credit = 1 JOD
  const { data, error } = await _supabase.from('services').insert({
    vendor_id: vendorId, name,
    duration:    duration || null,
    price,
    jopass_price: jopassPrice,
    credits,
  }).select().single();
  if (error) throw error;
  return {
    id: data.id, name: data.name, duration: data.duration,
    price: parseFloat(data.price), jopassPrice: parseFloat(data.jopass_price), credits: data.credits,
  };
}

async function dbDeleteService(serviceId) {
  const { error } = await _supabase.from('services').delete().eq('id', serviceId);
  if (error) throw error;
}

/* ─── Owner: write openings ─── */

async function dbAddOpening({ vendorId, serviceName, duration, originalPrice, jopassPrice, credits, capacity, date, slots }) {
  const { data, error } = await _supabase.from('openings').insert({
    vendor_id:      vendorId,
    service_name:   serviceName,
    duration:       duration || null,
    original_price: originalPrice,
    jopass_price:   jopassPrice,
    credits,
    capacity,
    date:           date.toISOString().slice(0, 10),
    slots,
    booked_slots:   [],
  }).select().single();
  if (error) throw error;
  return dbParseOpening(data);
}

async function dbDeleteOpening(openingId) {
  const { error } = await _supabase.from('openings').delete().eq('id', openingId);
  if (error) throw error;
}

async function dbCancelBookingsForOpening(vendorId, serviceName, dateStr) {
  const { error } = await _supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('vendor_id', vendorId)
    .eq('service_name', serviceName)
    .eq('date', dateStr)
    .eq('status', 'confirmed');
  if (error) throw error;
}

/* ─── Owner: write vendor / profile ─── */

async function dbUpdateVendor(vendorId, fields) {
  const { error } = await _supabase.from('vendors').update(fields).eq('id', vendorId);
  if (error) throw error;
}

async function dbSaveVendorProfile(vendorId, p) {
  const { error } = await _supabase.from('vendor_profiles').upsert({
    vendor_id:        vendorId,
    logo_url:         p.logoUrl    || null,
    about:            p.about      || null,
    phone:            p.phone      || null,
    website:          p.website    || null,
    instagram:        p.socials?.instagram || null,
    facebook:         p.socials?.facebook  || null,
    whatsapp:         p.socials?.whatsapp  || null,
    twitter:          p.socials?.twitter   || null,
    amenities:        p.amenities  || [],
    photos:           p.photos     || [],
    location_address: p.location?.address || null,
    location_lat:     p.location?.lat     || null,
    location_lng:     p.location?.lng     || null,
    updated_at:       new Date().toISOString(),
  });
  if (error) throw error;
}

/* ─── Storage ─── */

async function dbUploadImage(file, path) {
  const { error } = await _supabase.storage
    .from('jopass-images')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = _supabase.storage.from('jopass-images').getPublicUrl(path);
  return data.publicUrl;
}

/* ─── Shared helper ─── */

function dbParseOpening(o) {
  return {
    id:           o.id,
    vendorId:     o.vendor_id,
    service:      { name: o.service_name, duration: o.duration },
    serviceName:  o.service_name,
    duration:     o.duration,
    originalPrice: parseFloat(o.original_price),
    jopassPrice:  parseFloat(o.jopass_price),
    credits:      o.credits,
    capacity:     o.capacity,
    date:         new Date(o.date + 'T00:00:00'),
    slots:        o.slots        || [],
    booked:       o.booked_slots || [],
  };
}
