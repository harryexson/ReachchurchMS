import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        // Get the member data from the automation payload
        const { event, data } = payload;

        if (!data || !data.email) {
            return Response.json({ 
                error: 'Member email is required' 
            }, { status: 400 });
        }

        // Only send invitation for new members who don't have a user account yet
        if (event.type !== 'create') {
            return Response.json({ 
                message: 'Invitation only sent for new members',
                skipped: true 
            });
        }

        const memberEmail = data.email;
        const memberName = `${data.first_name || ''} ${data.last_name || ''}`.trim();

        // Check if user already exists
        try {
            const existingUsers = await base44.asServiceRole.entities.User.filter({ 
                email: memberEmail 
            });

            if (existingUsers.length > 0) {
                console.log(`User already exists for ${memberEmail}, skipping invitation`);
                return Response.json({ 
                    message: 'User already exists',
                    skipped: true 
                });
            }
        } catch (error) {
            console.warn('Could not check existing user:', error.message);
        }

        // Get admin user to send invitation
        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return Response.json({ 
                error: 'User not authenticated' 
            }, { status: 401 });
        }

        // Send invitation using Base44's invite function
        await base44.asServiceRole.functions.invoke('inviteUser', {
            email: memberEmail,
            role: 'user'
        });

        console.log(`✅ Member invitation sent to ${memberEmail}`);

        return Response.json({
            success: true,
            message: `Invitation sent to ${memberName} (${memberEmail})`,
            member_id: data.id
        });

    } catch (error) {
        console.error('Error sending member invitation:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to send member invitation'
        }, { status: 500 });
    }
});