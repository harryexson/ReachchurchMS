import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This is a scheduled function for sending event reminders
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get events happening in the next 24 hours
        const upcomingEvents = await base44.asServiceRole.entities.Event.list();
        
        let remindersCreated = 0;
        
        for (const event of upcomingEvents) {
            const eventDate = new Date(event.start_datetime);
            const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
            
            // Send reminder 24 hours before event
            if (hoursUntilEvent > 23 && hoursUntilEvent <= 25 && event.status !== 'cancelled') {
                // Get registrations for this event
                const registrations = await base44.asServiceRole.entities.EventRegistration.filter({
                    event_id: event.id
                });
                
                for (const registration of registrations) {
                    // Check if reminder already sent
                    const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
                        recipient_email: registration.registrant_email,
                        related_entity_type: 'Event',
                        related_entity_id: event.id,
                        type: 'reminder'
                    });
                    
                    const alreadySent = existingNotifications.some(n => {
                        const notifDate = new Date(n.created_date);
                        const hoursSince = (now - notifDate) / (1000 * 60 * 60);
                        return hoursSince < 12; // Don't send again if sent in last 12 hours
                    });
                    
                    if (!alreadySent) {
                        await base44.asServiceRole.entities.Notification.create({
                            recipient_email: registration.registrant_email,
                            title: `Reminder: ${event.title} Tomorrow`,
                            message: `Don't forget! ${event.title} is happening tomorrow at ${new Date(event.start_datetime).toLocaleTimeString()}.${event.location ? ` Location: ${event.location}` : ''}`,
                            type: 'reminder',
                            priority: 'normal',
                            action_url: `/events`,
                            action_label: 'View Event',
                            related_entity_type: 'Event',
                            related_entity_id: event.id
                        });
                        
                        remindersCreated++;
                    }
                }
            }
        }
        
        console.log(`✅ Event reminders sent: ${remindersCreated}`);
        
        return Response.json({ 
            success: true, 
            reminders_created: remindersCreated 
        });
    } catch (error) {
        console.error('❌ Error sending event reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});