import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event } = await req.json();

        if (event?.type !== 'create') {
            return Response.json({ message: 'Not a create event' });
        }

        const announcementId = event.entity_id;
        const announcement = await base44.asServiceRole.entities.Announcement.get(announcementId);

        if (!announcement || announcement.status !== 'published') {
            return Response.json({ message: 'Announcement not found or not published' });
        }

        // Get all members who want announcement notifications
        const allPrefs = await base44.asServiceRole.entities.NotificationPreference.filter({
            announcement_notifications: true
        });

        const recipientEmails = allPrefs.map(p => p.user_email);

        if (recipientEmails.length > 0) {
            const priorityEmoji = {
                urgent: '🚨',
                high: '❗',
                medium: '📢',
                low: 'ℹ️'
            };

            await base44.asServiceRole.functions.invoke('sendNotifications', {
                recipient_emails: recipientEmails,
                title: `${priorityEmoji[announcement.priority] || '📢'} ${announcement.title}`,
                message: announcement.message,
                type: 'announcement',
                priority: announcement.priority || 'normal',
                action_url: `/member-announcements?announcement=${announcement.id}`
            });
        }

        return Response.json({
            success: true,
            notifications_sent: recipientEmails.length
        });

    } catch (error) {
        console.error('Error sending announcement notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});