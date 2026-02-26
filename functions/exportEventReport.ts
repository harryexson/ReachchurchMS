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
        const { format = 'pdf', startDate, endDate, includeRegistrations = true } = body;

        // Fetch events
        let events = await base44.asServiceRole.entities.Event.list('-start_datetime');
        let registrations = [];

        if (includeRegistrations) {
            registrations = await base44.asServiceRole.entities.EventRegistration.list();
        }

        // Filter by date range
        if (startDate || endDate) {
            events = events.filter(e => {
                const date = new Date(e.start_datetime);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }

        if (format === 'csv') {
            // Generate CSV
            const headers = ['Event Title', 'Type', 'Date', 'Location', 'Expected Attendance', 'Actual Attendance', 'Registrations', 'Status'];
            const rows = events.map(e => {
                const eventRegs = registrations.filter(r => r.event_id === e.id);
                return [
                    e.title || '',
                    e.event_type || '',
                    e.start_datetime || '',
                    e.location || '',
                    e.expected_attendance || 0,
                    e.actual_attendance || 0,
                    eventRegs.length,
                    e.status || ''
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            return new Response(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=event-report-${new Date().toISOString().split('T')[0]}.csv`
                }
            });
        }

        // Generate PDF
        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(20);
        doc.text('Event Attendance Report', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
        yPos += 5;
        if (startDate || endDate) {
            doc.text(`Period: ${startDate || 'Beginning'} to ${endDate || 'Present'}`, 20, yPos);
            yPos += 5;
        }
        doc.text(`Total Events: ${events.length}`, 20, yPos);
        yPos += 10;

        // Summary
        const totalAttendance = events.reduce((sum, e) => sum + (e.actual_attendance || 0), 0);
        const avgAttendance = events.length > 0 ? totalAttendance / events.length : 0;

        doc.setFontSize(12);
        doc.text('Summary', 20, yPos);
        yPos += 6;

        doc.setFontSize(9);
        doc.text(`Total Attendance: ${totalAttendance}`, 25, yPos);
        yPos += 5;
        doc.text(`Average Attendance per Event: ${avgAttendance.toFixed(0)}`, 25, yPos);
        yPos += 5;
        doc.text(`Total Registrations: ${registrations.length}`, 25, yPos);
        yPos += 10;

        // By Type
        doc.setFontSize(12);
        doc.text('Events by Type', 20, yPos);
        yPos += 6;

        const byType = {};
        events.forEach(e => {
            const type = e.event_type || 'other';
            byType[type] = (byType[type] || 0) + 1;
        });

        doc.setFontSize(9);
        Object.entries(byType).forEach(([type, count]) => {
            doc.text(`  ${type.replace('_', ' ')}: ${count} events`, 25, yPos);
            yPos += 5;
        });
        yPos += 10;

        // Event Details
        doc.setFontSize(12);
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.text('Event Details', 20, yPos);
        yPos += 8;

        doc.setFontSize(8);
        events.forEach((event, index) => {
            if (yPos > 265) {
                doc.addPage();
                yPos = 20;
            }

            const eventRegs = registrations.filter(r => r.event_id === event.id);
            doc.text(`${index + 1}. ${event.title}`, 20, yPos);
            yPos += 4;
            doc.text(`   Date: ${event.start_datetime ? new Date(event.start_datetime).toLocaleDateString() : 'N/A'}  |  Type: ${event.event_type || 'N/A'}`, 25, yPos);
            yPos += 4;
            doc.text(`   Location: ${event.location || 'N/A'}  |  Attendance: ${event.actual_attendance || 0}  |  Registrations: ${eventRegs.length}`, 25, yPos);
            yPos += 6;
        });

        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
            doc.text('REACH ChurchConnect - Event Report', 20, 285);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=event-report-${new Date().toISOString().split('T')[0]}.pdf`
            }
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});