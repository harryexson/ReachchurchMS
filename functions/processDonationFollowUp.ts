import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event } = await req.json();
        
        if (event.type !== 'create') {
            return Response.json({ success: true, message: 'Only processing new donations' });
        }

        const donationId = event.entity_id;
        
        // Get donation details
        const donations = await base44.asServiceRole.entities.Donation.filter({ id: donationId });
        if (donations.length === 0) {
            return Response.json({ error: 'Donation not found' }, { status: 404 });
        }
        
        const donation = donations[0];
        console.log(`Processing follow-up for donation ${donation.receipt_number}`);
        
        // Get church settings for branding and reply-to
        const churchSettings = await base44.asServiceRole.entities.ChurchSettings.filter({
            created_by: donation.created_by
        });
        const churchName = churchSettings.length > 0 ? churchSettings[0].church_name : 'Our Church';
        const autoSendReceipts = churchSettings.length > 0 ? churchSettings[0].auto_send_receipts : true;
        
        // Determine follow-up type based on donation amount and frequency
        const amount = donation.amount;
        let followUpType = 'standard';
        
        if (amount >= 1000) {
            followUpType = 'major_gift';
        } else if (amount >= 500) {
            followUpType = 'significant_gift';
        } else if (donation.recurring) {
            followUpType = 'recurring_donor';
        }
        
        // Check if this is a first-time donor
        const previousDonations = await base44.asServiceRole.entities.Donation.filter({
            donor_email: donation.donor_email,
            created_by: donation.created_by
        });
        const isFirstTime = previousDonations.length === 1;
        
        // Send thank you email
        if (donation.donor_email) {
            let thankYouMessage = '';
            let subject = '';
            
            if (isFirstTime) {
                subject = `Thank You for Your First Gift to ${churchName}! 🙏`;
                thankYouMessage = `Dear ${donation.donor_name},

Thank you so much for your generous first gift of $${amount.toFixed(2)} to ${churchName}! 

Your support means the world to us and helps us continue our mission of serving our community and spreading God's love.

We're honored that you've chosen to partner with us in this way. Your contribution will make a real difference in the lives of those we serve.

${donation.tax_deductible ? 'A tax receipt has been sent to you in a separate email for your records.' : ''}

With gratitude,
${churchName} Team`;
            } else if (followUpType === 'major_gift') {
                subject = `Thank You for Your Generous Gift to ${churchName}! 🌟`;
                thankYouMessage = `Dear ${donation.donor_name},

We are deeply grateful for your exceptional generosity! Your gift of $${amount.toFixed(2)} is truly transformational.

Major gifts like yours enable us to expand our ministry, reach more people, and make a lasting impact in our community. We don't take your trust and support lightly.

${donation.donation_type !== 'tithe' && donation.donation_type !== 'offering' ? `Your contribution to ${donation.donation_type.replace(/_/g, ' ')} will directly support this vital ministry.` : ''}

We would love to connect with you personally to share more about how your gift is making a difference. Please feel free to reach out to us anytime.

${donation.tax_deductible ? 'A tax receipt has been sent to you separately for your records.' : ''}

With deep appreciation,
${churchName} Leadership Team`;
            } else if (followUpType === 'significant_gift') {
                subject = `Thank You for Your Significant Gift! 💝`;
                thankYouMessage = `Dear ${donation.donor_name},

Thank you for your significant gift of $${amount.toFixed(2)} to ${churchName}!

Your generosity is making a real impact in our church and community. Gifts like yours help us continue our mission and expand our reach to those who need it most.

${donation.donation_type !== 'tithe' && donation.donation_type !== 'offering' ? `We're especially grateful for your support of ${donation.donation_type.replace(/_/g, ' ')}.` : ''}

${donation.tax_deductible ? 'A tax receipt has been sent to you for tax purposes.' : ''}

May God bless you abundantly for your faithfulness!

With sincere thanks,
${churchName} Team`;
            } else if (followUpType === 'recurring_donor') {
                subject = `Thank You for Setting Up Recurring Giving! 🔄`;
                thankYouMessage = `Dear ${donation.donor_name},

Thank you for setting up recurring giving of $${amount.toFixed(2)} ${donation.recurring_frequency}!

Your commitment to regular giving helps us plan and budget effectively, ensuring we can consistently serve our community and fulfill our mission.

Recurring givers like you are the backbone of our ministry. Your faithful support allows us to focus on what matters most - changing lives and making a difference.

You can manage your recurring gift anytime through your donor portal. ${donation.tax_deductible ? 'You\'ll receive tax receipts for each donation.' : ''}

Thank you for your ongoing partnership!

Blessings,
${churchName} Team`;
            } else {
                subject = `Thank You for Your Gift to ${churchName}! ❤️`;
                thankYouMessage = `Dear ${donation.donor_name},

Thank you for your generous gift of $${amount.toFixed(2)} to ${churchName}!

Every gift, no matter the size, makes a difference in our ability to serve our community and share God's love. We are grateful for your support and partnership.

${donation.donation_type !== 'tithe' && donation.donation_type !== 'offering' ? `Your contribution to ${donation.donation_type.replace(/_/g, ' ')} is greatly appreciated.` : ''}

${donation.tax_deductible ? 'A tax receipt has been sent to you separately.' : ''}

May God bless you richly!

With gratitude,
${churchName} Team`;
            }
            
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: donation.donor_email,
                    from_name: churchName,
                    subject: subject,
                    body: thankYouMessage
                });
                console.log(`✅ Thank you email sent to ${donation.donor_email}`);
            } catch (emailError) {
                console.error('Failed to send thank you email:', emailError);
            }
        }
        
        // Send tax receipt if enabled and donation is tax deductible
        if (autoSendReceipts && donation.tax_deductible && donation.donor_email) {
            try {
                const response = await base44.asServiceRole.functions.invoke('sendDonationReceipt', {
                    donation_id: donationId
                });
                
                if (response.success) {
                    console.log(`✅ Tax receipt sent to ${donation.donor_email}`);
                    
                    // Update donation record
                    await base44.asServiceRole.entities.Donation.update(donationId, {
                        receipt_sent: true,
                        receipt_sent_date: new Date().toISOString().split('T')[0]
                    });
                }
            } catch (receiptError) {
                console.error('Failed to send receipt:', receiptError);
            }
        }
        
        // Schedule nurturing communications for recurring donors
        if (donation.recurring && donation.donor_email) {
            const nextDonationDate = donation.next_donation_date ? new Date(donation.next_donation_date) : null;
            
            if (nextDonationDate) {
                console.log(`📅 Scheduled nurturing for recurring donor: ${donation.donor_name}`);
                
                // Create a giving message for next month
                try {
                    await base44.asServiceRole.entities.GivingMessage.create({
                        donor_email: donation.donor_email,
                        donor_name: donation.donor_name,
                        message_type: 'recurring_reminder',
                        subject: `Your Recurring Gift is Coming Up`,
                        message_body: `Hi ${donation.donor_name},\n\nThis is a friendly reminder that your recurring gift of $${amount.toFixed(2)} to ${churchName} will be processed soon.\n\nThank you for your faithful, ongoing support! Your consistent giving makes a lasting impact.\n\nIf you need to update your payment method or make any changes, you can do so in your donor portal.\n\nBlessings,\n${churchName} Team`,
                        scheduled_date: new Date(nextDonationDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days before
                        status: 'scheduled',
                        created_by: donation.created_by
                    });
                } catch (messageError) {
                    console.error('Failed to create nurturing message:', messageError);
                }
            }
        }
        
        // Track donor engagement
        if (donation.member_id) {
            try {
                const members = await base44.asServiceRole.entities.Member.filter({ id: donation.member_id });
                if (members.length > 0) {
                    const member = members[0];
                    await base44.asServiceRole.entities.Member.update(donation.member_id, {
                        notes: `${member.notes || ''}\n[${new Date().toLocaleDateString()}] Donated $${amount.toFixed(2)}${donation.recurring ? ' (Recurring)' : ''}`
                    });
                }
            } catch (memberError) {
                console.error('Failed to update member notes:', memberError);
            }
        }
        
        console.log(`✅ Donation follow-up completed for ${donation.donor_name}`);
        
        return Response.json({ 
            success: true,
            follow_up_type: followUpType,
            first_time_donor: isFirstTime,
            thank_you_sent: !!donation.donor_email,
            receipt_sent: autoSendReceipts && donation.tax_deductible
        });
        
    } catch (error) {
        console.error('Donation follow-up error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});