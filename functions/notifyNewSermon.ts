import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event } = await req.json();

        // Only trigger on sermon creation
        if (event?.type !== 'create') {
            return Response.json({ message: 'Not a create event' });
        }

        const sermonId = event.entity_id;
        const sermon = await base44.asServiceRole.entities.Sermon.get(sermonId);

        if (!sermon) {
            return Response.json({ error: 'Sermon not found' }, { status: 404 });
        }

        // Get all members who want sermon notifications
        const allPrefs = await base44.asServiceRole.entities.NotificationPreference.filter({
            sermon_notifications: true
        });

        const recipientEmails = allPrefs.map(p => p.user_email);

        if (recipientEmails.length > 0) {
            await base44.asServiceRole.functions.invoke('sendNotifications', {
                recipient_emails: recipientEmails,
                title: `🎙️ New Sermon: ${sermon.title}`,
                message: `${sermon.speaker} just shared a new message${sermon.series ? ` in the ${sermon.series} series` : ''}.\n\n${sermon.description || 'Watch now!'}`,
                type: 'sermon',
                priority: 'normal',
                action_url: `/member-sermons?sermon=${sermon.id}`
            });
        }

        return Response.json({
            success: true,
            notifications_sent: recipientEmails.length
        });

    } catch (error) {
        console.error('Error sending sermon notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});