import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== DONOR COMMUNICATION =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { campaign_id } = await req.json();

        if (!campaign_id) {
            return Response.json({ error: 'Campaign ID required' }, { status: 400 });
        }

        // Get campaign details
        const campaigns = await base44.asServiceRole.entities.DonorCommunication.filter({ id: campaign_id });
        if (campaigns.length === 0) {
            return Response.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const campaign = campaigns[0];
        console.log(`[${requestId}] Processing campaign: ${campaign.campaign_name}`);

        // Update status to sending
        await base44.asServiceRole.entities.DonorCommunication.update(campaign_id, {
            status: 'sending'
        });

        // Get all donations
        const allDonations = await base44.asServiceRole.entities.Donation.list('-donation_date', 10000);
        
        // Apply segment criteria
        let filteredDonations = allDonations;
        const criteria = campaign.segment_criteria || {};

        if (criteria.donation_types && criteria.donation_types.length > 0) {
            filteredDonations = filteredDonations.filter(d => 
                criteria.donation_types.includes(d.donation_type)
            );
        }

        if (criteria.min_donation_amount) {
            filteredDonations = filteredDonations.filter(d => 
                d.amount >= criteria.min_donation_amount
            );
        }

        if (criteria.max_donation_amount) {
            filteredDonations = filteredDonations.filter(d => 
                d.amount <= criteria.max_donation_amount
            );
        }

        if (criteria.donation_date_from) {
            filteredDonations = filteredDonations.filter(d => 
                d.donation_date >= criteria.donation_date_from
            );
        }

        if (criteria.donation_date_to) {
            filteredDonations = filteredDonations.filter(d => 
                d.donation_date <= criteria.donation_date_to
            );
        }

        if (criteria.recurring_donors_only) {
            filteredDonations = filteredDonations.filter(d => d.recurring === true);
        }

        // Get unique donors
        const donorMap = {};
        filteredDonations.forEach(donation => {
            const key = donation.donor_email.toLowerCase();
            if (!donorMap[key]) {
                donorMap[key] = {
                    donor_name: donation.donor_name,
                    donor_email: donation.donor_email,
                    donor_phone: donation.donor_phone,
                    member_id: donation.member_id,
                    total_donated: 0,
                    donation_count: 0,
                    last_donation_date: donation.donation_date,
                    is_recurring: donation.recurring || false
                };
            }
            donorMap[key].total_donated += donation.amount;
            donorMap[key].donation_count++;
            if (donation.donation_date > donorMap[key].last_donation_date) {
                donorMap[key].last_donation_date = donation.donation_date;
            }
            if (donation.recurring) {
                donorMap[key].is_recurring = true;
            }
        });

        // Filter by first-time donors if needed
        if (criteria.first_time_donors_only) {
            const filteredDonorMap = {};
            for (const [email, donor] of Object.entries(donorMap)) {
                if (donor.donation_count === 1) {
                    filteredDonorMap[email] = donor;
                }
            }
            Object.keys(donorMap).forEach(key => {
                if (!filteredDonorMap[key]) delete donorMap[key];
            });
        }

        // Filter by member status if specified
        if (criteria.member_status && criteria.member_status.length > 0) {
            const members = await base44.asServiceRole.entities.Member.list();
            const memberEmails = new Set(members.map(m => m.email?.toLowerCase()));
            
            const filteredDonorMap = {};
            for (const [email, donor] of Object.entries(donorMap)) {
                const isMember = memberEmails.has(email);
                const shouldInclude = (criteria.member_status.includes('member') && isMember) ||
                                     (criteria.member_status.includes('non_member') && !isMember);
                if (shouldInclude) {
                    filteredDonorMap[email] = donor;
                }
            }
            Object.keys(donorMap).forEach(key => {
                if (!filteredDonorMap[key]) delete donorMap[key];
            });
        }

        const recipients = Object.values(donorMap);
        console.log(`[${requestId}] Found ${recipients.length} recipients`);

        // Get church settings
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchName = settings.length > 0 ? settings[0].church_name : 'Our Church';

        let sentCount = 0;
        let failedCount = 0;

        // Send to each recipient
        for (const recipient of recipients) {
            const memberStatus = recipient.member_id ? 'member' : 'valued supporter';
            
            // Personalize message
            let personalizedMessage = campaign.message_body
                .replace(/{donor_name}/g, recipient.donor_name)
                .replace(/{church_name}/g, churchName)
                .replace(/{member_status}/g, memberStatus)
                .replace(/{total_donated}/g, `$${recipient.total_donated.toFixed(2)}`)
                .replace(/{donation_count}/g, recipient.donation_count)
                .replace(/{last_donation_date}/g, new Date(recipient.last_donation_date).toLocaleDateString());

            let personalizedSubject = (campaign.subject || 'Message from {church_name}')
                .replace(/{donor_name}/g, recipient.donor_name)
                .replace(/{church_name}/g, churchName);

            // Send via email
            if (campaign.channel === 'email' || campaign.channel === 'both') {
                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: churchName,
                        to: recipient.donor_email,
                        subject: personalizedSubject,
                        body: personalizedMessage
                    });

                    await base44.asServiceRole.entities.DonorCommunicationLog.create({
                        campaign_id: campaign_id,
                        donor_name: recipient.donor_name,
                        donor_email: recipient.donor_email,
                        channel_used: 'email',
                        message_sent: personalizedMessage,
                        sent_date: new Date().toISOString(),
                        status: 'sent'
                    });

                    sentCount++;
                } catch (error) {
                    console.error(`[${requestId}] Email failed for ${recipient.donor_email}:`, error.message);
                    
                    await base44.asServiceRole.entities.DonorCommunicationLog.create({
                        campaign_id: campaign_id,
                        donor_name: recipient.donor_name,
                        donor_email: recipient.donor_email,
                        channel_used: 'email',
                        message_sent: personalizedMessage,
                        sent_date: new Date().toISOString(),
                        status: 'failed',
                        error_message: error.message
                    });

                    failedCount++;
                }
            }

            // Send via SMS
            if ((campaign.channel === 'sms' || campaign.channel === 'both') && recipient.donor_phone) {
                try {
                    const smsResponse = await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                        to: recipient.donor_phone,
                        message: personalizedMessage
                    });

                    if (smsResponse.data?.success) {
                        await base44.asServiceRole.entities.DonorCommunicationLog.create({
                            campaign_id: campaign_id,
                            donor_name: recipient.donor_name,
                            donor_email: recipient.donor_email,
                            donor_phone: recipient.donor_phone,
                            channel_used: 'sms',
                            message_sent: personalizedMessage,
                            sent_date: new Date().toISOString(),
                            status: 'sent'
                        });

                        sentCount++;
                    } else {
                        throw new Error('SMS send failed');
                    }
                } catch (error) {
                    console.error(`[${requestId}] SMS failed for ${recipient.donor_phone}:`, error.message);
                    
                    await base44.asServiceRole.entities.DonorCommunicationLog.create({
                        campaign_id: campaign_id,
                        donor_name: recipient.donor_name,
                        donor_email: recipient.donor_email,
                        donor_phone: recipient.donor_phone,
                        channel_used: 'sms',
                        message_sent: personalizedMessage,
                        sent_date: new Date().toISOString(),
                        status: 'failed',
                        error_message: error.message
                    });

                    failedCount++;
                }
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Update campaign
        await base44.asServiceRole.entities.DonorCommunication.update(campaign_id, {
            status: 'sent',
            sent_date: new Date().toISOString(),
            total_recipients: recipients.length,
            sent_count: sentCount,
            failed_count: failedCount
        });

        console.log(`[${requestId}] ✅ Campaign completed - Sent: ${sentCount}, Failed: ${failedCount}`);

        return Response.json({
            success: true,
            total_recipients: recipients.length,
            sent: sentCount,
            failed: failedCount
        });

    } catch (error) {
        console.error(`[${requestId}] Error:`, error.message);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});