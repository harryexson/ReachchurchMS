import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { member } = await req.json();

        if (!member || !member.id) {
            return Response.json({ error: 'Member data required' }, { status: 400 });
        }

        // Check if onboarding already exists
        const existing = await base44.asServiceRole.entities.MemberOnboarding.filter({
            member_id: member.id
        });

        if (existing.length > 0) {
            return Response.json({ 
                message: 'Onboarding already exists',
                onboarding_id: existing[0].id 
            });
        }

        // Create onboarding record
        const onboarding = await base44.asServiceRole.entities.MemberOnboarding.create({
            member_id: member.id,
            member_email: member.email,
            member_name: `${member.first_name} ${member.last_name}`,
            onboarding_started: new Date().toISOString(),
            current_step: 1,
            steps_completed: {
                welcome: false,
                profile_complete: false,
                ministry_exploration: false,
                church_values: false,
                connect_community: false
            },
            welcome_email_sent: false,
            reminder_count: 0,
            created_by: member.created_by
        });

        // Send welcome email
        try {
            const churchSettings = await base44.asServiceRole.entities.ChurchSettings.filter({
                created_by: member.created_by
            });
            
            const churchName = churchSettings[0]?.church_name || 'Our Church';

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: member.email,
                subject: `Welcome to ${churchName}! 🎉`,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #2563eb;">Welcome, ${member.first_name}!</h1>
                        
                        <p>We're thrilled to have you join our church family at ${churchName}!</p>
                        
                        <p>To help you get started, we've created a personalized onboarding guide just for you. Here's what we'll cover:</p>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #334155; margin-top: 0;">Your Onboarding Journey</h3>
                            <ul style="color: #64748b;">
                                <li>✅ Complete your member profile</li>
                                <li>🙏 Explore our ministries and groups</li>
                                <li>❤️ Learn about our church values</li>
                                <li>🤝 Connect with our community</li>
                            </ul>
                        </div>
                        
                        <p>
                            <a href="${Deno.env.get('BASE44_APP_URL')}/MemberOnboarding" 
                               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Start Your Journey
                            </a>
                        </p>
                        
                        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                            If you have any questions, don't hesitate to reach out to our team. We're here to help!
                        </p>
                        
                        <p style="color: #64748b;">
                            Blessings,<br>
                            <strong>${churchName} Team</strong>
                        </p>
                    </div>
                `
            });

            // Update onboarding record
            await base44.asServiceRole.entities.MemberOnboarding.update(onboarding.id, {
                welcome_email_sent: true
            });
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError.message);
        }

        // Create in-app notification
        try {
            await base44.asServiceRole.entities.Notification.create({
                user_email: member.email,
                title: 'Welcome to the Family! 🎉',
                message: 'Start your onboarding journey to get connected with our church community.',
                type: 'onboarding',
                action_url: '/MemberOnboarding',
                action_label: 'Get Started',
                priority: 'high',
                created_by: member.created_by
            });
        } catch (notifError) {
            console.error('Error creating notification:', notifError.message);
        }

        return Response.json({ 
            success: true, 
            onboarding_id: onboarding.id,
            message: 'Member onboarding initiated successfully'
        });

    } catch (error) {
        console.error('Error initiating member onboarding:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});