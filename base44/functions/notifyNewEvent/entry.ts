import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event } = await req.json();

        // Handle both create and update events
        if (event?.type !== 'create' && event?.type !== 'update') {
            return Response.json({ message: 'Not a create or update event' });
        }

        const eventId = event.entity_id;
        const eventRecord = await base44.asServiceRole.entities.Event.get(eventId);

        if (!eventRecord || eventRecord.status === 'cancelled') {
            return Response.json({ message: 'Event not found or cancelled' });
        }

        const eventDate = new Date(eventRecord.start_datetime).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const notificationTitle = event.type === 'create'
            ? `📅 New Event: ${eventRecord.title}`
            : `📅 Event Updated: ${eventRecord.title}`;

        const notificationMessage = `${eventRecord.description || ''}\n\nWhen: ${eventDate}\nWhere: ${eventRecord.location || 'TBA'}`;

        // Get all members to notify
        const [allPrefs, allMembers] = await Promise.all([
            base44.asServiceRole.entities.NotificationPreference.filter({ event_notifications: true }),
            base44.asServiceRole.entities.Member.list()
        ]);

        const prefEmails = allPrefs.map(p => p.user_email);
        const memberEmails = allMembers.map(m => m.email).filter(Boolean);

        // Combine unique emails
        const allEmails = [...new Set([...prefEmails, ...memberEmails])];

        // Send in-app notifications
        if (allEmails.length > 0) {
            await base44.asServiceRole.functions.invoke('sendNotifications', {
                recipient_emails: allEmails,
                title: notificationTitle,
                message: notificationMessage,
                type: 'event',
                priority: 'normal',
                action_url: `/public-events-calendar`
            });
        }

        // Create in-app messages for all members (only on new event creation)
        if (event.type === 'create' && allEmails.length > 0) {
            const inAppMessages = allEmails.map(email => ({
                recipient_email: email,
                sender_name: 'Church Events',
                subject: notificationTitle,
                message: notificationMessage,
                message_type: 'event_announcement',
                is_read: false,
                sent_at: new Date().toISOString()
            }));

            // Bulk create in-app messages
            await base44.asServiceRole.entities.InAppMessage.bulkCreate(inAppMessages);
        }

        return Response.json({
            success: true,
            notifications_sent: allEmails.length
        });

    } catch (error) {
        console.error('Error sending event notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});