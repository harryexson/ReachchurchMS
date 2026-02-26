import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@4.2.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { format = 'pdf', includeInactive = false } = body;

        // Fetch members
        const members = await base44.asServiceRole.entities.Member.list('-created_date');

        const filteredMembers = includeInactive ? members : members.filter(m => m.member_status !== 'inactive');

        if (format === 'csv') {
            // Generate CSV
            const headers = ['Name', 'Email', 'Phone', 'Status', 'Join Date', 'Address', 'Ministry Involvement'];
            const rows = filteredMembers.map(m => [
                `${m.first_name} ${m.last_name}`,
                m.email || '',
                m.phone || '',
                m.member_status || '',
                m.join_date || '',
                m.address || '',
                (m.ministry_involvement || []).join('; ')
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            return new Response(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=member-report-${new Date().toISOString().split('T')[0]}.csv`
                }
            });
        }

        // Generate PDF
        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(20);
        doc.text('Member Directory Report', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
        yPos += 5;
        doc.text(`Total Members: ${filteredMembers.length}`, 20, yPos);
        yPos += 10;

        // Statistics
        doc.setFontSize(12);
        doc.text('Membership Statistics', 20, yPos);
        yPos += 6;

        const stats = {
            'Members': members.filter(m => m.member_status === 'member').length,
            'Regular Attendees': members.filter(m => m.member_status === 'regular_attendee').length,
            'Visitors': members.filter(m => m.member_status === 'visitor').length,
            'Inactive': members.filter(m => m.member_status === 'inactive').length
        };

        doc.setFontSize(9);
        Object.entries(stats).forEach(([status, count]) => {
            doc.text(`  ${status}: ${count}`, 25, yPos);
            yPos += 5;
        });
        yPos += 10;

        // Member List
        doc.setFontSize(12);
        doc.text('Member List', 20, yPos);
        yPos += 8;

        doc.setFontSize(8);
        filteredMembers.forEach((member, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            doc.text(`${index + 1}. ${member.first_name} ${member.last_name}`, 20, yPos);
            yPos += 4;
            doc.text(`   Email: ${member.email || 'N/A'}  |  Phone: ${member.phone || 'N/A'}`, 25, yPos);
            yPos += 4;
            doc.text(`   Status: ${member.member_status || 'N/A'}  |  Join Date: ${member.join_date || 'N/A'}`, 25, yPos);
            yPos += 6;
        });

        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
            doc.text('REACH ChurchConnect - Member Report', 20, 285);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=member-report-${new Date().toISOString().split('T')[0]}.pdf`
            }
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});