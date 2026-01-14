import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { donor_email, start_date, end_date, statement_year, statement_type } = await req.json();

        // Use requesting user's email if not provided (for members generating their own)
        const targetEmail = donor_email || user.email;

        // Validate user can only generate their own statements (unless admin)
        if (user.role !== 'admin' && targetEmail !== user.email) {
            return Response.json({ error: 'Unauthorized to generate statements for other users' }, { status: 403 });
        }

        // Get church settings for header info
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchSettings = settings[0] || { church_name: 'Church' };

        // Build query for donations
        let query = { donor_email: targetEmail, tax_deductible: true };

        // Filter by date range
        const donations = await base44.asServiceRole.entities.Donation.filter(query);
        
        let filteredDonations = donations;
        if (start_date && end_date) {
            filteredDonations = donations.filter(d => {
                const donationDate = new Date(d.donation_date);
                return donationDate >= new Date(start_date) && donationDate <= new Date(end_date);
            });
        } else if (statement_year) {
            filteredDonations = donations.filter(d => {
                return new Date(d.donation_date).getFullYear() === parseInt(statement_year);
            });
        }

        if (filteredDonations.length === 0) {
            return Response.json({ 
                error: 'No donations found for the specified period',
                donation_count: 0 
            }, { status: 404 });
        }

        // Sort by date
        filteredDonations.sort((a, b) => new Date(a.donation_date) - new Date(b.donation_date));

        // Calculate totals and breakdown by category
        const totalAmount = filteredDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
        const categoryBreakdown = {};
        
        filteredDonations.forEach(d => {
            const type = d.donation_type || 'offering';
            categoryBreakdown[type] = (categoryBreakdown[type] || 0) + d.amount;
        });

        // Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;

        // Header with church info
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(churchSettings.church_name || 'Church', margin, 25);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        if (churchSettings.receipt_address) {
            doc.text(churchSettings.receipt_address, margin, 32);
        }
        if (churchSettings.receipt_tax_id) {
            doc.text(`Tax ID: ${churchSettings.receipt_tax_id}`, margin, 38);
        }

        // Statement Title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        const statementTitle = statement_type === 'year_end' 
            ? `Year End Giving Statement (Tax Deductible Annual Statement)`
            : 'Giving Statement';
        doc.text(statementTitle, margin, 55);

        // Date range
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const startDateStr = start_date 
            ? new Date(start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : statement_year ? `January 1, ${statement_year}` : 'All Time';
        const endDateStr = end_date 
            ? new Date(end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : statement_year ? `December 31, ${statement_year}` : 'Present';
        doc.text(`Period: ${startDateStr} - ${endDateStr}`, margin, 62);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, 68);

        // Donor Info
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Donor Information:', margin, 80);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(filteredDonations[0].donor_name || user.full_name, margin, 86);
        doc.text(targetEmail, margin, 92);
        if (filteredDonations[0].donor_address) {
            doc.text(filteredDonations[0].donor_address, margin, 98);
        }

        // Total Summary Box
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, 108, pageWidth - 2 * margin, 25, 'F');
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Total Tax-Deductible Donations:', margin + 5, 118);
        doc.setFontSize(18);
        doc.setTextColor(0, 128, 0);
        doc.text(`$${totalAmount.toFixed(2)}`, margin + 5, 128);
        doc.setTextColor(0, 0, 0);

        // Category Breakdown
        let yPos = 145;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Breakdown by Category:', margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        for (const [category, amount] of Object.entries(categoryBreakdown)) {
            const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            doc.text(`${categoryName}: $${amount.toFixed(2)}`, margin + 5, yPos);
            yPos += 6;
        }

        // Detailed Transaction List
        yPos += 10;
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Transaction History:', margin, yPos);
        yPos += 8;

        // Table headers
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Date', margin, yPos);
        doc.text('Type', margin + 35, yPos);
        doc.text('Method', margin + 80, yPos);
        doc.text('Amount', margin + 120, yPos);
        doc.text('Receipt #', margin + 150, yPos);
        yPos += 5;

        // Draw header line
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // Transaction rows
        doc.setFont(undefined, 'normal');
        filteredDonations.forEach((donation) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            const date = new Date(donation.donation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const type = (donation.donation_type || 'offering').replace(/_/g, ' ');
            const method = (donation.payment_method || 'N/A').replace(/_/g, ' ');
            const amount = `$${donation.amount.toFixed(2)}`;
            const receipt = donation.receipt_number || 'N/A';

            doc.text(date, margin, yPos);
            doc.text(type, margin + 35, yPos, { maxWidth: 40 });
            doc.text(method, margin + 80, yPos, { maxWidth: 35 });
            doc.text(amount, margin + 120, yPos);
            doc.text(receipt, margin + 150, yPos, { maxWidth: 40 });
            yPos += 6;
        });

        // Footer disclaimer
        yPos += 10;
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(100, 100, 100);
        const disclaimer = churchSettings.receipt_template_footer || 
            'This statement is provided for your tax records. No goods or services were provided in exchange for these donations. ' +
            'Please consult your tax advisor for specific tax deduction guidance. Keep this statement for your records.';
        doc.text(disclaimer, margin, yPos, { maxWidth: pageWidth - 2 * margin });

        // Convert to buffer
        const pdfBytes = doc.output('arraybuffer');
        const buffer = new Uint8Array(pdfBytes);

        // Upload PDF
        const fileName = `giving-statement-${targetEmail}-${Date.now()}.pdf`;
        const pdfBlob = new Blob([buffer], { type: 'application/pdf' });
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });

        // Create statement record
        const statementRecord = await base44.asServiceRole.entities.DonationStatement.create({
            statement_year: statement_year || new Date().getFullYear(),
            donor_name: filteredDonations[0].donor_name || user.full_name,
            donor_email: targetEmail,
            donor_address: filteredDonations[0].donor_address || '',
            total_amount: totalAmount,
            donation_count: filteredDonations.length,
            statement_date: new Date().toISOString().split('T')[0],
            donation_breakdown: filteredDonations.map(d => ({
                date: d.donation_date,
                amount: d.amount,
                type: d.donation_type,
                payment_method: d.payment_method
            })),
            statement_pdf_url: uploadResult.file_url,
            sent_via: 'not_sent'
        });

        return Response.json({
            success: true,
            pdf_url: uploadResult.file_url,
            statement_id: statementRecord.id,
            total_amount: totalAmount,
            donation_count: filteredDonations.length,
            category_breakdown: categoryBreakdown,
            message: 'Msg & data rates may apply. Reply STOP to opt out. Text HELP for assistance.'
        });

    } catch (error) {
        console.error('Error generating statement:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate giving statement' 
        }, { status: 500 });
    }
});