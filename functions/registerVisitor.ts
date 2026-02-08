import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { visitorData, orgAdminEmail } = await req.json();

        if (!visitorData || !orgAdminEmail) {
            return Response.json({ 
                success: false,
                error: 'Missing required data' 
            }, { status: 400 });
        }

        // Check for duplicate visitor in this organization
        const existingVisitors = await base44.asServiceRole.entities.Visitor.filter({
            'data.created_by': orgAdminEmail,
            $or: [
                { 'data.email': visitorData.email },
                { 'data.phone': visitorData.phone }
            ]
        });

        if (existingVisitors.length > 0) {
            return Response.json({ 
                success: false,
                error: 'duplicate_visitor',
                message: 'A visitor with this email or phone number is already registered at this church.'
            }, { status: 400 });
        }

        // Create visitor record
        const newVisitor = await base44.asServiceRole.entities.Visitor.create({
            ...visitorData,
            follow_up_status: "new",
            created_by: orgAdminEmail
        });
        
        return Response.json({ 
            success: true,
            visitor: newVisitor
        });

    } catch (error) {
        console.error('Error registering visitor:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});