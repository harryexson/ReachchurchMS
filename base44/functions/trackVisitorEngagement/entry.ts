import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { 
            visitor_id,
            engagement_type,
            source,
            tracking_token,
            metadata = {}
        } = body;

        // Log the engagement
        await base44.asServiceRole.entities.VisitorEngagement.create({
            visitor_id: visitor_id,
            engagement_type: engagement_type,
            engagement_date: new Date().toISOString(),
            source: source,
            metadata: metadata,
            follow_up_needed: ['form_submit', 'rsvp', 'phone_call'].includes(engagement_type)
        });

        // Update follow-up record if tracking token provided
        if (tracking_token) {
            const followUps = await base44.asServiceRole.entities.VisitorFollowUp.filter({
                tracking_token: tracking_token
            });

            if (followUps.length > 0) {
                const followUp = followUps[0];
                const updateData = {};

                if (engagement_type === 'email_open') {
                    updateData.status = 'opened';
                    updateData.opened_date = new Date().toISOString();
                } else if (engagement_type === 'link_click') {
                    updateData.status = 'clicked';
                    updateData.clicked_date = new Date().toISOString();
                }

                if (Object.keys(updateData).length > 0) {
                    await base44.asServiceRole.entities.VisitorFollowUp.update(followUp.id, updateData);
                }
            }
        }

        // Update visitor engagement status
        if (visitor_id) {
            const visitor = await base44.asServiceRole.entities.Visitor.get(visitor_id);
            if (visitor) {
                await base44.asServiceRole.entities.Visitor.update(visitor_id, {
                    response_received: true,
                    follow_up_status: 'engaged'
                });
            }
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('Tracking error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});