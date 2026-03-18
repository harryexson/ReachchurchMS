import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email } = await req.json();

        if (!email) {
            return Response.json({ 
                error: 'Email is required',
            }, { status: 400 });
        }

        console.log(`Setting admin role for user: ${email}`);

        // Use service role to update the user to admin
        // Note: We look up the user by email and update their role
        const users = await base44.asServiceRole.entities.User.filter({
            email: email
        });

        if (users.length === 0) {
            console.log(`User not found: ${email}`);
            return Response.json({ 
                error: 'User not found',
            }, { status: 404 });
        }

        const user = users[0];
        console.log(`Found user: ${user.id} with role: ${user.role}`);

        // Only update if not already admin
        if (user.role !== 'admin') {
            await base44.asServiceRole.entities.User.update(user.id, {
                role: 'admin'
            });
            console.log(`✅ User role updated to admin: ${email}`);
        } else {
            console.log(`User already has admin role: ${email}`);
        }

        return Response.json({ 
            success: true,
            message: 'User role set to admin',
            email: email
        });

    } catch (error) {
        console.error('Error setting admin role:', error);
        return Response.json({ 
            error: 'Failed to set admin role',
            details: error.message
        }, { status: 500 });
    }
});