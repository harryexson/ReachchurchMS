import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        console.log('🔄 Processing SMS workflow executions...');

        // Get all active workflow executions that are due for next message
        const now = new Date();
        const executions = await base44.asServiceRole.entities.SMSWorkflowExecution.filter({
            status: 'active'
        });

        const dueExecutions = executions.filter(e => 
            e.next_message_date && new Date(e.next_message_date) <= now
        );

        console.log(`📋 Found ${dueExecutions.length} executions to process`);

        const results = [];

        for (const execution of dueExecutions) {
            try {
                // Get the workflow
                const workflows = await base44.asServiceRole.entities.SMSWorkflow.filter({
                    id: execution.workflow_id
                });

                if (workflows.length === 0) {
                    console.log(`⚠️ Workflow ${execution.workflow_id} not found`);
                    continue;
                }

                const workflow = workflows[0];
                const currentStep = execution.current_step;
                const step = workflow.sequence_steps?.[currentStep - 1];

                if (!step) {
                    // No more steps - mark as completed
                    await base44.asServiceRole.entities.SMSWorkflowExecution.update(execution.id, {
                        status: 'completed',
                        completed_date: new Date().toISOString()
                    });

                    // Update workflow stats
                    await base44.asServiceRole.entities.SMSWorkflow.update(workflow.id, {
                        total_completed: (workflow.total_completed || 0) + 1
                    });

                    console.log(`✅ Workflow execution completed for ${execution.phone_number}`);
                    continue;
                }

                // Send the message
                console.log(`📤 Sending step ${currentStep} to ${execution.phone_number}`);

                await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                    to: execution.phone_number,
                    message: step.message_template
                });

                // Calculate next message date
                const nextStep = workflow.sequence_steps[currentStep];
                let nextMessageDate = null;

                if (nextStep) {
                    nextMessageDate = new Date(now.getTime() + nextStep.delay_minutes * 60000).toISOString();
                }

                // Update execution
                await base44.asServiceRole.entities.SMSWorkflowExecution.update(execution.id, {
                    current_step: currentStep + 1,
                    next_message_date: nextMessageDate,
                    messages_sent: execution.messages_sent + 1,
                    status: nextStep ? 'active' : 'completed',
                    completed_date: nextStep ? null : new Date().toISOString()
                });

                if (!nextStep) {
                    // Update workflow completion stats
                    await base44.asServiceRole.entities.SMSWorkflow.update(workflow.id, {
                        total_completed: (workflow.total_completed || 0) + 1
                    });
                }

                results.push({
                    execution_id: execution.id,
                    phone_number: execution.phone_number,
                    step: currentStep,
                    status: 'sent'
                });

            } catch (error) {
                console.error(`Error processing execution ${execution.id}:`, error);
                
                await base44.asServiceRole.entities.SMSWorkflowExecution.update(execution.id, {
                    status: 'failed'
                });

                results.push({
                    execution_id: execution.id,
                    phone_number: execution.phone_number,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            processed: dueExecutions.length,
            results
        });

    } catch (error) {
        console.error('Error processing SMS workflows:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});