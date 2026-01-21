import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { event, data } = payload;

        // Only send notifications for new bookings
        if (event.type !== 'create') {
            return Response.json({ message: 'No notification needed', skipped: true });
        }

        // Get resource details
        const resource = await base44.asServiceRole.entities.Resource.filter({ 
            id: data.resource_id 
        }).then(r => r[0]);

        if (!resource) {
            return Response.json({ error: 'Resource not found' }, { status: 404 });
        }

        // Send notification to the person who booked
        if (data.booked_by_email) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: data.booked_by_email,
                title: `Resource Booked: ${resource.name}`,
                message: `Your booking for ${resource.name} from ${new Date(data.start_datetime).toLocaleString()} to ${new Date(data.end_datetime).toLocaleString()} has been confirmed.`,
                type: 'booking_confirmation',
                link: '/ResourceManagement',
                read: false
            });

            await base44.integrations.Core.SendEmail({
                to: data.booked_by_email,
                subject: `Booking Confirmation: ${resource.name}`,
                body: `
                    <h2>Resource Booking Confirmed</h2>
                    <p><strong>${resource.name}</strong></p>
                    <p>Start: ${new Date(data.start_datetime).toLocaleString()}</p>
                    <p>End: ${new Date(data.end_datetime).toLocaleString()}</p>
                    <p>Purpose: ${data.purpose}</p>
                    ${data.setup_notes ? `<p>Setup Notes: ${data.setup_notes}</p>` : ''}
                    ${resource.location ? `<p>Location: ${resource.location}</p>` : ''}
                `
            });
        }

        // Notify resource contact person if exists
        if (resource.contact_email && resource.contact_email !== data.booked_by_email) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: resource.contact_email,
                title: `${resource.name} Booked`,
                message: `${resource.name} has been booked by ${data.booked_by} from ${new Date(data.start_datetime).toLocaleString()}.`,
                type: 'resource_alert',
                link: '/ResourceManagement',
                read: false
            });
        }

        console.log(`✅ Booking notification sent for ${resource.name}`);

        return Response.json({
            success: true
        });

    } catch (error) {
        console.error('Error sending booking notification:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});