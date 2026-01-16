import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can send push notifications
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { title, body, targetUsers, icon, tag, url } = await req.json();

    if (!title || !body) {
      return Response.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Get notification preferences for target users
    const preferences = await base44.entities.NotificationPreference.filter({
      push_notifications_enabled: true
    });

    // Filter by target users if specified
    let recipientPrefs = preferences;
    if (targetUsers && targetUsers.length > 0) {
      recipientPrefs = preferences.filter(p => targetUsers.includes(p.user_email));
    }

    // In a real implementation, you would:
    // 1. Use a service like OneSignal, Firebase Cloud Messaging, or Web Push
    // 2. Store push subscription endpoints in NotificationPreference entity
    // 3. Send push notifications to each subscription endpoint

    // For now, create notification records
    const notifications = [];
    for (const pref of recipientPrefs) {
      const notification = await base44.entities.Notification.create({
        user_email: pref.user_email,
        title: title,
        message: body,
        type: 'push',
        status: 'sent',
        sent_date: new Date().toISOString(),
        metadata: {
          icon: icon || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png',
          tag: tag || 'notification',
          url: url
        }
      });
      notifications.push(notification);
    }

    return Response.json({
      success: true,
      message: `Push notification queued for ${notifications.length} user(s)`,
      count: notifications.length,
      notifications: notifications
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send push notification' 
    }, { status: 500 });
  }
});