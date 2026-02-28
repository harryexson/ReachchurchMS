// Minimal direct test of SignalHouse sendSMS
Deno.serve(async (req) => {
    const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN') || '';
    const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY') || '';
    const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '';

    const from = rawFrom.replace(/\D/g, '');
    const to = ['15748893590'];
    
    const payload = {
        from,
        to,
        body: 'Direct test',
        apiKey,
    };

    console.log('DIRECT TEST - authToken len:', authToken.length, 'apiKey len:', apiKey.length, 'apiKey[0:8]:', apiKey.substring(0,8), 'from:', from);
    console.log('Full payload JSON:', JSON.stringify(payload));

    const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
            'x-api-key': apiKey,
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text);

    return Response.json({ status: response.status, body: text, payload_sent: payload });
});