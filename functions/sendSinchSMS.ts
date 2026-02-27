import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// DEPRECATED: Sinch is no longer used. All SMS goes through SignalHouse.
// This function proxies to sendSignalhouseSMS for backward compatibility.

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { to, message } = body;

        if (!to || !message) {
            return Response.json({ success: false, error: 'to and message are required' }, { status: 400 });
        }

        console.log('sendSinchSMS (deprecated) - proxying to SignalHouse for:', to);

        // Proxy to SignalHouse
        const result = await base44.asServiceRole.functions.invoke('sendSignalhouseSMS', { to, message });

        return Response.json(result.data || { success: false, error: 'No response from SignalHouse' });

    } catch (error) {
        console.error('sendSinchSMS proxy error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});