import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { church_id, country_code = 'US' } = body;

        // Sinch credentials
        const projectId = Deno.env.get('SINCH_PROJECT_ID');
        const keyId = Deno.env.get('SINCH_KEY_ID');
        const keySecret = Deno.env.get('SINCH_KEY_SECRET');

        if (!projectId || !keyId || !keySecret) {
            return Response.json({ 
                error: 'Sinch credentials not configured' 
            }, { status: 500 });
        }

        // Step 1: Search for available numbers
        const searchUrl = `https://numbers.api.sinch.com/v1/projects/${projectId}/availableNumbers`;
        
        const searchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`,
                'Content-Type': 'application/json'
            }
        });

        if (!searchResponse.ok) {
            throw new Error(`Sinch search failed: ${await searchResponse.text()}`);
        }

        const availableNumbers = await searchResponse.json();
        
        if (!availableNumbers.availableNumbers || availableNumbers.availableNumbers.length === 0) {
            return Response.json({ 
                error: 'No phone numbers available in this region' 
            }, { status: 404 });
        }

        const selectedNumber = availableNumbers.availableNumbers[0];

        // Step 2: Rent the number
        const rentUrl = `https://numbers.api.sinch.com/v1/projects/${projectId}/availableNumbers/${selectedNumber.phoneNumber}:rent`;
        
        const rentResponse = await fetch(rentUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                smsConfiguration: {
                    servicePlanId: Deno.env.get('SINCH_SERVICE_PLAN_ID')
                }
            })
        });

        if (!rentResponse.ok) {
            throw new Error(`Failed to rent number: ${await rentResponse.text()}`);
        }

        const rentedNumber = await rentResponse.json();

        // Step 3: Save to church settings
        const settings = await base44.asServiceRole.entities.ChurchSettings.filter({ church_id });
        
        if (settings.length > 0) {
            await base44.asServiceRole.entities.ChurchSettings.update(settings[0].id, {
                sinch_phone_number: rentedNumber.phoneNumber,
                sinch_configured: true,
                dedicated_number: true
            });
        }

        return Response.json({ 
            success: true,
            phone_number: rentedNumber.phoneNumber,
            message: 'Phone number provisioned successfully'
        });

    } catch (error) {
        console.error('Provisioning error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});