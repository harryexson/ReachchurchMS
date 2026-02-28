// Test SignalHouse API - probe correct field names
Deno.serve(async (req) => {
    const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN') || '';
    const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY') || '';
    const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '';
    const from = rawFrom.replace(/\D/g, '');
    const to = from; // send to self for testing

    const results = [];

    // Try different field name casings
    const attempts = [
        { label: 'apiKey', payload: { from, to: [to], body: 'test', apiKey } },
        { label: 'api_key', payload: { from, to: [to], body: 'test', api_key: apiKey } },
        { label: 'key', payload: { from, to: [to], body: 'test', key: apiKey } },
        { label: 'token', payload: { from, to: [to], body: 'test', token: authToken } },
        { label: 'apiKey+authToken', payload: { from, to: [to], body: 'test', apiKey, authToken } },
        // Try with 'text' instead of 'body'
        { label: 'text_field', payload: { from, to: [to], text: 'test', apiKey } },
        // Try string 'to' instead of array
        { label: 'to_as_string', payload: { from, to, body: 'test', apiKey } },
    ];

    for (const attempt of attempts) {
        const r = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(attempt.payload)
        });
        const body = await r.text();
        results.push({ test: attempt.label, status: r.status, body: body.substring(0, 200) });
        if (r.status !== 400) break; // stop on first non-400
    }

    return Response.json({ results });
});