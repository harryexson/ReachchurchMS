import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Generic SMS sender - uses SignalHouse exclusively
// Supports single recipient or group broadcasts

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { to, message, group } = body;

        let recipients = [];

        if (to) {
            recipients = [to];
        } else if (group) {
            const subscribers = await base44.entities.TextSubscriber.filter({ status: 'active' });
            recipients = subscribers
                .filter(sub => sub.groups && sub.groups.includes(group))
                .map(sub => sub.phone_number);
        }

        if (recipients.length === 0) {
            return Response.json({ error: 'No recipients found' }, { status: 400 });
        }

        const results = [];

        for (const recipient of recipients) {
            try {
                const result = await base44.asServiceRole.functions.invoke('sendSignalhouseSMS', {
                    to: recipient,
                    message
                });

                const success = result.data?.success === true;
                results.push({
                    recipient,
                    status: success ? 'sent' : 'failed',
                    message_id: result.data?.message_id,
                    error: success ? null : result.data?.error
                });
            } catch (error) {
                console.error(`Failed to send to ${recipient}:`, error);
                results.push({ recipient, status: 'failed', error: error.message });
            }
        }

        return Response.json({
            success: true,
            total_sent: results.filter(r => r.status === 'sent').length,
            total_failed: results.filter(r => r.status === 'failed').length,
            results
        });

    } catch (error) {
        console.error('sendSMS error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});