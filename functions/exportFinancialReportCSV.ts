import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { donations, filters } = await req.json();

        // CSV header
        const headers = [
            'Date',
            'Donor Name',
            'Email',
            'Phone',
            'Address',
            'Amount',
            'Type',
            'Payment Method',
            'Recurring',
            'Tax Deductible',
            'Member ID'
        ];

        // CSV rows
        const rows = donations.map(d => [
            d.donation_date,
            d.donor_name,
            d.donor_email,
            d.donor_phone || '',
            d.donor_address || '',
            d.amount.toFixed(2),
            (d.donation_type || 'other').replace(/_/g, ' '),
            d.payment_method || '',
            d.recurring ? 'Yes' : 'No',
            d.tax_deductible ? 'Yes' : 'No',
            d.member_id || ''
        ]);

        // Build CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return Response.json({
            success: true,
            csv_data: csvContent
        });

    } catch (error) {
        console.error('CSV export error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});