import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all upcoming events
        const allEvents = await base44.asServiceRole.entities.Event.filter({});
        const now = new Date();

        // Get all user notification preferences
        const allPrefs = await base44.asServiceRole.entities.NotificationPreference.filter({});
        
        // Group prefs by reminder hours
        const prefsByHours = {};
        allPrefs.forEach(pref => {
            if (pref.reminder_notifications !== false) {
                const hours = pref.event_reminder_hours || 24;
                if (!prefsByHours[hours]) {
                    prefsByHours[hours] = [];
                }
                prefsByHours[hours].push(pref);
            }
        });

        let remindersSent = 0;

        for (const event of allEvents) {
            if (!event.start_datetime || event.status === 'cancelled') continue;

            const eventStart = new Date(event.start_datetime);
            if (eventStart <= now) continue; // Skip past events

            // Check each reminder window
            for (const [hoursStr, prefs] of Object.entries(prefsByHours)) {
                const hours = parseInt(hoursStr);
                const reminderTime = new Date(eventStart.getTime() - hours * 60 * 60 * 1000);
                const timeUntilReminder = reminderTime.getTime() - now.getTime();

                // Send reminder if within 5 minutes of reminder time
                if (timeUntilReminder >= 0 && timeUntilReminder < 5 * 60 * 1000) {
                    const recipientEmails = prefs.map(p => p.user_email);

                    await base44.asServiceRole.functions.invoke('sendNotifications', {
                        recipient_emails: recipientEmails,
                        title: `⏰ Reminder: ${event.title}`,
                        message: `This event starts in ${hours} hour${hours > 1 ? 's' : ''}.\n\n${event.description || ''}\n\nLocation: ${event.location || 'TBA'}`,
                        type: 'reminder',
                        priority: 'high',
                        action_url: `/events?event=${event.id}`
                    });

                    remindersSent += recipientEmails.length;
                }
            }
        }

        return Response.json({
            success: true,
            reminders_sent: remindersSent,
            events_checked: allEvents.length
        });

    } catch (error) {
        console.error('Error sending event reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});