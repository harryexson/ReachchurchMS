import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { donations, filters } = await req.json();

        const doc = new jsPDF();
        let y = 20;

        // Title
        doc.setFontSize(20);
        doc.text('Financial Report', 20, y);
        y += 10;

        // Report metadata
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
        y += 6;
        doc.text(`Period: ${filters.dateFrom} to ${filters.dateTo}`, 20, y);
        y += 10;

        // Summary stats
        const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
        const uniqueDonors = new Set(donations.map(d => d.donor_email)).size;

        doc.setFontSize(12);
        doc.text('Summary', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.text(`Total Donations: $${totalAmount.toLocaleString()}`, 25, y);
        y += 6;
        doc.text(`Number of Transactions: ${donations.length}`, 25, y);
        y += 6;
        doc.text(`Unique Donors: ${uniqueDonors}`, 25, y);
        y += 10;

        // Category breakdown
        const categoryMap = {};
        donations.forEach(d => {
            const type = d.donation_type || 'other';
            if (!categoryMap[type]) {
                categoryMap[type] = { total: 0, count: 0 };
            }
            categoryMap[type].total += d.amount;
            categoryMap[type].count++;
        });

        doc.setFontSize(12);
        doc.text('By Category', 20, y);
        y += 8;
        doc.setFontSize(10);

        Object.entries(categoryMap).forEach(([type, data]) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const formatted = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            doc.text(`${formatted}: $${data.total.toLocaleString()} (${data.count} gifts)`, 25, y);
            y += 6;
        });

        y += 10;

        // Transaction details
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.text('Transaction Details', 20, y);
        y += 8;
        doc.setFontSize(8);

        // Table header
        doc.text('Date', 20, y);
        doc.text('Donor', 45, y);
        doc.text('Type', 100, y);
        doc.text('Amount', 140, y);
        y += 5;

        // Table rows
        donations.slice(0, 100).forEach(d => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            
            const formatted = (d.donation_type || 'other').replace(/_/g, ' ');
            doc.text(d.donation_date, 20, y);
            doc.text(d.donor_name.substring(0, 25), 45, y);
            doc.text(formatted.substring(0, 20), 100, y);
            doc.text(`$${d.amount.toFixed(2)}`, 140, y);
            y += 5;
        });

        if (donations.length > 100) {
            y += 5;
            doc.text(`... and ${donations.length - 100} more transactions`, 20, y);
        }

        const pdfBytes = doc.output('arraybuffer');

        return Response.json({
            success: true,
            pdf_data: Array.from(new Uint8Array(pdfBytes))
        });

    } catch (error) {
        console.error('PDF export error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});