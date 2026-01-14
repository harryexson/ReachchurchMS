import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This is an admin-only scheduled task
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const currentYear = new Date().getFullYear() - 1; // Previous year for year-end statements
        
        console.log(`🎄 Starting year-end statement generation for ${currentYear}...`);

        // Get church settings
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchSettings = settings[0] || {};

        // Get all donations from previous year, grouped by donor
        const allDonations = await base44.asServiceRole.entities.Donation.filter({
            tax_deductible: true
        });

        // Filter for the year
        const yearDonations = allDonations.filter(d => {
            return new Date(d.donation_date).getFullYear() === currentYear;
        });

        console.log(`📊 Found ${yearDonations.length} tax-deductible donations for ${currentYear}`);

        // Group by donor email
        const donorGroups = {};
        yearDonations.forEach(donation => {
            const email = donation.donor_email;
            if (!donorGroups[email]) {
                donorGroups[email] = [];
            }
            donorGroups[email].push(donation);
        });

        console.log(`👥 Processing ${Object.keys(donorGroups).length} unique donors...`);

        let successCount = 0;
        let errorCount = 0;

        // Generate and send statement for each donor
        for (const [donorEmail, donations] of Object.entries(donorGroups)) {
            try {
                // Generate statement
                const statementResult = await base44.asServiceRole.functions.invoke('generateGivingStatement', {
                    donor_email: donorEmail,
                    statement_year: currentYear,
                    statement_type: 'year_end'
                });

                if (!statementResult.data?.pdf_url) {
                    throw new Error('Failed to generate PDF');
                }

                // Send email with statement
                const donor = donations[0];
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: donorEmail,
                    from_name: churchSettings.church_name || 'Your Church',
                    subject: `${currentYear} Year End Giving Statement (Tax Deductible Annual Statement)`,
                    body: `
                        <h2>Year End Giving Statement - ${currentYear}</h2>
                        <p>Dear ${donor.donor_name},</p>
                        
                        <p>Thank you for your faithful giving and generosity throughout ${currentYear}. 
                        Your support has made a significant impact in our church and community.</p>
                        
                        <p><strong>Total Tax-Deductible Donations for ${currentYear}: $${statementResult.data.total_amount.toFixed(2)}</strong></p>
                        
                        <p>Please find your complete Year End Giving Statement attached to this email. 
                        This statement is for your tax records and includes all tax-deductible donations you made to 
                        ${churchSettings.church_name || 'our church'} during the ${currentYear} calendar year.</p>
                        
                        <p><a href="${statementResult.data.pdf_url}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:600;">
                            Download Your Statement
                        </a></p>
                        
                        <p><strong>Important Tax Information:</strong></p>
                        <ul>
                            <li>No goods or services were provided in exchange for your contributions</li>
                            <li>Please retain this statement for your tax records</li>
                            <li>Consult your tax advisor for specific guidance on deductibility</li>
                        </ul>
                        
                        <p>If you have any questions about your statement, please don't hesitate to contact us.</p>
                        
                        <p>God bless you,<br>
                        ${churchSettings.church_name || 'Church Leadership'}</p>
                        
                        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; color: #6b7280;">
                            Msg & data rates may apply. Reply STOP to opt out. Text HELP for assistance.
                        </p>
                    `
                });

                // Update statement record as sent
                await base44.asServiceRole.entities.DonationStatement.update(statementResult.data.statement_id, {
                    sent_via: 'email',
                    sent_date: new Date().toISOString().split('T')[0]
                });

                successCount++;
                console.log(`✅ Sent statement to ${donorEmail}`);

            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to send statement to ${donorEmail}:`, error.message);
            }
        }

        console.log(`✨ Year-end statement generation complete!`);
        console.log(`   ✅ Successfully sent: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

        return Response.json({
            success: true,
            year: currentYear,
            total_donors: Object.keys(donorGroups).length,
            statements_sent: successCount,
            errors: errorCount,
            message: 'Year-end statements generated and sent'
        });

    } catch (error) {
        console.error('Error in year-end statement generation:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate year-end statements' 
        }, { status: 500 });
    }
});