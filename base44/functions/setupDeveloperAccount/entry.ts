import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get current user
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({
                error: 'Not authenticated'
            }, { status: 401 });
        }
        
        // Only allow harryexson@hotmail.com and david@base44.app to use this function
        if (user.email !== 'harryexson@hotmail.com' && user.email !== 'david@base44.app') {
            return Response.json({
                error: 'Unauthorized - This function is only for developer accounts'
            }, { status: 403 });
        }
        
        console.log('🔧 Setting up developer account for:', user.email);
        
        // Update user to have admin role and developer access
        await base44.asServiceRole.entities.User.update(user.id, {
            role: 'admin',
            developer_access: true
        });
        
        console.log('✅ Developer account setup complete');
        
        return Response.json({
            success: true,
            message: 'Developer account configured successfully',
            user: {
                email: user.email,
                role: 'admin',
                developer_access: true
            }
        });
        
    } catch (error) {
        console.error('Error setting up developer account:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});