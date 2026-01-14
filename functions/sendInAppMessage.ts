import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            subject, 
            message_body, 
            recipient_emails, 
            recipient_groups,
            message_type, 
            priority, 
            attachment_urls,
            related_entity_type,
            related_entity_id,
            send_email_notification,
            thread_id
        } = await req.json();

        // Validate inputs
        if (!message_body) {
            return Response.json({ error: 'Message body is required' }, { status: 400 });
        }

        if (!recipient_emails || recipient_emails.length === 0) {
            if (!recipient_groups || recipient_groups.length === 0) {
                return Response.json({ error: 'At least one recipient or group is required' }, { status: 400 });
            }
        }

        let finalRecipients = [...(recipient_emails || [])];

        // If groups specified, get all members in those groups
        if (recipient_groups && recipient_groups.length > 0) {
            for (const groupId of recipient_groups) {
                const assignments = await base44.asServiceRole.entities.MemberGroupAssignment.filter({
                    group_id: groupId
                });
                const groupMemberEmails = assignments.map(a => a.member_email);
                finalRecipients = [...new Set([...finalRecipients, ...groupMemberEmails])];
            }
        }

        // Remove sender from recipients if present
        finalRecipients = finalRecipients.filter(email => email !== user.email);

        if (finalRecipients.length === 0) {
            return Response.json({ error: 'No valid recipients found' }, { status: 400 });
        }

        // Create thread if needed
        let threadIdToUse = thread_id;
        if (!threadIdToUse) {
            // Create new thread
            const thread = await base44.asServiceRole.entities.MessageThread.create({
                thread_name: subject || 'Conversation',
                participant_emails: [...finalRecipients, user.email],
                participant_names: [user.full_name],
                last_message_date: new Date().toISOString(),
                last_message_preview: message_body.substring(0, 100),
                last_message_sender: user.full_name,
                thread_type: finalRecipients.length === 1 ? 'direct' : 'group',
                unread_count: {}
            });
            threadIdToUse = thread.id;
        }

        // Create the message
        const message = await base44.asServiceRole.entities.InAppMessage.create({
            subject: subject || '(No Subject)',
            message_body,
            sender_email: user.email,
            sender_name: user.full_name,
            sender_role: user.role,
            recipient_emails: finalRecipients,
            recipient_groups: recipient_groups || [],
            message_type: message_type || 'general',
            priority: priority || 'normal',
            attachment_urls: attachment_urls || [],
            related_entity_type,
            related_entity_id,
            sent_date: new Date().toISOString(),
            status: 'sent',
            thread_id: threadIdToUse,
            read_by: []
        });

        // Update thread
        await base44.asServiceRole.entities.MessageThread.update(threadIdToUse, {
            last_message_date: new Date().toISOString(),
            last_message_preview: message_body.substring(0, 100),
            last_message_sender: user.full_name
        });

        // Create in-app notifications for each recipient
        for (const recipientEmail of finalRecipients) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: recipientEmail,
                title: `New message from ${user.full_name}`,
                message: subject || message_body.substring(0, 100),
                type: 'message',
                priority: priority || 'normal',
                related_entity_type: 'InAppMessage',
                related_entity_id: message.id,
                link: '/messages',
                is_read: false
            });
        }

        // Send email notifications if requested
        if (send_email_notification) {
            const settings = await base44.asServiceRole.entities.ChurchSettings.list();
            const churchSettings = settings[0] || {};

            for (const recipientEmail of finalRecipients) {
                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: recipientEmail,
                        from_name: churchSettings.church_name || 'Church',
                        subject: `New Message: ${subject || '(No Subject)'}`,
                        body: `
                            <h2>New Message from ${user.full_name}</h2>
                            <p><strong>Subject:</strong> ${subject || '(No Subject)'}</p>
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                ${message_body.replace(/\n/g, '<br>')}
                            </div>
                            <p><a href="${Deno.env.get('BASE44_APP_URL') || ''}/messages" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:600;">
                                View in App
                            </a></p>
                            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
                            <p style="font-size: 12px; color: #6b7280;">
                                Msg & data rates may apply. Reply STOP to opt out. Text HELP for assistance.
                            </p>
                        `
                    });
                } catch (emailError) {
                    console.error(`Failed to send email to ${recipientEmail}:`, emailError);
                }
            }
        }

        return Response.json({
            success: true,
            message_id: message.id,
            thread_id: threadIdToUse,
            recipients_count: finalRecipients.length,
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return Response.json({ 
            error: error.message || 'Failed to send message' 
        }, { status: 500 });
    }
});