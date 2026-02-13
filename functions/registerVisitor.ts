import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function enrollInInterestWorkflows(base44, visitor, interests, orgAdminEmail) {
    // Normalize interests for matching
    const normalizedInterests = interests.map(i => i.toLowerCase().trim());
    
    // Find workflows that match visitor interests
    const allWorkflows = await base44.asServiceRole.entities.VisitorWorkflow.filter({
        created_by: orgAdminEmail,
        is_active: true
    });

    const matchingWorkflows = allWorkflows.filter(workflow => {
        if (!workflow.interest_tags || workflow.interest_tags.length === 0) return false;
        
        // Check if any interest tag matches visitor interests
        return workflow.interest_tags.some(tag => 
            normalizedInterests.some(interest => 
                interest.includes(tag.toLowerCase()) || tag.toLowerCase().includes(interest)
            )
        );
    });

    console.log(`Found ${matchingWorkflows.length} interest-based workflows for visitor`);

    for (const workflow of matchingWorkflows) {
        // Check if already enrolled
        const existing = await base44.asServiceRole.entities.VisitorWorkflowExecution.filter({
            workflow_id: workflow.id,
            visitor_id: visitor.id
        });

        if (existing.length > 0) continue;

        const enrollDate = new Date();
        const firstActionDate = new Date(enrollDate);
        firstActionDate.setDate(firstActionDate.getDate() + (workflow.trigger_delay_days || 0));

        await base44.asServiceRole.entities.VisitorWorkflowExecution.create({
            workflow_id: workflow.id,
            workflow_name: workflow.workflow_name,
            visitor_id: visitor.id,
            visitor_name: visitor.data?.name || 'Unknown',
            visitor_email: visitor.data?.email,
            visitor_phone: visitor.data?.phone,
            status: 'active',
            current_step: 1,
            total_steps: workflow.total_steps || 1,
            enrolled_date: enrollDate.toISOString(),
            next_action_date: firstActionDate.toISOString(),
            steps_completed: []
        });

        console.log(`✅ Enrolled ${visitor.data?.name} in interest workflow: ${workflow.workflow_name}`);
    }
}

async function enrollInTriggerWorkflows(base44, visitor, triggerType) {
    const workflows = await base44.asServiceRole.entities.VisitorWorkflow.filter({
        trigger_type: triggerType,
        is_active: true
    });

    for (const workflow of workflows) {
        const existing = await base44.asServiceRole.entities.VisitorWorkflowExecution.filter({
            workflow_id: workflow.id,
            visitor_id: visitor.id
        });

        if (existing.length > 0) continue;

        const enrollDate = new Date();
        const firstActionDate = new Date(enrollDate);
        firstActionDate.setDate(firstActionDate.getDate() + (workflow.trigger_delay_days || 0));

        await base44.asServiceRole.entities.VisitorWorkflowExecution.create({
            workflow_id: workflow.id,
            workflow_name: workflow.workflow_name,
            visitor_id: visitor.id,
            visitor_name: visitor.data?.name || 'Unknown',
            visitor_email: visitor.data?.email,
            visitor_phone: visitor.data?.phone,
            status: 'active',
            current_step: 1,
            total_steps: workflow.total_steps || 1,
            enrolled_date: enrollDate.toISOString(),
            next_action_date: firstActionDate.toISOString(),
            steps_completed: []
        });

        console.log(`✅ Enrolled ${visitor.data?.name} in workflow: ${workflow.workflow_name}`);
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { visitorData, orgAdminEmail } = await req.json();

        if (!visitorData || !orgAdminEmail) {
            return Response.json({ 
                success: false,
                error: 'Missing required data' 
            }, { status: 400 });
        }

        // Check for duplicate visitor in this organization (only if email/phone provided)
        if (visitorData.email || visitorData.phone) {
            const allVisitors = await base44.asServiceRole.entities.Visitor.filter({
                created_by: orgAdminEmail
            });

            const duplicate = allVisitors.find(v => {
                if (visitorData.email && v.email === visitorData.email) return true;
                if (visitorData.phone && v.phone === visitorData.phone) return true;
                return false;
            });

            if (duplicate) {
                return Response.json({ 
                    success: false,
                    error: 'duplicate_visitor',
                    message: 'A visitor with this email or phone number is already registered at this church.'
                }, { status: 400 });
            }
        }

        // Create visitor record - SDK handles data wrapping automatically
        const newVisitor = await base44.asServiceRole.entities.Visitor.create({
            ...visitorData,
            follow_up_status: "new",
            created_by: orgAdminEmail
        });

        // Send welcome email to visitor
        if (visitorData.email && !visitorData.email.includes('@temp.')) {
            try {
                // Get church settings for reply-to email
                const churchSettings = await base44.asServiceRole.entities.ChurchSettings.filter({
                    created_by: orgAdminEmail
                });
                const replyToEmail = churchSettings.length > 0 ? churchSettings[0].visitor_reply_email : null;
                
                const emailPayload = {
                    from_name: 'Church Welcome Team',
                    to: visitorData.email,
                    subject: "Thank You for Visiting!",
                    body: `Hi ${visitorData.name},\n\nThank you so much for visiting our church! We're so glad you joined us.\n\nWe'll be in touch soon with ways to get connected and feel at home in our community.\n\nIf you have any questions, feel free to reply to this email.\n\nBlessings,\nChurch Team`
                };
                
                // Add reply-to if visitor follow-up leader is assigned
                if (replyToEmail) {
                    emailPayload.reply_to = replyToEmail;
                }
                
                await base44.integrations.Core.SendEmail(emailPayload);
                console.log('✅ Welcome email sent to:', visitorData.email);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Continue - visitor is created, email is optional
            }
        }

        // Auto-enroll in interest-based workflows
        if (visitorData.interests && visitorData.interests.length > 0) {
            try {
                await enrollInInterestWorkflows(base44, newVisitor, visitorData.interests, orgAdminEmail);
            } catch (workflowError) {
                console.error('Failed to enroll in interest workflows:', workflowError);
                // Continue - visitor is created, workflow enrollment is optional
            }
        }

        // Enroll in first-visit workflow
        try {
            await enrollInTriggerWorkflows(base44, newVisitor, 'first_visit');
        } catch (workflowError) {
            console.error('Failed to enroll in first-visit workflow:', workflowError);
        }
        
        return Response.json({ 
            success: true,
            visitor: newVisitor
        });

    } catch (error) {
        console.error('Error registering visitor:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});