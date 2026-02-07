import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { orgId } = await req.json();

        if (!orgId) {
            return Response.json({ 
                success: false,
                error: 'Organization ID is required' 
            }, { status: 400 });
        }

        // Use service role to fetch user info (no auth required for public page)
        // Support both user ID and email as org identifier
        const users = await base44.asServiceRole.entities.User.filter({
            $or: [
                { id: orgId },
                { email: orgId }
            ]
        });
        
        if (users.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Organization not found' 
            }, { status: 404 });
        }

        return Response.json({ 
            success: true,
            organization: users[0]
        });

    } catch (error) {
        console.error('Error loading organization:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});