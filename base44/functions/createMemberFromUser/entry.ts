import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { user_email, first_name, last_name, phone } = body;

        if (!user_email || !first_name || !last_name) {
            return Response.json({ 
                error: 'Missing required fields: user_email, first_name, last_name' 
            }, { status: 400 });
        }

        // Check if member already exists
        const existingMembers = await base44.entities.Member.filter({
            email: user_email
        });

        if (existingMembers.length > 0) {
            return Response.json({ 
                error: 'Member record already exists for this email',
                member_id: existingMembers[0].id
            }, { status: 400 });
        }

        // Create new member record
        const memberData = {
            first_name,
            last_name,
            email: user_email,
            member_status: 'member',
            join_date: new Date().toISOString().split('T')[0]
        };

        if (phone) {
            memberData.phone = phone;
        }

        const newMember = await base44.entities.Member.create(memberData);

        return Response.json({ 
            success: true,
            message: `Member record created for ${first_name} ${last_name}`,
            member_id: newMember.id
        });

    } catch (error) {
        console.error('Create member from user error:', error);
        return Response.json({ 
            error: error.message || 'Failed to create member'
        }, { status: 500 });
    }
});