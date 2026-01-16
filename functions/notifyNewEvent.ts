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

        // Get all members who want event notifications
        const allPrefs = await base44.asServiceRole.entities.NotificationPreference.filter({
            event_notifications: true
        });

        const recipientEmails = allPrefs.map(p => p.user_email);

        if (recipientEmails.length > 0) {
            const title = event.type === 'create' 
                ? `📅 New Event: ${eventRecord.title}`
                : `📅 Event Updated: ${eventRecord.title}`;

            const eventDate = new Date(eventRecord.start_datetime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            await base44.asServiceRole.functions.invoke('sendNotifications', {
                recipient_emails: recipientEmails,
                title,
                message: `${eventRecord.description || ''}\n\nWhen: ${eventDate}\nWhere: ${eventRecord.location || 'TBA'}`,
                type: 'event',
                priority: 'normal',
                action_url: `/events?event=${eventRecord.id}`
            });
        }

        return Response.json({
            success: true,
            notifications_sent: recipientEmails.length
        });

    } catch (error) {
        console.error('Error sending event notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});