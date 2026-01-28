import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const payload = await req.json();
        const { member_id } = payload;

        // Get member data
        const members = await base44.asServiceRole.entities.Member.filter({ id: member_id });
        if (members.length === 0) {
            return Response.json({ error: 'Member not found' }, { status: 404 });
        }
        const member = members[0];

        // Calculate date ranges
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // Get attendance data (from events where they were registered)
        const eventRegistrations = await base44.asServiceRole.entities.EventRegistration.filter({
            registrant_email: member.email
        });
        const recentAttendance = eventRegistrations.filter(r => {
            const eventDate = new Date(r.registration_date);
            return eventDate >= ninetyDaysAgo && r.checked_in;
        });

        // Get giving data
        const donations = await base44.asServiceRole.entities.Donation.filter({
            donor_email: member.email
        });
        const recentDonations = donations.filter(d => {
            const donationDate = new Date(d.donation_date);
            return donationDate >= ninetyDaysAgo;
        });

        // Calculate scores
        const attendanceScore = Math.min(100, (recentAttendance.length / 12) * 100); // 12 services in 90 days = perfect
        const givingScore = Math.min(100, (recentDonations.length / 3) * 100); // 3 donations in 90 days = consistent
        const involvementScore = (
            (member.ministry_involvement?.length || 0) * 20 +
            (member.volunteer_roles?.length || 0) * 20
        );

        const engagementScore = Math.round(
            (attendanceScore * 0.4) + 
            (givingScore * 0.3) + 
            (involvementScore * 0.3)
        );

        // Determine engagement level
        let engagementLevel;
        if (engagementScore >= 70) engagementLevel = "high";
        else if (engagementScore >= 40) engagementLevel = "medium";
        else if (engagementScore >= 20) engagementLevel = "low";
        else engagementLevel = "at_risk";

        // Get last dates
        const lastAttendance = recentAttendance.length > 0 
            ? recentAttendance.sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))[0].registration_date
            : null;
        const lastDonation = recentDonations.length > 0
            ? recentDonations.sort((a, b) => new Date(b.donation_date) - new Date(a.donation_date))[0].donation_date
            : null;

        // Generate AI recommendations
        const recommendationsPrompt = `Based on this member's engagement data, suggest 3-5 specific, actionable engagement strategies:

Member: ${member.first_name} ${member.last_name}
Engagement Score: ${engagementScore}/100
Engagement Level: ${engagementLevel}
Services Attended (90 days): ${recentAttendance.length}
Donations (90 days): ${recentDonations.length}
Ministry Involvement: ${member.ministry_involvement?.join(', ') || 'None'}
Volunteer Roles: ${member.volunteer_roles?.join(', ') || 'None'}
Last Attendance: ${lastAttendance ? new Date(lastAttendance).toLocaleDateString() : 'Never'}
Last Donation: ${lastDonation ? new Date(lastDonation).toLocaleDateString() : 'Never'}

Provide practical, personalized recommendations.`;

        const recommendationsResult = await base44.integrations.Core.InvokeLLM({
            prompt: recommendationsPrompt,
            response_json_schema: {
                type: "object",
                properties: {
                    recommendations: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            }
        });

        // Save or update engagement record
        const existingEngagement = await base44.asServiceRole.entities.MemberEngagement.filter({
            member_id: member_id
        });

        const engagementData = {
            member_id: member_id,
            member_name: `${member.first_name} ${member.last_name}`,
            member_email: member.email,
            engagement_score: engagementScore,
            attendance_score: attendanceScore,
            giving_score: givingScore,
            involvement_score: involvementScore,
            last_attendance_date: lastAttendance,
            last_donation_date: lastDonation,
            services_attended_90days: recentAttendance.length,
            donations_90days: recentDonations.length,
            engagement_level: engagementLevel,
            recommended_actions: recommendationsResult.recommendations,
            last_calculated: new Date().toISOString()
        };

        if (existingEngagement.length > 0) {
            await base44.asServiceRole.entities.MemberEngagement.update(
                existingEngagement[0].id,
                engagementData
            );
        } else {
            await base44.asServiceRole.entities.MemberEngagement.create(engagementData);
        }

        return Response.json({
            success: true,
            engagement: engagementData
        });

    } catch (error) {
        console.error('Error calculating engagement:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});