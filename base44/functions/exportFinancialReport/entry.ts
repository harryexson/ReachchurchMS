import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { reportType, startDate, endDate, includeCharts } = body;

        // Fetch data
        const [donations, expenses, budgets] = await Promise.all([
            base44.asServiceRole.entities.Donation.list('-donation_date'),
            base44.asServiceRole.entities.Expense.list('-expense_date'),
            base44.asServiceRole.entities.Budget.list()
        ]);

        // Filter by date range if provided
        const filterByDate = (items, dateField) => {
            if (!startDate && !endDate) return items;
            return items.filter(item => {
                const date = new Date(item[dateField]);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        };

        const filteredDonations = filterByDate(donations, 'donation_date');
        const filteredExpenses = filterByDate(expenses, 'expense_date');

        // Create PDF
        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(20);
        doc.text('Financial Report', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
        yPos += 5;
        if (startDate || endDate) {
            doc.text(`Period: ${startDate || 'Beginning'} to ${endDate || 'Present'}`, 20, yPos);
            yPos += 10;
        } else {
            yPos += 10;
        }

        // Summary Section
        doc.setFontSize(14);
        doc.text('Financial Summary', 20, yPos);
        yPos += 8;

        const totalIncome = filteredDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const netIncome = totalIncome - totalExpenses;

        doc.setFontSize(10);
        doc.text(`Total Income: $${totalIncome.toLocaleString()}`, 20, yPos);
        yPos += 6;
        doc.text(`Total Expenses: $${totalExpenses.toLocaleString()}`, 20, yPos);
        yPos += 6;
        doc.text(`Net Income: $${netIncome.toLocaleString()}`, 20, yPos);
        yPos += 10;

        // Income by Type
        doc.setFontSize(12);
        doc.text('Income by Type', 20, yPos);
        yPos += 6;

        const incomeByType = {};
        filteredDonations.forEach(d => {
            const type = d.donation_type || 'other';
            incomeByType[type] = (incomeByType[type] || 0) + (d.amount || 0);
        });

        doc.setFontSize(9);
        Object.entries(incomeByType).forEach(([type, amount]) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(`  ${type.replace('_', ' ')}: $${amount.toLocaleString()}`, 25, yPos);
            yPos += 5;
        });
        yPos += 5;

        // Expenses by Category
        doc.setFontSize(12);
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.text('Expenses by Category', 20, yPos);
        yPos += 6;

        const expensesByCategory = {};
        filteredExpenses.forEach(e => {
            const cat = e.category || 'other';
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.amount || 0);
        });

        doc.setFontSize(9);
        Object.entries(expensesByCategory).forEach(([category, amount]) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(`  ${category.replace('_', ' ')}: $${amount.toLocaleString()}`, 25, yPos);
            yPos += 5;
        });

        // Budget Overview
        if (budgets.length > 0) {
            yPos += 10;
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(12);
            doc.text('Budget Overview', 20, yPos);
            yPos += 6;

            doc.setFontSize(9);
            budgets.forEach(budget => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                const percentage = budget.percentage_used || 0;
                doc.text(`  ${budget.category}: $${(budget.spent_amount || 0).toLocaleString()} / $${budget.allocated_amount.toLocaleString()} (${percentage.toFixed(1)}%)`, 25, yPos);
                yPos += 5;
            });
        }

        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
            doc.text('REACH ChurchConnect - Financial Report', 20, 285);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=financial-report-${new Date().toISOString().split('T')[0]}.pdf`
            }
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});