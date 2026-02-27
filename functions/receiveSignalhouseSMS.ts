import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Public webhook: Receive inbound SMS from SignalHouse
// Method: POST
// Respond within 2 seconds, no authentication required

Deno.serve(async (req) => {
  const start = Date.now();
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Read raw body and log it completely
    const raw = await req.text();
    console.log('=== SignalHouse Inbound SMS (raw) ===');
    console.log(raw || '(empty body)');

    // Parse JSON safely
    let payload = {};
    if (raw && raw.trim() !== '') {
      try {
        payload = JSON.parse(raw);
      } catch (_err) {
        // Malformed JSON: still return 200 per requirement
        console.warn('Invalid JSON received from SignalHouse webhook');
      }
    }

    // Extract fields with fallbacks
    const from = payload.from || payload.sender || payload.data?.from || '';
    const toField = payload.to || payload.recipient || payload.data?.to || '';
    const text = payload.text || payload.body || payload.message || payload.data?.text || payload.data?.body || '';

    // Normalize recipients to an array
    const recipients = Array.isArray(toField) ? toField : (toField ? [toField] : []);

    // Prepare inserts (one record per recipient)
    const inserts = recipients.map((rcpt) => (
      base44.asServiceRole.entities['sms_messages'].create({
        sender: String(from || ''),
        recipient: String(rcpt || ''),
        message: String(text || ''),
        timestamp: new Date().toISOString()
      })
    ));

    // Race inserts with a timeout to ensure < 2s response
    const timeoutMs = 1500; // leave headroom for response
    const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    if (inserts.length > 0) {
      await Promise.race([Promise.allSettled(inserts), timeout]);
    }

    const duration = Date.now() - start;
    return Response.json({ success: true, processed: recipients.length, duration_ms: duration });
  } catch (error) {
    console.error('receiveSignalhouseSMS error:', error?.message || error);
    // Still return 200 immediately per requirements
    return Response.json({ success: true, note: 'logged but not stored due to error' });
  }
});