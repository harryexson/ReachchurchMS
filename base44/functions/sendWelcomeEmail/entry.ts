import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        // Authenticate request
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, name, userType } = await req.json();

        if (!email || !name) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get church settings for branding
        let churchName = 'REACH Church Connect';
        try {
            const settings = await base44.asServiceRole.entities.ChurchSettings.list();
            if (settings.length > 0 && settings[0].church_name) {
                churchName = settings[0].church_name;
            }
        } catch (err) {
            console.log('Using default church name');
        }

        // Send welcome email
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to ${churchName}!</h1>
                </div>
                
                <div style="padding: 40px 20px; background: white;">
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        Dear ${name},
                    </p>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        We're thrilled to welcome you to our church family! Thank you for completing your onboarding. 
                        ${userType === 'member' ? 'As a member,' : 'As a visitor,'} you now have access to:
                    </p>
                    
                    <ul style="font-size: 16px; color: #334155; line-height: 1.8;">
                        <li>📅 Church events and calendar</li>
                        <li>🎤 Sermon library and resources</li>
                        <li>💬 Community groups and discussions</li>
                        <li>🙏 Prayer requests</li>
                        <li>💝 Online giving</li>
                        ${userType === 'member' ? '<li>👥 Member directory</li>' : ''}
                    </ul>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        Based on your interests, we'll connect you with ministry coordinators who will reach out soon 
                        with more information about how you can get involved.
                    </p>
                    
                    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1e293b; margin-top: 0;">Next Steps:</h3>
                        <ol style="color: #334155; line-height: 1.8; margin: 10px 0;">
                            <li>Complete your profile in your dashboard</li>
                            <li>Check out upcoming events</li>
                            <li>Join a small group</li>
                            <li>Attend our next Sunday service</li>
                        </ol>
                    </div>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        If you have any questions, feel free to reply to this email or contact our office directly.
                    </p>
                    
                    <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                        Blessings,<br>
                        <strong>${churchName} Team</strong>
                    </p>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
                    <p style="margin: 0;">
                        You're receiving this email because you completed onboarding at ${churchName}
                    </p>
                </div>
            </div>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            from_name: churchName,
            subject: `Welcome to ${churchName}! 🎉`,
            body: emailBody
        });

        // Schedule follow-up email for 3 days later
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3);

        // Update onboarding progress
        const progress = await base44.asServiceRole.entities.OnboardingProgress.filter({
            user_email: email
        });

        if (progress.length > 0) {
            await base44.asServiceRole.entities.OnboardingProgress.update(progress[0].id, {
                follow_up_date: followUpDate.toISOString()
            });
        }

        return Response.json({ 
            success: true, 
            message: 'Welcome email sent successfully' 
        });

    } catch (error) {
        console.error('Error sending welcome email:', error);
        return Response.json({ 
            error: error.message || 'Failed to send welcome email' 
        }, { status: 500 });
    }
});