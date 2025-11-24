import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('=== PROCESSING VISITOR WORKFLOWS ===');
    const startTime = Date.now();
    
    try {
        const base44 = createClientFromRequest(req);
        
        const now = new Date();
        console.log('Current time:', now.toISOString());
        
        // Get all active workflow executions that need processing
        const executions = await base44.asServiceRole.entities.VisitorWorkflowExecution.filter({
            status: 'active'
        });
        
        console.log(`Found ${executions.length} active workflow executions`);
        
        let processed = 0;
        let sent = 0;
        let failed = 0;
        
        for (const execution of executions) {
            try {
                // Check if next action is due
                if (!execution.next_action_date) {
                    console.log(`Execution ${execution.id} has no next_action_date, skipping`);
                    continue;
                }
                
                const nextActionDate = new Date(execution.next_action_date);
                if (nextActionDate > now) {
                    console.log(`Execution ${execution.id} not due yet (due: ${nextActionDate.toISOString()})`);
                    continue;
                }
                
                console.log(`Processing execution ${execution.id} for visitor ${execution.visitor_name}`);
                
                // Get workflow and current step
                const workflows = await base44.asServiceRole.entities.VisitorWorkflow.filter({
                    id: execution.workflow_id
                });
                
                if (workflows.length === 0) {
                    console.log(`Workflow ${execution.workflow_id} not found`);
                    continue;
                }
                
                const workflow = workflows[0];
                
                if (!workflow.is_active) {
                    console.log(`Workflow ${workflow.workflow_name} is not active, skipping`);
                    continue;
                }
                
                // Get current step
                const steps = await base44.asServiceRole.entities.VisitorWorkflowStep.filter({
                    workflow_id: workflow.id,
                    step_number: execution.current_step
                });
                
                if (steps.length === 0) {
                    console.log(`Step ${execution.current_step} not found for workflow ${workflow.id}`);
                    // Mark as completed if no more steps
                    await base44.asServiceRole.entities.VisitorWorkflowExecution.update(execution.id, {
                        status: 'completed',
                        completed_date: now.toISOString()
                    });
                    continue;
                }
                
                const step = steps[0];
                console.log(`Executing step ${step.step_number}: ${step.step_name}`);
                
                // Get visitor details
                const visitors = await base44.asServiceRole.entities.Visitor.filter({
                    id: execution.visitor_id
                });
                
                if (visitors.length === 0) {
                    console.log(`Visitor ${execution.visitor_id} not found`);
                    continue;
                }
                
                const visitor = visitors[0];
                
                // Check stop conditions
                if (visitor.converted_to_member && step.stop_if_condition === 'became_member') {
                    console.log(`Visitor became member, stopping workflow`);
                    await base44.asServiceRole.entities.VisitorWorkflowExecution.update(execution.id, {
                        status: 'stopped',
                        stopped_reason: 'Visitor became member'
                    });
                    continue;
                }
                
                // Personalize message
                const churchSettings = await base44.asServiceRole.entities.ChurchSettings.list();
                const churchName = churchSettings.length > 0 ? churchSettings[0].church_name : 'Our Church';
                
                let personalizedMessage = step.message_body
                    .replace(/{visitor_name}/g, visitor.name)
                    .replace(/{church_name}/g, churchName)
                    .replace(/{visit_date}/g, new Date(visitor.visit_date).toLocaleDateString())
                    .replace(/{total_visits}/g, visitor.total_visits || 1);
                
                let personalizedSubject = step.subject || '';
                if (personalizedSubject) {
                    personalizedSubject = personalizedSubject
                        .replace(/{visitor_name}/g, visitor.name)
                        .replace(/{church_name}/g, churchName)
                        .replace(/{visit_date}/g, new Date(visitor.visit_date).toLocaleDateString());
                }
                
                // Send message based on channel
                let messageSent = false;
                
                if (step.channel === 'email' || step.channel === 'both') {
                    if (visitor.email && !visitor.email.includes('@temp.') && !visitor.email.includes('@visitor.temp')) {
                        try {
                            await base44.asServiceRole.integrations.Core.SendEmail({
                                to: visitor.email,
                                from_name: churchName,
                                subject: personalizedSubject,
                                body: personalizedMessage
                            });
                            
                            console.log(`✅ Email sent to ${visitor.email}`);
                            messageSent = true;
                            sent++;
                        } catch (emailError) {
                            console.error(`❌ Email failed:`, emailError.message);
                        }
                    } else {
                        console.log(`⚠️ Invalid email for visitor ${visitor.name}`);
                    }
                }
                
                if (step.channel === 'sms' || step.channel === 'both') {
                    if (visitor.phone) {
                        try {
                            const smsResult = await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                                to: visitor.phone,
                                message: personalizedMessage
                            });
                            
                            if (smsResult.success) {
                                console.log(`✅ SMS sent to ${visitor.phone}`);
                                messageSent = true;
                                sent++;
                            }
                        } catch (smsError) {
                            console.error(`❌ SMS failed:`, smsError.message);
                        }
                    }
                }
                
                // Update execution
                const completedSteps = execution.steps_completed || [];
                completedSteps.push(execution.current_step);
                
                const isLastStep = execution.current_step >= execution.total_steps;
                
                if (isLastStep) {
                    // Workflow completed
                    await base44.asServiceRole.entities.VisitorWorkflowExecution.update(execution.id, {
                        status: 'completed',
                        completed_date: now.toISOString(),
                        steps_completed: completedSteps,
                        messages_sent: (execution.messages_sent || 0) + (messageSent ? 1 : 0),
                        last_action_date: now.toISOString()
                    });
                    console.log(`✅ Workflow completed for ${visitor.name}`);
                } else {
                    // Move to next step
                    const nextSteps = await base44.asServiceRole.entities.VisitorWorkflowStep.filter({
                        workflow_id: workflow.id,
                        step_number: execution.current_step + 1
                    });
                    
                    if (nextSteps.length > 0) {
                        const nextStep = nextSteps[0];
                        const nextActionDate = new Date(now);
                        nextActionDate.setDate(nextActionDate.getDate() + (nextStep.delay_days || 0));
                        nextActionDate.setHours(nextActionDate.getHours() + (nextStep.delay_hours || 0));
                        
                        await base44.asServiceRole.entities.VisitorWorkflowExecution.update(execution.id, {
                            current_step: execution.current_step + 1,
                            steps_completed: completedSteps,
                            messages_sent: (execution.messages_sent || 0) + (messageSent ? 1 : 0),
                            last_action_date: now.toISOString(),
                            next_action_date: nextActionDate.toISOString()
                        });
                        console.log(`✅ Moved to step ${execution.current_step + 1}, next action: ${nextActionDate.toISOString()}`);
                    }
                }
                
                processed++;
                
            } catch (error) {
                console.error(`Error processing execution ${execution.id}:`, error);
                failed++;
            }
        }
        
        const duration = Date.now() - startTime;
        console.log(`=== WORKFLOW PROCESSING COMPLETE ===`);
        console.log(`Processed: ${processed}, Sent: ${sent}, Failed: ${failed}`);
        console.log(`Duration: ${duration}ms`);
        
        return Response.json({
            success: true,
            processed,
            sent,
            failed,
            duration_ms: duration
        });
        
    } catch (error) {
        console.error('=== WORKFLOW PROCESSING ERROR ===');
        console.error(error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});