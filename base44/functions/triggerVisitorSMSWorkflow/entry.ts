import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        
        const { visitor_id, trigger_type } = payload;

        if (!visitor_id || !trigger_type) {
            return Response.json({ 
                error: 'Missing required fields: visitor_id, trigger_type' 
            }, { status: 400 });
        }

        console.log(`🚀 Triggering SMS workflows for visitor ${visitor_id}, trigger: ${trigger_type}`);

        // Get visitor details
        const visitors = await base44.asServiceRole.entities.Visitor.filter({ id: visitor_id });
        if (visitors.length === 0) {
            return Response.json({ error: 'Visitor not found' }, { status: 404 });
        }
        const visitor = visitors[0];

        if (!visitor.phone) {
            return Response.json({ 
                error: 'Visitor has no phone number',
                success: false 
            });
        }

        // Find matching workflows
        const workflows = await base44.asServiceRole.entities.VisitorSMSWorkflow.filter({
            is_active: true,
            trigger_type: trigger_type
        });

        console.log(`Found ${workflows.length} matching workflows`);

        const triggered = [];

        for (const workflow of workflows) {
            try {
                // Check if visitor already enrolled in this workflow
                const existingExecutions = await base44.asServiceRole.entities.VisitorSMSExecution.filter({
                    workflow_id: workflow.id,
                    visitor_id: visitor_id
                });

                if (existingExecutions.length > 0) {
                    console.log(`Visitor already enrolled in workflow ${workflow.workflow_name}`);
                    continue;
                }

                // Calculate first send time
                const firstStep = workflow.sms_sequence[0];
                if (!firstStep) continue;

                const nextSendTime = new Date();
                if (workflow.trigger_delay_days > 0) {
                    nextSendTime.setDate(nextSendTime.getDate() + workflow.trigger_delay_days);
                }
                nextSendTime.setHours(nextSendTime.getHours() + (firstStep.delay_hours || 0));

                // Create execution record
                await base44.asServiceRole.entities.VisitorSMSExecution.create({
                    workflow_id: workflow.id,
                    visitor_id: visitor_id,
                    visitor_name: visitor.name,
                    visitor_phone: visitor.phone,
                    current_step: 0,
                    next_send_time: nextSendTime.toISOString(),
                    status: 'active',
                    messages_sent: 0
                });

                // Update workflow trigger count
                await base44.asServiceRole.entities.VisitorSMSWorkflow.update(workflow.id, {
                    total_triggered: (workflow.total_triggered || 0) + 1
                });

                triggered.push({
                    workflow: workflow.workflow_name,
                    first_send_at: nextSendTime.toISOString()
                });

                console.log(`✅ Enrolled in workflow: ${workflow.workflow_name}`);

            } catch (error) {
                console.error(`Error enrolling in workflow ${workflow.id}:`, error);
            }
        }

        return Response.json({
            success: true,
            visitor: visitor.name,
            workflows_triggered: triggered.length,
            workflows: triggered
        });

    } catch (error) {
        console.error('❌ Error triggering workflows:', error);
        return Response.json({ 
            error: 'Failed to trigger workflows',
            details: error.message 
        }, { status: 500 });
    }
});