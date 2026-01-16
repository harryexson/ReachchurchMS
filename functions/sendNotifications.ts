import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { recipient_emails, title, message, type, priority, action_url } = await req.json();

        if (!recipient_emails || !Array.isArray(recipient_emails) || recipient_emails.length === 0) {
            return Response.json({ error: 'recipient_emails array is required' }, { status: 400 });
        }

        if (!title || !message) {
            return Response.json({ error: 'title and message are required' }, { status: 400 });
        }

        const notificationType = type || 'system';
        const notificationPriority = priority || 'normal';

        // Create in-app notifications for each recipient
        const notifications = await Promise.all(
            recipient_emails.map(async (email) => {
                // Check user's notification preferences
                const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({
                    user_email: email
                });

                const userPrefs = prefs.length > 0 ? prefs[0] : null;

                // Check if user has this notification type enabled
                const typeKey = `${notificationType}_notifications`;
                const shouldNotify = !userPrefs || userPrefs[typeKey] !== false;

                if (!shouldNotify) {
                    return null;
                }

                // Create in-app notification
                const notification = await base44.asServiceRole.entities.Notification.create({
                    recipient_email: email,
                    title,
                    message,
                    type: notificationType,
                    priority: notificationPriority,
                    action_url: action_url || null,
                    is_read: false,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                });

                // Send email if user has email notifications enabled
                if (userPrefs?.email_notifications && userPrefs.digest_frequency === 'realtime') {
                    try {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: email,
                            subject: `🔔 ${title}`,
                            body: `${message}\n\n${action_url ? `View: ${action_url}` : ''}\n\n---\nYou received this because you have email notifications enabled. Manage your preferences in Notification Settings.`
                        });
                    } catch (emailError) {
                        console.error('Failed to send email notification:', emailError);
                    }
                }

                return notification;
            })
        );

        const successfulNotifications = notifications.filter(n => n !== null);

        return Response.json({
            success: true,
            notifications_sent: successfulNotifications.length,
            notifications: successfulNotifications
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});