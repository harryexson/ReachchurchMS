import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Only admins and authorized finance officers can send financial statements
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { 
            recipient_emails, 
            recipient_groups,
            statement_period,
            statement_type,
            custom_message,
            send_in_app,
            send_email
        } = await req.json();

        let finalRecipients = [...(recipient_emails || [])];

        // If groups specified, get all members
        if (recipient_groups && recipient_groups.length > 0) {
            for (const groupId of recipient_groups) {
                const assignments = await base44.asServiceRole.entities.MemberGroupAssignment.filter({
                    group_id: groupId
                });
                const groupMemberEmails = assignments.map(a => a.member_email);
                finalRecipients = [...new Set([...finalRecipients, ...groupMemberEmails])];
            }
        }

        if (finalRecipients.length === 0) {
            return Response.json({ error: 'No recipients found' }, { status: 400 });
        }

        console.log(`📊 Generating statements for ${finalRecipients.length} recipients...`);

        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchSettings = settings[0] || {};

        let successCount = 0;
        let errorCount = 0;
        const results = [];

        for (const recipientEmail of finalRecipients) {
            try {
                // Generate statement for this recipient
                const statementResult = await base44.asServiceRole.functions.invoke('generateGivingStatement', {
                    donor_email: recipientEmail,
                    statement_year: statement_period?.year,
                    start_date: statement_period?.start_date,
                    end_date: statement_period?.end_date,
                    statement_type: statement_type || 'custom'
                });

                if (!statementResult.data?.pdf_url) {
                    throw new Error('Failed to generate statement');
                }

                // Send in-app message
                if (send_in_app !== false) {
                    await base44.asServiceRole.entities.InAppMessage.create({
                        subject: `Your ${statement_type === 'year_end' ? 'Year-End' : ''} Giving Statement`,
                        message_body: custom_message || `Your giving statement is ready. Total: $${statementResult.data.total_amount.toFixed(2)} (${statementResult.data.donation_count} donations)\n\nDownload your statement using the link below.`,
                        sender_email: user.email,
                        sender_name: user.full_name,
                        sender_role: 'admin',
                        recipient_emails: [recipientEmail],
                        recipient_groups: [],
                        message_type: 'financial_statement',
                        priority: 'high',
                        attachment_urls: [statementResult.data.pdf_url],
                        related_entity_type: 'DonationStatement',
                        related_entity_id: statementResult.data.statement_id,
                        sent_date: new Date().toISOString(),
                        status: 'sent'
                    });

                    // Create notification
                    await base44.asServiceRole.entities.Notification.create({
                        user_email: recipientEmail,
                        title: 'Giving Statement Available',
                        message: 'Your giving statement has been generated',
                        type: 'financial',
                        priority: 'high',
                        related_entity_type: 'DonationStatement',
                        related_entity_id: statementResult.data.statement_id,
                        link: '/my-donations',
                        is_read: false
                    });
                }

                // Send email notification
                if (send_email !== false) {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: recipientEmail,
                        from_name: churchSettings.church_name || 'Church',
                        subject: `Your ${statement_type === 'year_end' ? 'Year-End' : ''} Giving Statement`,
                        body: `
                            <h2>Giving Statement</h2>
                            ${custom_message ? `<p>${custom_message}</p>` : ''}
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Total Donations:</strong> $${statementResult.data.total_amount.toFixed(2)}</p>
                                <p><strong>Number of Donations:</strong> ${statementResult.data.donation_count}</p>
                            </div>
                            <p><a href="${statementResult.data.pdf_url}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:600;">
                                Download Statement (PDF)
                            </a></p>
                            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                                This statement is provided for your tax records.
                            </p>
                            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
                            <p style="font-size: 12px; color: #6b7280;">
                                Msg & data rates may apply. Reply STOP to opt out. Text HELP for assistance.
                            </p>
                        `
                    });
                }

                successCount++;
                results.push({ email: recipientEmail, success: true, statement_id: statementResult.data.statement_id });

            } catch (error) {
                errorCount++;
                results.push({ email: recipientEmail, success: false, error: error.message });
                console.error(`Failed for ${recipientEmail}:`, error.message);
            }
        }

        return Response.json({
            success: true,
            total_recipients: finalRecipients.length,
            statements_sent: successCount,
            errors: errorCount,
            results
        });

    } catch (error) {
        console.error('Error sending financial statements:', error);
        return Response.json({ 
            error: error.message || 'Failed to send financial statements' 
        }, { status: 500 });
    }
});