import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── HyperPay config ──────────────────────────────────────────────
// Test server. For go-live: change BASE to https://eu-prod.oppwa.com,
// set HYPERPAY_ENTITY_ID + HYPERPAY_ACCESS_TOKEN to live values,
// and set HYPERPAY_TEST=false in the function secrets.
const BASE      = Deno.env.get('HYPERPAY_BASE')      || 'https://eu-test.oppwa.com';
const ENTITY_ID = Deno.env.get('HYPERPAY_ENTITY_ID') || '8ac7a4d9a18c939b01a19607cd92106e';
const TOKEN     = Deno.env.get('HYPERPAY_ACCESS_TOKEN') || '';
const IS_TEST   = (Deno.env.get('HYPERPAY_TEST') || 'true') !== 'false';

const SUCCESS = /^(000\.000\.|000\.100\.1|000\.[36]|000\.400\.(0[^3]|[1][12]0)|000\.500\.)/;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const URL         = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const noPersist   = { auth: { persistSession: false, autoRefreshToken: false } };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const json = (obj: any, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

  try {
    // DB client stays pure service-role (full access). Never call .auth on it.
    const db = createClient(URL, SERVICE_KEY, noPersist);
    // Separate client just to identify the caller from their JWT.
    const authClient = createClient(URL, SERVICE_KEY, noPersist);

    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
    const user = userData?.user;
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body   = await req.json();
    const action = body.action;

    // ── PREPARE: create a HyperPay checkout for an opening/slot ─────
    if (action === 'prepare') {
      const { openingId, slot } = body;
      if (!openingId || !slot) return json({ error: 'Missing booking details' }, 400);

      const { data: opening, error: oErr } = await db
        .from('openings').select('*').eq('id', openingId).maybeSingle();
      if (oErr)     return json({ error: `DB err: ${oErr.message} | key:${(SERVICE_KEY||'').slice(0,9)} len:${(SERVICE_KEY||'').length}` }, 500);
      if (!opening) return json({ error: 'Deal not found' }, 404);

      const capacity = opening.capacity || 1;
      const booked   = (opening.booked_slots || []).filter((s: string) => s === slot).length;
      if (!(opening.slots || []).includes(slot) || booked >= capacity) {
        return json({ error: 'This time slot is no longer available.' }, 409);
      }

      const price  = parseFloat(opening.jopass_price || '0');
      const amount = price.toFixed(2);
      const mtx    = crypto.randomUUID();

      const params = new URLSearchParams();
      params.set('entityId',      ENTITY_ID);
      params.set('amount',        amount);
      params.set('currency',      'JOD');
      params.set('paymentType',   'DB');
      params.set('merchantTransactionId', mtx);
      params.set('customer.email',     body.email     || (user.email || ''));
      params.set('customer.givenName', body.givenName || 'JoPass');
      params.set('customer.surname',   body.surname   || 'Customer');
      params.set('billing.street1',  body.street1  || 'N/A');
      params.set('billing.city',     body.city     || 'Amman');
      params.set('billing.state',    body.state    || 'Amman');
      params.set('billing.country',  body.country  || 'JO');
      params.set('billing.postcode', body.postcode || '11118');
      if (IS_TEST) {
        params.set('testMode', 'EXTERNAL');
        params.set('customParameters[3DS2_enrolled]', 'true');
      }

      const res  = await fetch(`${BASE}/v1/checkouts`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body:    params.toString(),
      });
      const data = await res.json();
      if (!data.id) return json({ error: data.result?.description || 'Could not start payment', raw: data }, 502);

      await db.from('payment_intents').insert({
        checkout_id: data.id, merchant_tx: mtx, user_id: user.id,
        opening_id: openingId, slot, vendor_id: opening.vendor_id, amount, status: 'created',
      });

      return json({ checkoutId: data.id, amount });
    }

    // ── STATUS: verify a payment, then create the booking ──────────
    if (action === 'status') {
      const resourcePath = body.resourcePath as string;
      if (!resourcePath) return json({ error: 'Missing resourcePath' }, 400);
      const checkoutId = (resourcePath.match(/checkouts\/([^/]+)\/payment/) || [])[1];
      if (!checkoutId) return json({ error: 'Bad resourcePath' }, 400);

      const res  = await fetch(`${BASE}${resourcePath}?entityId=${ENTITY_ID}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await res.json();
      const code = data.result?.code || '';
      const paid = SUCCESS.test(code);

      const { data: intent } = await db
        .from('payment_intents').select('*').eq('checkout_id', checkoutId).single();
      if (!intent || intent.user_id !== user.id) return json({ error: 'Payment not found' }, 404);

      if (!paid) return json({ ok: false, code, description: data.result?.description || 'Payment not completed' });
      if (intent.status === 'done' && intent.booking_id) return json({ ok: true, bookingId: intent.booking_id });

      const { data: opening } = await db
        .from('openings').select('*').eq('id', intent.opening_id).single();
      if (!opening) return json({ error: 'Deal not found' }, 404);

      const bookingDate = opening.date
        || new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

      const { data: booking, error: insErr } = await db.from('bookings').insert({
        user_id: intent.user_id, vendor_id: intent.vendor_id,
        service_name: opening.service_name, service_credits: opening.credits,
        service_price: opening.jopass_price, original_price: opening.original_price,
        date: bookingDate, time: intent.slot, status: 'confirmed', payment_ref: intent.merchant_tx,
      }).select('id').single();
      if (insErr) return json({ error: insErr.message }, 500);

      await db.rpc('append_booked_slot', { opening_id: intent.opening_id, slot_time: intent.slot });
      await db.from('payment_intents')
        .update({ status: 'done', booking_id: booking.id }).eq('checkout_id', checkoutId);

      return json({ ok: true, bookingId: booking.id, vendorId: intent.vendor_id, serviceName: opening.service_name });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
