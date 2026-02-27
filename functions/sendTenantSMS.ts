import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Secure endpoint to send an SMS on behalf of a tenant via SignalHouse
// Method: POST
// Body: { tenantId: string, to: string, message: string }
// Returns the downstream SignalHouse response body/status (without exposing tokens)

function isE164(phone) {
  return typeof phone === 'string' && /^\+[1-9]\d{7,14}$/.test(phone);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Require authentication (secure)
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, to, message } = await req.json();

    if (!tenantId || !to || !message) {
      return Response.json({ error: 'tenantId, to, and message are required' }, { status: 400 });
    }

    // Ensure tenantId is not spoofed by cross-checking any user-allowed list if present in profile
    // If your app later adds per-user tenant assignments, validate here (e.g., user.tenant_ids includes tenantId)

    // Validate E.164 phone for recipient
    if (!isE164(to)) {
      return Response.json({ error: 'Recipient phone (to) must be in E.164 format, e.g., +15551234567' }, { status: 400 });
    }

    // Fetch tenant by id with service role and validate ownership
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenantId });
    if (!tenants || tenants.length === 0) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const tenant = tenants[0];

    // Enforce tenant ownership (prevent spoofing)
    if (tenant.created_by !== user.email) {
      console.error('sendTenantSMS forbidden: user does not own tenant', { user: user.email, tenantId });
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const from = tenant.signalhouse_phone_number;
    if (!from || !isE164(from)) {
      return Response.json({ error: 'Tenant SignalHouse phone number is missing or not in E.164 format' }, { status: 400 });
    }

    // Prefer per-tenant token; fall back to shared token if provided in env
    const bearerToken = tenant.signalhouse_api_token || Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
    if (!bearerToken) {
      return Response.json({ error: 'SignalHouse API token not configured for tenant or environment' }, { status: 500 });
    }

    const payload = {
      from,
      to,
      text: message,
    };

    const shUrl = 'https://app.signalhouse.io/api/v1/messages';

    const resp = await fetch(shUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const respText = await resp.text();

    // Log full response if non-200
    if (!resp.ok) {
      console.error('SignalHouse non-200 response:', resp.status, respText);
    }

    // Try to return JSON if possible, otherwise raw text
    let bodyOut;
    try {
      bodyOut = JSON.parse(respText);
    } catch (_) {
      bodyOut = { raw: respText };
    }

    // Do not include any tokens in response
    return new Response(JSON.stringify(bodyOut), {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('sendTenantSMS error:', error?.message || error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});