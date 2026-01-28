import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const payload = await req.json();
        const { contact_id, contact_type, workflow_context, step_purpose } = payload;

        // Get contact data
        let contactData;
        if (contact_type === 'visitor') {
            const visitors = await base44.asServiceRole.entities.Visitor.filter({ id: contact_id });
            contactData = visitors[0];
        } else {
            const members = await base44.asServiceRole.entities.Member.filter({ id: contact_id });
            contactData = members[0];
        }

        if (!contactData) {
            return Response.json({ error: 'Contact not found' }, { status: 404 });
        }

        // Get engagement data if member
        let engagementData = null;
        if (contact_type === 'member') {
            const engagements = await base44.asServiceRole.entities.MemberEngagement.filter({
                member_id: contact_id
            });
            engagementData = engagements[0];
        }

        // Get interaction history
        const followUps = await base44.asServiceRole.entities.VisitorFollowUp.filter({
            contact_id: contact_id
        });

        // Build AI prompt
        const prompt = `You are a compassionate church pastor writing a personalized follow-up message.

CONTACT INFORMATION:
- Name: ${contactData.name || contactData.first_name + ' ' + contactData.last_name}
- Type: ${contact_type}
- Email: ${contactData.email}
${contact_type === 'visitor' ? `- Total Visits: ${contactData.total_visits || 1}
- Last Visit: ${contactData.last_visit_date || 'Recent'}
- Interests: ${contactData.interests?.join(', ') || 'Not specified'}
- Special Requests: ${contactData.special_requests || 'None'}` : ''}
${contact_type === 'member' ? `- Join Date: ${contactData.join_date || 'N/A'}
- Ministry Involvement: ${contactData.ministry_involvement?.join(', ') || 'None yet'}
- Volunteer Roles: ${contactData.volunteer_roles?.join(', ') || 'None yet'}
- Member Status: ${contactData.member_status}` : ''}

${engagementData ? `ENGAGEMENT METRICS:
- Engagement Score: ${engagementData.engagement_score}/100
- Engagement Level: ${engagementData.engagement_level}
- Last Attendance: ${engagementData.last_attendance_date || 'Not recorded'}
- Services (90 days): ${engagementData.services_attended_90days}
- Donations (90 days): ${engagementData.donations_90days}
- Attendance Streak: ${engagementData.attendance_streak} weeks` : ''}

WORKFLOW CONTEXT:
${workflow_context || 'General follow-up'}

STEP PURPOSE:
${step_purpose || 'Check in and encourage engagement'}

PREVIOUS MESSAGES SENT: ${followUps.length}

Generate a warm, personalized ${contact_type === 'visitor' ? 'visitor' : 'member'} follow-up message that:
1. Feels authentic and personal (reference their specific situation)
2. Is encouraging and welcoming
3. Includes a clear next step or call to action
4. Is around 150-200 words
${engagementData && engagementData.engagement_level === 'at_risk' ? '5. Addresses their decreased engagement with care and concern' : ''}

Return ONLY the message body text, no subject line.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt
        });

        // Generate subject line
        const subjectPrompt = `Based on this message, write a friendly email subject line (max 60 chars):

${result}

Return ONLY the subject line, nothing else.`;

        const subject = await base44.integrations.Core.InvokeLLM({
            prompt: subjectPrompt
        });

        return Response.json({
            success: true,
            subject: subject.trim(),
            message_body: result.trim(),
            personalization_data: {
                contact_type,
                engagement_level: engagementData?.engagement_level,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error generating AI message:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});