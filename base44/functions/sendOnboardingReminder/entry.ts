import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Find incomplete onboarding records older than 3 days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const allOnboarding = await base44.asServiceRole.entities.MemberOnboarding.filter({
            onboarding_completed: false
        });

        const needsReminder = allOnboarding.filter(ob => {
            const startDate = new Date(ob.onboarding_started);
            const lastReminder = ob.last_reminder_date ? new Date(ob.last_reminder_date) : null;
            const daysSinceStart = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Send reminder if more than 3 days since start and no reminder in last 7 days
            if (daysSinceStart < 3) return false;
            if (ob.reminder_count >= 3) return false; // Max 3 reminders
            if (lastReminder) {
                const daysSinceReminder = (Date.now() - lastReminder.getTime()) / (1000 * 60 * 60 * 24);
                return daysSinceReminder >= 7;
            }
            return true;
        });

        let remindersSent = 0;

        for (const onboarding of needsReminder) {
            try {
                const churchSettings = await base44.asServiceRole.entities.ChurchSettings.filter({
                    created_by: onboarding.created_by
                });
                
                const churchName = churchSettings[0]?.church_name || 'Our Church';
                const completedSteps = Object.values(onboarding.steps_completed || {}).filter(v => v).length;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: onboarding.member_email,
                    subject: `Continue Your Journey at ${churchName}`,
                    body: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #2563eb;">Hi ${onboarding.member_name.split(' ')[0]}!</h1>
                            
                            <p>We noticed you started your onboarding journey with us. You're doing great!</p>
                            
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #334155; margin-top: 0;">Your Progress</h3>
                                <p style="color: #64748b;">You've completed <strong>${completedSteps} of 5</strong> steps!</p>
                                
                                <div style="background: #e0e7ff; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div style="background: #2563eb; height: 100%; width: ${(completedSteps / 5) * 100}%;"></div>
                                </div>
                            </div>
                            
                            <p>Take a few minutes to complete your onboarding and unlock the full experience of being part of our community.</p>
                            
                            <p>
                                <a href="${Deno.env.get('BASE44_APP_URL')}/MemberOnboarding" 
                                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                                    Continue Your Journey
                                </a>
                            </p>
                            
                            <p style="color: #64748b;">
                                Blessings,<br>
                                <strong>${churchName} Team</strong>
                            </p>
                        </div>
                    `
                });

                // Update reminder count
                await base44.asServiceRole.entities.MemberOnboarding.update(onboarding.id, {
                    reminder_count: (onboarding.reminder_count || 0) + 1,
                    last_reminder_date: new Date().toISOString()
                });

                remindersSent++;

            } catch (error) {
                console.error(`Error sending reminder to ${onboarding.member_email}:`, error.message);
            }
        }

        return Response.json({ 
            success: true,
            remindersSent,
            message: `Sent ${remindersSent} onboarding reminders`
        });

    } catch (error) {
        console.error('Error sending onboarding reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});