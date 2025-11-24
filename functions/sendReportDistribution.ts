import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { recipients, subject, message, reportUrl, reportName, from_name } = body;

        if (!recipients || recipients.length === 0) {
            return Response.json({ 
                success: false,
                error: 'No recipients provided' 
            }, { status: 400 });
        }

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        
        if (!resendApiKey) {
            return Response.json({ 
                success: false,
                error: 'Email service not configured',
                details: 'RESEND_API_KEY environment variable is not set.'
            }, { status: 500 });
        }

        let successCount = 0;
        let failedCount = 0;
        const failedEmails = [];

        // Create email body with download link
        const emailBody = `${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Report Download

Click the link below to download the report:
${reportUrl}

Report Name: ${reportName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated message from ${from_name || 'REACH ChurchConnect'}.`;

        // Send to each recipient
        for (const email of recipients) {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: `${from_name || 'REACH ChurchConnect'} <onboarding@resend.dev>`,
                        to: [email],
                        subject: subject,
                        text: emailBody
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    successCount++;
                } else {
                    failedCount++;
                    failedEmails.push({ email, error: result.message });
                    console.error(`Failed to send to ${email}:`, result);
                }
            } catch (error) {
                failedCount++;
                failedEmails.push({ email, error: error.message });
                console.error(`Error sending to ${email}:`, error);
            }
        }

        return Response.json({ 
            success: successCount > 0,
            sent: successCount,
            failed: failedCount,
            failedEmails: failedEmails,
            message: `Successfully sent to ${successCount} recipient${successCount !== 1 ? 's' : ''}${failedCount > 0 ? `, ${failedCount} failed` : ''}`
        });

    } catch (error) {
        console.error('Report distribution error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});