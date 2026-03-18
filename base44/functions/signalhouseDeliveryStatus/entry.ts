import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Public webhook for SignalHouse delivery status updates
// Method: POST
// No authentication
// Body example: { "message_id": "abc123", "status": "delivered" }

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    const raw = await req.text();
    let payload: any = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch (_) {
      console.warn('signalhouseDeliveryStatus: invalid JSON body');
      payload = {};
    }

    const messageId = payload.message_id ?? payload.id ?? payload.data?.message_id ?? '';
    const status = payload.status ?? payload.delivery_status ?? '';

    if (!messageId || !status) {
      console.warn('signalhouseDeliveryStatus: missing message_id or status');
      return Response.json({ ok: true });
    }

    // Find matching SmsMessage records and update status
    const matches = await base44.asServiceRole.entities.SmsMessage.filter({ signalhouse_message_id: messageId });

    if (matches?.length) {
      const updates = matches.map((m: any) =>
        base44.asServiceRole.entities.SmsMessage.update(m.id, { status })
      );

      // Ensure quick response - don't block beyond ~1.5s
      const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
      await Promise.race([Promise.allSettled(updates), timeout]);
    } else {
      // Not an error for webhook; just log and return 200
      console.warn('signalhouseDeliveryStatus: no message found for id', messageId);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('signalhouseDeliveryStatus error:', (error as any)?.message || error);
    // Still return 200 to avoid retries
    return Response.json({ ok: true });
  }
});