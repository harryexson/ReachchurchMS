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
        // Try to find by email first, then by ID
        let users;
        
        // Check if orgId looks like an email
        if (orgId.includes('@')) {
            users = await base44.asServiceRole.entities.User.filter({ email: orgId });
        } else {
            users = await base44.asServiceRole.entities.User.filter({ id: orgId });
        }
        
        if (users.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Organization not found' 
            }, { status: 404 });
        }

        // Also fetch church settings for branding
        const churchSettings = await base44.asServiceRole.entities.ChurchSettings.filter({
            created_by: users[0].email
        });

        return Response.json({ 
            success: true,
            organization: users[0],
            settings: churchSettings.length > 0 ? churchSettings[0] : null
        });

    } catch (error) {
        console.error('Error loading organization:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});