import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { trigger_type, trigger_data } = await req.json();

    // Get all active workflows for this trigger type
    const workflows = await base44.asServiceRole.entities.Workflow.filter({
      trigger_type: trigger_type,
      is_active: true
    });

    const results = [];

    for (const workflow of workflows) {
      try {
        const executionResult = {
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          trigger_data: trigger_data,
          execution_date: new Date().toISOString(),
          status: 'success',
          actions_executed: []
        };

        // Execute each action in the workflow
        for (const action of workflow.actions || []) {
          try {
            let actionResult = { action_type: action.action_type, status: 'success' };

            if (action.action_type === 'send_email') {
              // Replace placeholders in template
              let subject = action.config.subject || '';
              let message = action.config.message || '';
              
              subject = subject.replace(/{name}/g, trigger_data.name || '');
              message = message.replace(/{name}/g, trigger_data.name || '');
              message = message.replace(/{email}/g, trigger_data.email || '');
              message = message.replace(/{phone}/g, trigger_data.phone || '');

              await base44.asServiceRole.integrations.Core.SendEmail({
                to: trigger_data.email,
                subject: subject,
                body: message,
                from_name: workflow.name
              });

              actionResult.details = 'Email sent';
            } else if (action.action_type === 'send_sms') {
              if (trigger_data.phone) {
                let message = action.config.message || '';
                message = message.replace(/{name}/g, trigger_data.name || '');
                
                await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                  to: trigger_data.phone,
                  message: message
                });
                actionResult.details = 'SMS sent';
              }
            } else if (action.action_type === 'send_notification') {
              if (trigger_data.email) {
                await base44.asServiceRole.entities.InAppMessage.create({
                  subject: action.config.subject || 'Notification',
                  message_body: action.config.message || '',
                  recipient_emails: [trigger_data.email],
                  sender_role: 'system',
                  message_type: 'notification',
                  status: 'sent',
                  sent_date: new Date().toISOString()
                });
                actionResult.details = 'Notification created';
              }
            } else if (action.action_type === 'assign_to_group') {
              if (action.config.group_id && trigger_data.email) {
                await base44.asServiceRole.entities.MemberGroupAssignment.create({
                  group_id: action.config.group_id,
                  member_email: trigger_data.email,
                  joined_date: new Date().toISOString(),
                  status: 'active'
                });
                actionResult.details = 'Added to group';
              }
            }

            executionResult.actions_executed.push(actionResult);
          } catch (actionError) {
            console.error('Action error:', actionError);
            executionResult.actions_executed.push({
              action_type: action.action_type,
              status: 'failed',
              error: actionError.message
            });
            executionResult.status = 'partial';
          }
        }

        // Log execution
        await base44.asServiceRole.entities.WorkflowExecution.create(executionResult);

        // Update workflow execution count
        await base44.asServiceRole.entities.Workflow.update(workflow.id, {
          execution_count: (workflow.execution_count || 0) + 1,
          last_execution: new Date().toISOString()
        });

        results.push({ workflow_id: workflow.id, status: executionResult.status });
      } catch (workflowError) {
        console.error('Workflow execution error:', workflowError);
        
        await base44.asServiceRole.entities.WorkflowExecution.create({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          trigger_data: trigger_data,
          execution_date: new Date().toISOString(),
          status: 'failed',
          error_message: workflowError.message,
          actions_executed: []
        });

        results.push({ workflow_id: workflow.id, status: 'failed', error: workflowError.message });
      }
    }

    return Response.json({
      success: true,
      workflows_executed: workflows.length,
      results: results
    });

  } catch (error) {
    console.error('Execute workflows error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});