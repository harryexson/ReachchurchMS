import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        console.log('🔄 Processing visitor SMS workflows via SignalHouse...');

        const workflows = await base44.asServiceRole.entities.VisitorSMSWorkflow.filter({ is_active: true });
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchName = settings[0]?.church_name || 'Our Church';

        let totalProcessed = 0;
        let totalSent = 0;
        const results = [];

        const pendingExecutions = await base44.asServiceRole.entities.VisitorSMSExecution.filter({ status: 'active' });

        for (const execution of pendingExecutions) {
            try {
                const now = new Date();
                const nextSendTime = new Date(execution.next_send_time);

                if (nextSendTime <= now) {
                    const workflow = workflows.find(w => w.id === execution.workflow_id);
                    if (!workflow || !workflow.is_active) continue;

                    const visitors = await base44.asServiceRole.entities.Visitor.filter({ id: execution.visitor_id });
                    if (visitors.length === 0) continue;
                    const visitor = visitors[0];

                    const step = workflow.sms_sequence[execution.current_step];
                    if (!step) {
                        await base44.asServiceRole.entities.VisitorSMSExecution.update(execution.id, {
                            status: 'completed',
                            completion_date: new Date().toISOString()
                        });
                        await base44.asServiceRole.entities.VisitorSMSWorkflow.update(workflow.id, {
                            total_completed: (workflow.total_completed || 0) + 1
                        });
                        continue;
                    }

                    const message = step.message_template
                        .replace(/{name}/g, visitor.name)
                        .replace(/{visit_date}/g, new Date(visitor.visit_date).toLocaleDateString())
                        .replace(/{church_name}/g, churchName);

                    // Use SignalHouse instead of Sinch
                    const smsResult = await base44.asServiceRole.functions.invoke('sendSignalhouseSMS', {
                        to: execution.visitor_phone,
                        message
                    });

                    if (smsResult.data?.success) {
                        totalSent++;
                        const nextStep = execution.current_step + 1;
                        let nextSend = null;
                        if (nextStep < workflow.sms_sequence.length) {
                            const nextStepData = workflow.sms_sequence[nextStep];
                            nextSend = new Date();
                            nextSend.setHours(nextSend.getHours() + nextStepData.delay_hours);
                        }

                        await base44.asServiceRole.entities.VisitorSMSExecution.update(execution.id, {
                            current_step: nextStep,
                            messages_sent: (execution.messages_sent || 0) + 1,
                            last_message_date: new Date().toISOString(),
                            next_send_time: nextSend?.toISOString() || null,
                            status: nextSend ? 'active' : 'completed',
                            completion_date: nextSend ? null : new Date().toISOString()
                        });

                        if (!nextSend) {
                            await base44.asServiceRole.entities.VisitorSMSWorkflow.update(workflow.id, {
                                total_completed: (workflow.total_completed || 0) + 1
                            });
                        }

                        results.push({ visitor: visitor.name, workflow: workflow.workflow_name, step: execution.current_step + 1, status: 'sent' });
                    } else {
                        results.push({ visitor: visitor.name, workflow: workflow.workflow_name, step: execution.current_step + 1, status: 'failed', error: smsResult.data?.error });
                    }

                    totalProcessed++;
                }
            } catch (error) {
                console.error('Error processing execution:', error);
            }
        }

        console.log(`✅ Processed ${totalProcessed} executions, sent ${totalSent} messages`);
        return Response.json({ success: true, processed: totalProcessed, sent: totalSent, results });

    } catch (error) {
        console.error('Error processing visitor SMS workflows:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});