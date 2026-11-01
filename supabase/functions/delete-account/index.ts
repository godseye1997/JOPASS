import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// Permanently deletes the calling user's account and all their data.
// Required by the Apple App Store and Google Play for apps with accounts.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const json = (obj: any, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

  try {
    const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };
    // DB client stays pure service-role; never call .auth on it.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      noPersist,
    );
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      noPersist,
    );

    // Identify the caller from their JWT — users can only delete themselves.
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
    const user = userData?.user;
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const uid   = user.id;
    const email = (user.email || '').toLowerCase();

    const { data: profile } = await supabase
      .from('profiles').select('role, vendor_id').eq('id', uid).single();

    // If the caller is a vendor owner, remove their venue and everything tied to it.
    if (profile?.role === 'owner' && profile.vendor_id) {
      const vid = profile.vendor_id;
      const { data: vb } = await supabase.from('bookings').select('id').eq('vendor_id', vid);
      const bIds = (vb || []).map((r: any) => r.id);
      if (bIds.length) await supabase.from('reviews').delete().in('booking_id', bIds);
      await supabase.from('bookings').delete().eq('vendor_id', vid);
      await supabase.from('follows').delete().eq('vendor_id', vid);
      await supabase.from('openings').delete().eq('vendor_id', vid);
      await supabase.from('services').delete().eq('vendor_id', vid);
      await supabase.from('vendor_profiles').delete().eq('vendor_id', vid);
      await supabase.from('vendors').delete().eq('id', vid);
      // Free the allowlist slot so the email could register again later.
      if (email) await supabase.from('approved_owners').update({ claimed: false }).eq('email', email);
    }

    // Personal data held against the user id (applies to customers and owners).
    await supabase.from('reviews').delete().eq('user_id', uid);
    await supabase.from('bookings').delete().eq('user_id', uid);
    await supabase.from('device_tokens').delete().eq('user_id', uid);
    await supabase.from('follows').delete().eq('user_id', uid);
    await supabase.from('profiles').delete().eq('id', uid);

    // Finally remove the auth account itself.
    const { error: delErr } = await supabase.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
