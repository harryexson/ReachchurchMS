import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Public webhook to receive inbound SMS from SignalHouse per-tenant
// Method: POST
// No authentication
// Extracts { from, to, text, message_id } and stores as inbound message linked to the tenant
// Must respond quickly (<2s) and always 200 to prevent retries

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    const raw = await req.text();
    let payload;
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch (_) {
      console.warn('receiveTenantSMS: invalid JSON body');
      payload = {};
    }

    const from = payload.from ?? payload.sender ?? '';
    const to = payload.to ?? '';
    const text = payload.text ?? payload.body ?? '';
    const messageId = payload.message_id ?? payload.id ?? '';

    if (!to) {
      console.warn('receiveTenantSMS: missing "to" field in payload');
      return Response.json({ ok: true });
    }

    // Find tenant by its SignalHouse phone number
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ signalhouse_phone_number: to });
    if (!tenants || tenants.length === 0) {
      console.warn('receiveTenantSMS: tenant not found for number', to);
      return Response.json({ ok: true });
    }
    const tenant = tenants[0];

    const record = {
      tenant_id: tenant.id,
      direction: 'inbound',
      sender: from || '',
      recipient: to,
      message: text || '',
      signalhouse_message_id: messageId || undefined,
      status: 'received',
      timestamp: new Date().toISOString(),
    };

    // Ensure quick response - do not block on DB if slow
    const createPromise = base44.asServiceRole.entities.SmsMessage.create(record);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 1500));
    const result = await Promise.race([createPromise, timeoutPromise]);
    if (result === 'timeout') {
      console.warn('receiveTenantSMS: DB insert timed out, responding 200');
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('receiveTenantSMS error:', error?.message || error);
    // Still return 200 per requirement (avoid retries)
    return Response.json({ ok: true });
  }
});