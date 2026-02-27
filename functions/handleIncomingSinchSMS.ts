import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// DEPRECATED: Sinch webhook is no longer used.
// All inbound SMS now goes through handleSignalhouseWebhook.
// This endpoint returns a helpful message if called.

Deno.serve(async (req) => {
    console.log('handleIncomingSinchSMS called - Sinch is deprecated, use SignalHouse webhook instead');

    return Response.json({
        status: 'deprecated',
        message: 'Sinch is no longer configured. Please update your webhook URL to use handleSignalhouseWebhook.',
        new_webhook: 'handleSignalhouseWebhook',
        instructions: [
            '1. Go to your SignalHouse dashboard → Settings → Webhooks',
            '2. Set inbound webhook to this app\'s handleSignalhouseWebhook function URL',
            '3. Remove any Sinch webhook configurations'
        ]
    }, { status: 200 });
});