import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { event, data } = payload;

        if (!data || !data.email) {
            return Response.json({ 
                error: 'Member email is required' 
            }, { status: 400 });
        }

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

        // Get church settings for branding - CRITICAL: filter by church admin
        const churchAdminEmail = data.church_admin_email;
        const churchSettings = await base44.asServiceRole.entities.ChurchSettings.filter({
            church_admin_email: churchAdminEmail
        });
        const churchName = churchSettings.length > 0 ? churchSettings[0].church_name : 'Your Church';

        // Generate unique invitation token
        const invitationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create invitation record
        await base44.asServiceRole.entities.MemberInvitation.create({
            member_id: data.id,
            email: memberEmail,
            invitation_token: invitationToken,
            status: 'pending',
            expires_at: expiresAt.toISOString()
        });

        // Build signup URL with token
        const signupUrl = `${Deno.env.get('BASE44_APP_URL')}/MemberSignup?token=${invitationToken}`;
        
        // Use the inviteUser function which properly handles external emails
        await base44.asServiceRole.users.inviteUser(memberEmail, 'user');

        console.log(`✅ Member invitation sent to ${memberEmail}`);

        return Response.json({
            success: true,
            message: `Invitation sent to ${memberName} (${memberEmail})`,
            member_id: data.id,
            signup_url: signupUrl
        });

    } catch (error) {
        console.error('Error sending member invitation:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to send member invitation'
        }, { status: 500 });
    }
});