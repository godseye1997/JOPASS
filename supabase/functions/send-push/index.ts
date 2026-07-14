import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROJECT_ID   = Deno.env.get('FIREBASE_PROJECT_ID')!;
const CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;
const PRIVATE_KEY  = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function b64url(data: ArrayBuffer | string): string {
  const base64 = typeof data === 'string'
    ? btoa(data)
    : btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss:   CLIENT_EMAIL,
    sub:   CLIENT_EMAIL,
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }));

  const input   = `${header}.${payload}`;
  const pemBody = PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8', keyData.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  const jwt = `${input}.${b64url(sig)}`;

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  const { access_token } = await res.json();
  return access_token;
}

async function fcmSend(token: string, title: string, body: string, accessToken: string) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: { priority: 'high', notification: { sound: 'default', channel_id: 'jopass-reminders' } },
          apns:    { payload: { aps: { sound: 'default' } } },
        },
      }),
    },
  );
  return res.ok;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const { type, vendorId, ownerId, customerId, vendorName, serviceName, price, date, time } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolve the vendor's owner user_id from vendorId (robust; don't trust client)
    async function ownerUserId(vId: any): Promise<string[]> {
      if (!vId) return [];
      const { data } = await supabase.from('profiles').select('id').eq('vendor_id', vId).eq('role', 'owner');
      return (data || []).map((r: any) => r.id);
    }

    let userIds: string[] = [];
    let title = '', body = '';

    if (type === 'new_deal') {
      const { data } = await supabase.from('follows').select('user_id').eq('vendor_id', vendorId);
      userIds = (data || []).map((r: any) => r.user_id);
      title = '🎯 New Deal Available!';
      body  = `${serviceName}${price ? ' — ' + price + ' JOD' : ''}`;
    } else if (type === 'new_booking') {
      userIds = ownerId ? [ownerId] : await ownerUserId(vendorId);
      title = '🔔 New Booking Received!';
      body  = `${serviceName} on ${date} at ${time}`;
    } else if (type === 'booking_confirmed') {
      userIds = [customerId];
      title = '✅ Booking Confirmed!';
      body  = `${vendorName ? vendorName + ' confirmed your booking' : 'Your booking is confirmed'}: ${serviceName} on ${date} at ${time}`;
    } else if (type === 'booking_cancelled_by_customer') {
      // Notify the vendor owner
      userIds = await ownerUserId(vendorId);
      title = '❌ Booking Cancelled';
      body  = `A customer cancelled ${serviceName} on ${date}${time ? ' at ' + time : ''}`;
    } else if (type === 'booking_cancelled_by_venue') {
      // Notify all customers who had a booking for this vendor/service/date
      let q = supabase.from('bookings').select('user_id')
        .eq('vendor_id', vendorId).eq('status', 'cancelled').eq('cancelled_by', 'venue');
      if (serviceName) q = q.eq('service_name', serviceName);
      if (date) q = q.eq('date', date);
      const { data } = await q;
      userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      title = '❌ Booking Cancelled';
      body  = `${vendorName || 'The venue'} cancelled your booking: ${serviceName} on ${date}`;
    }

    if (userIds.length === 0) return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

    const { data: tokenRows } = await supabase
      .from('device_tokens').select('token').in('user_id', userIds);
    const tokens = (tokenRows || []).map((r: any) => r.token);

    if (tokens.length === 0) return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

    const accessToken = await getAccessToken();
    await Promise.allSettled(tokens.map(t => fcmSend(t, title, body, accessToken)));

    return new Response(JSON.stringify({ ok: true, sent: tokens.length }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
