import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== YEAR-END TAX STATEMENTS =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            console.error(`[${requestId}] ❌ Unauthorized access attempt`);
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { year } = body;
        const targetYear = year || new Date().getFullYear();
        
        console.log(`[${requestId}] Generating statements for year: ${targetYear}`);

        // Get all donations for the year
        const yearStart = new Date(targetYear, 0, 1).toISOString();
        const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59).toISOString();
        
        const allDonations = await base44.asServiceRole.entities.Donation.list('-donation_date', 10000);
        
        const yearDonations = allDonations.filter(d => {
            const donationDate = new Date(d.donation_date);
            const yearStartDate = new Date(targetYear, 0, 1);
            const yearEndDate = new Date(targetYear, 11, 31, 23, 59, 59);
            return donationDate >= yearStartDate && 
                   donationDate <= yearEndDate && 
                   d.tax_deductible !== false;
        });

        console.log(`[${requestId}] Found ${yearDonations.length} tax-deductible donations`);

        // Group by donor email
        const donorMap = {};
        yearDonations.forEach(donation => {
            const key = donation.donor_email.toLowerCase();
            if (!donorMap[key]) {
                donorMap[key] = {
                    donor_name: donation.donor_name,
                    donor_email: donation.donor_email,
                    donor_address: donation.donor_address || '',
                    donations: []
                };
            }
            donorMap[key].donations.push(donation);
        });

        console.log(`[${requestId}] Found ${Object.keys(donorMap).length} unique donors`);

        let successCount = 0;
        let failCount = 0;

        // Generate and send statement for each donor
        for (const [email, donorData] of Object.entries(donorMap)) {
            try {
                const totalAmount = donorData.donations.reduce((sum, d) => sum + (d.amount || 0), 0);
                
                const breakdown = donorData.donations.map(d => ({
                    date: d.donation_date,
                    amount: d.amount,
                    type: d.donation_type,
                    payment_method: d.payment_method
                }));

                // Check if statement already exists
                const existingStatements = await base44.asServiceRole.entities.DonationStatement.filter({
                    donor_email: email,
                    statement_year: targetYear
                });

                let statementId;
                if (existingStatements.length > 0) {
                    // Update existing
                    await base44.asServiceRole.entities.DonationStatement.update(existingStatements[0].id, {
                        total_amount: totalAmount,
                        donation_count: donorData.donations.length,
                        donation_breakdown: breakdown,
                        statement_date: new Date().toISOString().split('T')[0]
                    });
                    statementId = existingStatements[0].id;
                } else {
                    // Create new
                    const newStatement = await base44.asServiceRole.entities.DonationStatement.create({
                        statement_year: targetYear,
                        donor_name: donorData.donor_name,
                        donor_email: donorData.donor_email,
                        donor_address: donorData.donor_address,
                        total_amount: totalAmount,
                        donation_count: donorData.donations.length,
                        donation_breakdown: breakdown,
                        statement_date: new Date().toISOString().split('T')[0],
                        sent_via: 'not_sent'
                    });
                    statementId = newStatement.id;
                }

                // Send email
                // Format donation type for display
                const formatDonationType = (type) => {
                    return (type || 'offering')
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                };

                // Group donations by type for summary
                const typeBreakdown = {};
                donorData.donations.forEach(d => {
                    const type = d.donation_type || 'offering';
                    if (!typeBreakdown[type]) {
                        typeBreakdown[type] = { count: 0, total: 0 };
                    }
                    typeBreakdown[type].count++;
                    typeBreakdown[type].total += d.amount;
                });

                const emailBody = `Dear ${donorData.donor_name},

Thank you for your generous support throughout ${targetYear}! Your partnership in ministry has made a significant impact.

TOTAL TAX-DEDUCTIBLE DONATIONS FOR ${targetYear}: $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}

This statement includes all ${donorData.donations.length} tax-deductible donation(s) made to our church during the ${targetYear} calendar year.

GIVING BY CATEGORY:
${Object.entries(typeBreakdown).map(([type, data]) => 
    `- ${formatDonationType(type)}: $${data.total.toFixed(2)} (${data.count} gift${data.count !== 1 ? 's' : ''})`
).join('\n')}

DETAILED TRANSACTION HISTORY:
${breakdown.map(d => 
    `${new Date(d.date).toLocaleDateString()} - ${formatDonationType(d.type)}: $${d.amount.toFixed(2)} (${d.payment_method})`
).join('\n')}

IMPORTANT TAX INFORMATION:
- EIN: [Your Church Tax ID]
- Tax-exempt status: 501(c)(3)
- No goods or services were provided in exchange for these donations
- Please retain this statement for your tax records

If you have any questions about this statement, please contact us.

Your generosity enables us to fulfill our mission and serve our community. Thank you for your faithful partnership!

God bless you,
Church Administration

---
This is an official tax donation statement for the ${targetYear} calendar year.`;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: donorData.donor_email,
                    subject: `${targetYear} Tax Donation Statement`,
                    body: emailBody
                });

                // Update statement as sent
                await base44.asServiceRole.entities.DonationStatement.update(statementId, {
                    sent_via: 'email',
                    sent_date: new Date().toISOString().split('T')[0]
                });

                // Mark donations as included
                for (const donation of donorData.donations) {
                    await base44.asServiceRole.entities.Donation.update(donation.id, { 
                        included_in_statement: true 
                    });
                }

                console.log(`[${requestId}] ✅ Sent statement to ${donorData.donor_email}`);
                successCount++;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`[${requestId}] ❌ Failed for ${email}:`, error.message);
                failCount++;
            }
        }

        console.log(`[${requestId}] ===== COMPLETED =====`);
        console.log(`[${requestId}] Success: ${successCount}, Failed: ${failCount}`);

        return Response.json({
            success: true,
            year: targetYear,
            total_donors: Object.keys(donorMap).length,
            sent: successCount,
            failed: failCount
        });

    } catch (error) {
        console.error(`[${requestId}] ===== ERROR =====`);
        console.error(`[${requestId}]`, error.message);
        return Response.json({ 
            error: 'Failed to send statements',
            message: error.message 
        }, { status: 500 });
    }
});