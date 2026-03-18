import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        // This function should be called via scheduled job or cron
        const base44 = createClientFromRequest(req);

        // Get all onboarding records that need follow-up
        const now = new Date();
        const allProgress = await base44.asServiceRole.entities.OnboardingProgress.list();
        
        const needsFollowUp = allProgress.filter(p => 
            p.onboarding_completed && 
            !p.follow_up_sent && 
            p.follow_up_date &&
            new Date(p.follow_up_date) <= now
        );

        console.log(`Found ${needsFollowUp.length} users needing follow-up`);

        let sentCount = 0;
        let errorCount = 0;

        for (const progress of needsFollowUp) {
            try {
                // Get church settings
                let churchName = 'REACH Church Connect';
                try {
                    const settings = await base44.asServiceRole.entities.ChurchSettings.list();
                    if (settings.length > 0 && settings[0].church_name) {
                        churchName = settings[0].church_name;
                    }
                } catch (err) {
                    console.log('Using default church name');
                }

                const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">How's Everything Going?</h1>
                        </div>
                        
                        <div style="padding: 40px 20px; background: white;">
                            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                Hi ${progress.user_name},
                            </p>
                            
                            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                It's been a few days since you joined ${churchName}, and we wanted to check in! 
                                We hope you're settling in well and finding your way around.
                            </p>
                            
                            <div style="background: #eff6ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                                <p style="color: #1e40af; margin: 0; font-weight: 500;">
                                    💡 Have questions? Need help getting connected? We're here for you!
                                </p>
                            </div>
                            
                            <h3 style="color: #1e293b;">Based on your interests:</h3>
                            ${progress.interests_selected?.length > 0 ? `
                                <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                    You expressed interest in: <strong>${progress.interests_selected.map(i => i.replace(/_/g, ' ')).join(', ')}</strong>
                                </p>
                                <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                    The coordinators for these ministries should have reached out by now. If you haven't 
                                    heard from them or would like more information, please reply to this email!
                                </p>
                            ` : `
                                <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                    We noticed you haven't selected any ministry interests yet. There are many ways to get 
                                    involved - from serving in children's ministry to joining the worship team. Let us know 
                                    what interests you!
                                </p>
                            `}
                            
                            <h3 style="color: #1e293b;">This Week's Highlights:</h3>
                            <ul style="font-size: 16px; color: #334155; line-height: 1.8;">
                                <li>📅 Sunday Service - 10:00 AM</li>
                                <li>🙏 Wednesday Prayer Meeting - 7:00 PM</li>
                                <li>☕ Friday Coffee & Connect - 6:30 PM</li>
                            </ul>
                            
                            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                We'd love to see you at any of these events! They're great opportunities to meet others 
                                and feel more connected to the community.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                                    View All Events
                                </a>
                            </div>
                            
                            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                Remember, we're here to support you on your journey. Don't hesitate to reach out!
                            </p>
                            
                            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                                With love,<br>
                                <strong>${churchName} Team</strong>
                            </p>
                        </div>
                        
                        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
                            <p style="margin: 0;">
                                ${churchName} | Making disciples, transforming lives
                            </p>
                        </div>
                    </div>
                `;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: progress.user_email,
                    from_name: churchName,
                    subject: `How's it going, ${progress.user_name.split(' ')[0]}? 👋`,
                    body: emailBody
                });

                // Mark as sent
                await base44.asServiceRole.entities.OnboardingProgress.update(progress.id, {
                    follow_up_sent: true
                });

                sentCount++;
            } catch (err) {
                console.error(`Error sending follow-up to ${progress.user_email}:`, err);
                errorCount++;
            }
        }

        return Response.json({ 
            success: true,
            sent: sentCount,
            errors: errorCount,
            total: needsFollowUp.length
        });

    } catch (error) {
        console.error('Error in follow-up email job:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});