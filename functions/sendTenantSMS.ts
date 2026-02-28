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

    // Normalize recipients to array and validate E.164 (+...) format
    let recipients;
    if (Array.isArray(to)) {
      if (to.length === 0) {
        return Response.json({ error: 'Recipient list (to) must not be empty' }, { status: 400 });
      }
      const invalid = to.find((p) => !isE164(p));
      if (invalid) {
        return Response.json({ error: `Invalid recipient phone '${invalid}'. Must be E.164 format, e.g., +15551234567` }, { status: 400 });
      }
      recipients = to; // keep unchanged if already array
    } else {
      if (!isE164(to)) {
        return Response.json({ error: 'Recipient phone (to) must be in E.164 format, e.g., +15551234567' }, { status: 400 });
      }
      recipients = [to]; // wrap single value in array
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

    // Use SignalHouse API token from environment
    const apiToken = Deno.env.get('SIGNALHOUSE_API_TOKEN');
    console.log('sendTenantSMS token present:', !!apiToken);
    if (!apiToken) {
      return Response.json({ error: 'SignalHouse API token is not configured in environment variables' }, { status: 500 });
    }

    const payload = {
      from,
      to: recipients,
      text: message,
    };

    console.log("SignalHouse Payload:", {
      from: tenant.signalhouse_phone_number,
      to: recipients,
      text: message
    });

    const shUrl = 'https://app.signalhouse.io/api/v1/messages';

    const resp = await fetch(shUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    const respText = await resp.text();

    if (!resp.ok) {
      console.error('SignalHouse non-200 response:', resp.status, respText);
      let errorBody;
      try { errorBody = JSON.parse(respText); } catch { errorBody = respText; }
      return Response.json({ status: resp.status, signalhouse_error: errorBody }, { status: resp.status });
    }

    // Successful response: return parsed JSON if possible, else raw text
    let successBody;
    try { successBody = JSON.parse(respText); } catch { successBody = { raw: respText }; }
    return Response.json(successBody, { status: resp.status });
  } catch (error) {
    console.error('sendTenantSMS error:', error?.message || error);

    // Enhanced diagnostics without exposing tokens
    const anyErr = error;
    const hasResponse = anyErr && typeof anyErr === 'object' && 'response' in anyErr && anyErr.response;

    if (hasResponse) {
      const status = anyErr.response?.status ?? 500;
      const data = anyErr.response?.data ?? null;
      return Response.json(
        { success: false, http_status: status, signalhouse_error: data },
        { status }
      );
    }

    return Response.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
});