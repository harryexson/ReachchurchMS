import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipient_email, title, message, type, priority, action_url, action_label, related_entity_type, related_entity_id, expires_at } = await req.json();

        if (!recipient_email || !title || !message) {
            return Response.json({ 
                error: 'Missing required fields: recipient_email, title, message' 
            }, { status: 400 });
        }

        // Create the notification
        const notification = await base44.asServiceRole.entities.Notification.create({
            recipient_email,
            title,
            message,
            type: type || 'system',
            priority: priority || 'normal',
            action_url,
            action_label,
            related_entity_type,
            related_entity_id,
            expires_at
        });

        console.log(`✅ Notification created for ${recipient_email}: ${title}`);

        return Response.json({ 
            success: true, 
            notification 
        });
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});