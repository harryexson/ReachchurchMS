import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();

        if (!currentUser || (currentUser.access_level !== 'admin' && !currentUser.is_organization_admin)) {
            return Response.json({ 
                success: false,
                error: 'Only administrators can invite users' 
            }, { status: 403 });
        }

        const { email, full_name, access_level, permissions, church_id } = await req.json();

        // Check if user already exists
        const existingUsers = await base44.asServiceRole.entities.User.filter({ email });
        
        if (existingUsers.length > 0) {
            return Response.json({ 
                success: false,
                error: 'User with this email already exists' 
            }, { status: 400 });
        }

        // Create invitation record (or send via email platform)
        const invitationLink = `https://app.base44.com/accept-invitation?token=${btoa(email)}`;

        // Send invitation email
        await base44.integrations.Core.SendEmail({
            to: email,
            from_name: currentUser.church_name || 'Church Admin',
            subject: `You've been invited to join ${currentUser.church_name}`,
            body: `Hi ${full_name},

You've been invited to join ${currentUser.church_name} on ChurchConnect!

Your role: ${access_level}

Click here to accept your invitation and set up your account:
${invitationLink}

Welcome to the team!

${currentUser.full_name}
${currentUser.church_name}`
        });

        // Create pending user record
        await base44.asServiceRole.entities.User.create({
            email,
            full_name,
            access_level,
            permissions,
            church_id,
            invited_by: currentUser.email,
            invitation_date: new Date().toISOString(),
            invitation_accepted: false
        });

        return Response.json({ 
            success: true,
            message: 'Invitation sent successfully'
        });

    } catch (error) {
        console.error('Invitation error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});