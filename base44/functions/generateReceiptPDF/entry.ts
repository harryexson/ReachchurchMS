import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { donation_data, church_settings } = await req.json();

        const churchName = church_settings.church_name || 'Church';
        const primaryColor = church_settings.primary_color || '#3b82f6';
        const logoUrl = church_settings.logo_url || '';
        const receiptHeader = (church_settings.receipt_template_header || 'Thank you for your generous donation').replace('{church_name}', churchName);
        const receiptFooter = church_settings.receipt_template_footer || 'This receipt is for tax purposes.';
        const taxId = church_settings.receipt_tax_id || '';
        const address = church_settings.receipt_address || '';

        // Create PDF
        const doc = new jsPDF();

        // Add header
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text(churchName, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('DONATION RECEIPT', 105, 30, { align: 'center' });

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Receipt details
        let yPos = 55;
        
        doc.setFontSize(16);
        doc.text(`Dear ${donation_data.donor_name},`, 20, yPos);
        
        yPos += 15;
        doc.setFontSize(11);
        const headerLines = doc.splitTextToSize(receiptHeader, 170);
        doc.text(headerLines, 20, yPos);
        yPos += headerLines.length * 7 + 10;

        // Amount box
        doc.setFillColor(249, 250, 251);
        doc.rect(20, yPos, 170, 30, 'F');
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(2);
        doc.rect(20, yPos, 170, 30);
        
        doc.setFontSize(28);
        doc.setTextColor(59, 130, 246);
        doc.text(`$${donation_data.amount.toFixed(2)}`, 105, yPos + 20, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        
        yPos += 45;

        // Receipt details box
        doc.setFontSize(10);
        doc.setFillColor(249, 250, 251);
        doc.rect(20, yPos, 170, 60, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.rect(20, yPos, 170, 60);

        yPos += 10;
        const receiptDetails = [
            [`Receipt Number:`, donation_data.receipt_number || 'N/A'],
            [`Donation Date:`, new Date(donation_data.donation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            [`Donation Type:`, (donation_data.donation_type || 'offering').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
            [`Payment Method:`, donation_data.payment_method === 'credit_card' ? 'Credit Card' : donation_data.payment_method]
        ];

        if (donation_data.recurring) {
            receiptDetails.push([`Recurring:`, `Yes (${donation_data.recurring_frequency || 'Monthly'})`]);
        }

        receiptDetails.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 25, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(value, 105, yPos);
            yPos += 10;
        });

        yPos += 10;

        // Tax notice
        if (donation_data.tax_deductible) {
            doc.setFillColor(254, 243, 199);
            doc.rect(20, yPos, 170, 25, 'F');
            doc.setDrawColor(245, 158, 11);
            doc.setLineWidth(2);
            doc.line(20, yPos, 20, yPos + 25);
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('TAX INFORMATION:', 25, yPos + 8);
            doc.setFont(undefined, 'normal');
            doc.text('This donation is tax-deductible to the extent allowed by law.', 25, yPos + 14);
            if (taxId) {
                doc.text(`Tax ID/EIN: ${taxId}`, 25, yPos + 20);
            }
            yPos += 35;
        }

        // Church address
        if (address) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(churchName, 20, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');
            const addressLines = address.split('\n');
            addressLines.forEach(line => {
                doc.text(line, 20, yPos);
                yPos += 5;
            });
            yPos += 5;
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const footerLines = doc.splitTextToSize(receiptFooter, 170);
        doc.text(footerLines, 20, yPos);
        yPos += footerLines.length * 5 + 10;

        doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 280, { align: 'center' });

        // Generate PDF as buffer
        const pdfBuffer = doc.output('arraybuffer');

        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="receipt-${donation_data.receipt_number || 'donation'}.pdf"`
            }
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});