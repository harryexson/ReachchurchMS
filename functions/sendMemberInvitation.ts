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

        // Get church settings for branding
        const churchSettings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchName = churchSettings.length > 0 ? churchSettings[0].church_name : 'Your Church';

        // Send invitation email with direct signup link
        const signupUrl = `${Deno.env.get('BASE44_APP_URL') || 'https://your-app-url'}/signup?email=${encodeURIComponent(memberEmail)}&type=member`;
        
        await base44.integrations.Core.SendEmail({
            to: memberEmail,
            from_name: churchName,
            subject: `Join ${churchName} on REACH Church Connect`,
            body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Welcome to ${churchName}!</h2>
                    
                    <p>You've been invited to join ${churchName} on REACH Church Connect - our church management platform.</p>
                    
                    <p>Click the button below to create your account and get started:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${signupUrl}" 
                           style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            Join ${churchName}
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px;">
                        Your email: <strong>${memberEmail}</strong><br>
                        You'll create your password during account setup.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="color: #64748b; font-size: 12px;">
                        If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                </div>
            `
        });

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