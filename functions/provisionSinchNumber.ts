import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// DEPRECATED: Sinch number provisioning is no longer used.
// Phone numbers are now managed directly in the SignalHouse dashboard.

Deno.serve(async (req) => {
    return Response.json({
        status: 'deprecated',
        message: 'Sinch number provisioning is no longer used. Manage your phone numbers directly in the SignalHouse dashboard.',
        signalhouse_dashboard: 'https://app.signalhouse.io'
    }, { status: 410 });
});