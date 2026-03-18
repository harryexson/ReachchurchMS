import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const { donation_id, donation_data } = await req.json();

        // CRITICAL: Get church settings for THIS specific church using church_admin_email for proper data isolation
        const churchAdminEmail = donation_data.church_admin_email;
        
        if (!churchAdminEmail) {
            console.error('❌ No church_admin_email in donation data - cannot load church settings');
            return Response.json({
                error: 'Missing church association'
            }, { status: 400 });
        }
        
        const settingsList = await base44.asServiceRole.entities.ChurchSettings.filter({
            church_admin_email: churchAdminEmail
        });
        const settings = settingsList[0] || {};

        const churchName = settings.church_name || 'Church';
        const logoUrl = settings.logo_url || '';
        const primaryColor = settings.primary_color || '#3b82f6';
        const receiptSubject = settings.receipt_template_subject || 'Thank You for Your Generous Donation!';
        const receiptHeader = (settings.receipt_template_header || 'Thank you for your generous donation to {church_name}. Your support helps us continue our mission and ministry.').replace('{church_name}', churchName);
        const receiptFooter = settings.receipt_template_footer || 'This receipt is for tax purposes. Please retain for your records. No goods or services were provided in exchange for this donation.';
        const taxId = settings.receipt_tax_id || '';
        const address = settings.receipt_address || '';

        // Format donation type
        const donationType = (donation_data.donation_type || 'offering').replace(/_/g, ' ');
        const capitalizedType = donationType.charAt(0).toUpperCase() + donationType.slice(1);

        // Format date
        const donationDate = new Date(donation_data.donation_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create receipt HTML
        const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, ${primaryColor} 0%, #10b981 100%);
            color: white;
            border-radius: 8px 8px 0 0;
        }
        .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 15px;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .receipt-box {
            background: #f9fafb;
            border: 2px solid ${primaryColor};
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .receipt-row:last-child {
            border-bottom: none;
        }
        .receipt-label {
            font-weight: bold;
            color: #6b7280;
        }
        .receipt-value {
            color: #111827;
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: ${primaryColor};
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-radius: 0 0 8px 8px;
        }
        .tax-notice {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="${churchName}" class="logo">` : ''}
        <h1 style="margin: 0;">${churchName}</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Donation Receipt</p>
    </div>
    
    <div class="content">
        <p style="font-size: 18px; margin-bottom: 20px;">Dear ${donation_data.donor_name},</p>
        
        <p>${receiptHeader}</p>
        
        <div class="amount">$${donation_data.amount.toFixed(2)}</div>
        
        <div class="receipt-box">
            <div class="receipt-row">
                <span class="receipt-label">Receipt Number:</span>
                <span class="receipt-value">#${donation_id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Donation Date:</span>
                <span class="receipt-value">${donationDate}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Donation Type:</span>
                <span class="receipt-value">${capitalizedType}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Payment Method:</span>
                <span class="receipt-value">${donation_data.payment_method === 'credit_card' ? 'Credit Card' : donation_data.payment_method}</span>
            </div>
            ${donation_data.recurring ? `
            <div class="receipt-row">
                <span class="receipt-label">Recurring:</span>
                <span class="receipt-value">Yes (${donation_data.recurring_frequency || 'Monthly'})</span>
            </div>
            ` : ''}
        </div>
        
        ${donation_data.tax_deductible ? `
        <div class="tax-notice">
            <strong>📋 Tax Information:</strong><br>
            This donation is tax-deductible to the extent allowed by law. Please retain this receipt for your tax records.
            ${taxId ? `<br>Tax ID/EIN: ${taxId}` : ''}
        </div>
        ` : ''}
        
        ${address ? `
        <p style="margin-top: 30px;">
            <strong>${churchName}</strong><br>
            ${address.replace(/\n/g, '<br>')}
        </p>
        ` : ''}
        
        <p style="margin-top: 30px; font-style: italic; color: #6b7280;">
            ${receiptFooter}
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0;">This is an official donation receipt from ${churchName}</p>
        <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
    </div>
</body>
</html>
        `;

        // Generate PDF receipt
        let pdfUrl = null;
        try {
            const pdfResponse = await base44.asServiceRole.functions.invoke('generateReceiptPDF', {
                donation_data: donation_data,
                church_settings: settings
            });

            if (pdfResponse.data) {
                // Upload PDF to storage
                const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
                const fileName = `receipt-${donation_data.receipt_number || donation_id}.pdf`;
                
                const uploadResponse = await base44.asServiceRole.integrations.Core.UploadFile({
                    file: pdfBlob,
                    filename: fileName
                });
                
                pdfUrl = uploadResponse.file_url;
            }
        } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            // Continue with email even if PDF fails
        }

        // Send receipt email with PDF attachment
        const emailData = {
            to: donation_data.donor_email,
            subject: receiptSubject,
            body: receiptHtml
        };

        if (pdfUrl) {
            emailData.attachments = [{
                filename: `receipt-${donation_data.receipt_number || donation_id}.pdf`,
                url: pdfUrl
            }];
        }

        await base44.asServiceRole.integrations.Core.SendEmail(emailData);

        // Update donation record
        if (donation_id) {
            const updateData = {
                receipt_sent: true,
                receipt_sent_date: new Date().toISOString().split('T')[0]
            };
            
            if (pdfUrl) {
                updateData.receipt_pdf_url = pdfUrl;
            }
            
            await base44.asServiceRole.entities.Donation.update(donation_id, updateData);
        }

        return Response.json({
            success: true,
            message: 'Receipt sent successfully',
            pdf_url: pdfUrl
        });

    } catch (error) {
        console.error('Receipt error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});