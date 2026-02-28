// Test different payload/auth combinations for SignalHouse
Deno.serve(async (req) => {
    const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN') || '';
    const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY') || '';
    const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '';
    const from = rawFrom.replace(/\D/g, '');

    // Attempt 1: apiKey in body + Authorization header
    const payload1 = { from, to: [from], body: 'Test 1', apiKey };
    
    // Attempt 2: apiKey as query param, no body apiKey
    const payload2 = { from, to: [from], body: 'Test 2' };

    // Attempt 3: apiKey in Authorization header only (no body)
    const payload3 = { from, to: [from], body: 'Test 3' };

    const results = [];

    // Test 1: apiKey in body + Bearer token in Authorization
    const r1 = await fetch('https://api.signalhouse.io/message/sendSMS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`, 'x-api-key': apiKey },
        body: JSON.stringify(payload1)
    });
    results.push({ test: 'body_apiKey+bearer+x-api-key', status: r1.status, body: await r1.text() });

    // Test 2: apiKey as Authorization: ApiKey header (no body apiKey)
    const r2 = await fetch('https://api.signalhouse.io/message/sendSMS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `ApiKey ${apiKey}` },
        body: JSON.stringify(payload2)
    });
    results.push({ test: 'auth_ApiKey_header_only', status: r2.status, body: await r2.text() });

    // Test 3: apiKey in body, no Authorization header
    const r3 = await fetch('https://api.signalhouse.io/message/sendSMS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1)
    });
    results.push({ test: 'body_apiKey_no_auth_header', status: r3.status, body: await r3.text() });

    // Test 4: only Bearer token (no body apiKey, no x-api-key)
    const r4 = await fetch('https://api.signalhouse.io/message/sendSMS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payload2)
    });
    results.push({ test: 'bearer_only_no_body_apiKey', status: r4.status, body: await r4.text() });

    return Response.json({ results });
});