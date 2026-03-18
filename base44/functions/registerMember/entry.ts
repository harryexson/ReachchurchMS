import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { memberData, orgAdminEmail } = await req.json();

        if (!memberData || !orgAdminEmail) {
            return Response.json({ 
                success: false,
                error: 'Missing required data' 
            }, { status: 400 });
        }

        // Check if already a member in THIS organization
        const existingMembers = await base44.asServiceRole.entities.Member.filter({
            church_admin_email: orgAdminEmail,
            $or: [
                { email: memberData.email },
                { phone: memberData.phone }
            ]
        });

        if (existingMembers.length > 0) {
            return Response.json({ 
                success: false,
                error: 'already_member',
                message: "You're already registered as a member at this church!"
            }, { status: 400 });
        }

        // Check for existing visitor to convert (within this organization)
        const visitors = await base44.asServiceRole.entities.Visitor.filter({
            church_admin_email: orgAdminEmail,
            $or: [
                { email: memberData.email },
                { phone: memberData.phone }
            ]
        });

        const finalMemberData = {
            ...memberData,
            member_status: "member",
            join_date: new Date().toISOString().split('T')[0],
            church_admin_email: orgAdminEmail
        };

        // If visitor exists, include visitor info
        if (visitors.length > 0) {
            const visitor = visitors[0];
            finalMemberData.visitor_id = visitor.id;
            finalMemberData.total_visits = visitor.total_visits || 1;
            finalMemberData.conversion_date = new Date().toISOString().split('T')[0];
            
            // Update visitor record to mark as converted
            await base44.asServiceRole.entities.Visitor.update(visitor.id, {
                conversion_status: "converted_to_member",
                member_conversion_date: new Date().toISOString().split('T')[0]
            });
        }

        // Create member record
        const newMember = await base44.asServiceRole.entities.Member.create(finalMemberData);
        
        // Send invitation email for member to create account
        try {
            await base44.asServiceRole.functions.invoke('sendMemberInvitation', {
                memberEmail: newMember.email,
                memberName: newMember.first_name + ' ' + newMember.last_name,
                memberId: newMember.id,
                churchAdminEmail: orgAdminEmail
            });
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // Continue even if email fails
        }
        
        return Response.json({ 
            success: true,
            member: newMember
        });

    } catch (error) {
        console.error('Error registering member:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});