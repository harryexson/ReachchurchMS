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

        // Check for duplicate visitor in this organization
        const existingVisitors = await base44.asServiceRole.entities.Visitor.filter({
            created_by: orgAdminEmail,
            $or: [
                { email: visitorData.email },
                { phone: visitorData.phone }
            ]
        });

        if (existingVisitors.length > 0) {
            return Response.json({ 
                success: false,
                error: 'duplicate_visitor',
                message: 'A visitor with this email or phone number is already registered at this church.'
            }, { status: 400 });
        }

        // Create visitor record - SDK handles data wrapping automatically
        const newVisitor = await base44.asServiceRole.entities.Visitor.create({
            ...visitorData,
            follow_up_status: "new",
            created_by: orgAdminEmail
        });

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