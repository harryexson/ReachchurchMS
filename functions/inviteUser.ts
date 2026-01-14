import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();

        if (!currentUser || currentUser.role !== 'admin') {
            return Response.json({ 
                success: false,
                error: 'Only administrators can invite users' 
            }, { status: 403 });
        }

        const { email, full_name, role = 'user' } = await req.json();

        // Get church name from settings
        let churchName = 'REACH Church Connect';
        try {
            const settings = await base44.asServiceRole.entities.ChurchSettings.list();
            if (settings.length > 0 && settings[0].church_name) {
                churchName = settings[0].church_name;
            }
        } catch (err) {
            console.log('Using default church name');
        }

        // Invite user via Base44's built-in invitation system
        await base44.users.inviteUser(email, role);

        // Send welcome email/SMS with church branding
        const invitationLink = `${Deno.env.get('BASE44_APP_URL') || 'https://your-app-url.base44.app'}`;
        
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to ${churchName}!</h1>
                </div>
                
                <div style="padding: 40px 20px; background: white;">
                    <p style="font-size: 18px; color: #334155; line-height: 1.6;">
                        Hi ${full_name},
                    </p>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        You've been invited by <strong>${currentUser.full_name}</strong> to join <strong>${churchName}</strong> 
                        on our church management platform!
                    </p>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        As a member, you'll have access to:
                    </p>
                    
                    <ul style="font-size: 16px; color: #334155; line-height: 1.8;">
                        <li>📅 Church events and calendar</li>
                        <li>🎤 Sermon library</li>
                        <li>💬 Community groups</li>
                        <li>💝 Online giving</li>
                        <li>👥 Member directory</li>
                        <li>📧 Direct messaging</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${invitationLink}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            Accept Invitation & Sign In
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
                        Note: You're joining under ${churchName}'s subscription, so you won't need to sign up for your own account.
                        Simply click the button above to complete your registration.
                    </p>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        Welcome to the family!<br>
                        <strong>${churchName} Team</strong>
                    </p>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
                    <p style="margin: 0;">
                        If you have questions, contact ${currentUser.full_name} at ${currentUser.email}
                    </p>
                </div>
            </div>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            from_name: churchName,
            subject: `You're invited to join ${churchName}! 🎉`,
            body: emailBody
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