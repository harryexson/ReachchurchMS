import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can transfer member ownership
        if (user.role !== 'admin') {
            return Response.json({ error: 'Only admins can transfer member ownership' }, { status: 403 });
        }

        const { memberIds, newOwnerEmail } = await req.json();

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return Response.json({ error: 'memberIds array is required' }, { status: 400 });
        }

        if (!newOwnerEmail) {
            return Response.json({ error: 'newOwnerEmail is required' }, { status: 400 });
        }

        // Use service role to update the created_by field
        const results = [];
        for (const memberId of memberIds) {
            try {
                const member = await base44.asServiceRole.entities.Member.get(memberId);
                
                if (!member) {
                    results.push({ memberId, success: false, error: 'Member not found' });
                    continue;
                }

                // Delete and recreate the member with the new owner
                await base44.asServiceRole.entities.Member.delete(memberId);
                
                const newMember = await base44.asServiceRole.entities.Member.create({
                    ...member,
                    created_by: newOwnerEmail
                });

                results.push({ 
                    memberId, 
                    newMemberId: newMember.id,
                    success: true, 
                    email: member.email,
                    name: `${member.first_name} ${member.last_name}`
                });
            } catch (error) {
                results.push({ memberId, success: false, error: error.message });
            }
        }

        return Response.json({ 
            success: true, 
            message: `Transferred ${results.filter(r => r.success).length} of ${memberIds.length} members`,
            results 
        });
    } catch (error) {
        console.error('Transfer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});