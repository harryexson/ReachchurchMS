import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { to, from_name, subject, body: emailBody } = body;

        // Validate email address - reject temporary/fake emails
        if (!to || !to.includes('@') || to.includes('@temp.') || to.includes('@visitor.temp') || to.startsWith('sms_')) {
            console.log('Rejected invalid/temporary email:', to);
            return Response.json({ 
                success: false,
                error: 'Invalid Email Address',
                details: 'This visitor does not have a valid email address. They may have been registered via SMS only. Please contact them by phone or text instead.',
                is_temp_email: true
            }, { status: 400 });
        }

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        
        if (!resendApiKey) {
            return Response.json({ 
                error: 'Email service not configured',
                details: 'RESEND_API_KEY environment variable is not set.'
            }, { status: 500 });
        }

        console.log('Attempting to send email via Resend:', {
            to,
            from_name,
            subject_length: subject.length
        });

        // Send email via Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `${from_name} <onboarding@resend.dev>`,
                to: [to],
                subject: subject,
                text: emailBody
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', result);
            
            // Special handling for domain verification error
            if (result.statusCode === 403 && result.message?.includes('verify a domain')) {
                return Response.json({ 
                    success: false,
                    error: 'Domain Verification Required',
                    details: `📧 SETUP NEEDED: Your Resend account is in testing mode.

To send emails to church members and visitors:

1. Go to https://resend.com/domains
2. Click "Add Domain" 
3. Add your church domain (e.g., reachchurch.org)
4. Follow DNS setup instructions
5. Once verified, update the 'from' email in Settings

For now, test emails will only be sent to: ${user.email}

Need help? This is a one-time setup that takes about 5 minutes.`,
                    action_required: 'domain_verification',
                    resend_error: result
                }, { status: 403 });
            }
            
            return Response.json({ 
                success: false,
                error: 'Failed to send email',
                details: result.message || 'Unknown error from email service',
                resend_error: result
            }, { status: response.status });
        }

        console.log('Email sent successfully:', result.id);

        return Response.json({ 
            success: true,
            message: 'Email sent successfully',
            email_id: result.id
        });

    } catch (error) {
        console.error('Email sending error:', error);
        return Response.json({ 
            success: false,
            error: 'Failed to send email',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});