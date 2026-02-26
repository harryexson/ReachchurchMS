import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@4.2.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { format = 'pdf', startDate, endDate, groupBy = 'donor' } = body;

        // Fetch donations
        let donations = await base44.asServiceRole.entities.Donation.list('-donation_date');

        // Filter by date range
        if (startDate || endDate) {
            donations = donations.filter(d => {
                const date = new Date(d.donation_date);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }

        if (format === 'csv') {
            // Generate CSV
            const headers = ['Date', 'Donor Name', 'Donor Email', 'Amount', 'Type', 'Payment Method', 'Tax Deductible'];
            const rows = donations.map(d => [
                d.donation_date || '',
                d.donor_name || '',
                d.donor_email || '',
                d.amount || 0,
                d.donation_type || '',
                d.payment_method || '',
                d.tax_deductible ? 'Yes' : 'No'
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            return new Response(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=giving-report-${new Date().toISOString().split('T')[0]}.csv`
                }
            });
        }

        // Generate PDF
        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(20);
        doc.text('Giving Report', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
        yPos += 5;
        if (startDate || endDate) {
            doc.text(`Period: ${startDate || 'Beginning'} to ${endDate || 'Present'}`, 20, yPos);
            yPos += 5;
        }
        doc.text(`Total Donations: ${donations.length}`, 20, yPos);
        yPos += 10;

        // Summary
        const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
        const avgDonation = donations.length > 0 ? totalAmount / donations.length : 0;

        doc.setFontSize(12);
        doc.text('Summary', 20, yPos);
        yPos += 6;

        doc.setFontSize(9);
        doc.text(`Total Amount: $${totalAmount.toLocaleString()}`, 25, yPos);
        yPos += 5;
        doc.text(`Average Donation: $${avgDonation.toFixed(2)}`, 25, yPos);
        yPos += 5;
        doc.text(`Number of Donors: ${new Set(donations.map(d => d.donor_email)).size}`, 25, yPos);
        yPos += 10;

        // By Type
        doc.setFontSize(12);
        doc.text('Giving by Type', 20, yPos);
        yPos += 6;

        const byType = {};
        donations.forEach(d => {
            const type = d.donation_type || 'other';
            byType[type] = (byType[type] || 0) + (d.amount || 0);
        });

        doc.setFontSize(9);
        Object.entries(byType).forEach(([type, amount]) => {
            doc.text(`  ${type.replace('_', ' ')}: $${amount.toLocaleString()}`, 25, yPos);
            yPos += 5;
        });
        yPos += 10;

        // By Payment Method
        doc.setFontSize(12);
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.text('Giving by Payment Method', 20, yPos);
        yPos += 6;

        const byMethod = {};
        donations.forEach(d => {
            const method = d.payment_method || 'other';
            byMethod[method] = (byMethod[method] || 0) + (d.amount || 0);
        });

        doc.setFontSize(9);
        Object.entries(byMethod).forEach(([method, amount]) => {
            doc.text(`  ${method.replace('_', ' ')}: $${amount.toLocaleString()}`, 25, yPos);
            yPos += 5;
        });
        yPos += 10;

        // Top Donors
        if (groupBy === 'donor') {
            const donorTotals = {};
            donations.forEach(d => {
                const donor = d.donor_email || 'Anonymous';
                donorTotals[donor] = (donorTotals[donor] || 0) + (d.amount || 0);
            });

            const topDonors = Object.entries(donorTotals)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20);

            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(12);
            doc.text('Top 20 Donors', 20, yPos);
            yPos += 6;

            doc.setFontSize(8);
            topDonors.forEach(([donor, amount], index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                const donorName = donations.find(d => d.donor_email === donor)?.donor_name || donor;
                doc.text(`${index + 1}. ${donorName}: $${amount.toLocaleString()}`, 25, yPos);
                yPos += 5;
            });
        }

        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
            doc.text('REACH ChurchConnect - Giving Report', 20, 285);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=giving-report-${new Date().toISOString().split('T')[0]}.pdf`
            }
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});