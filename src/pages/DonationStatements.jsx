import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Mail, Loader2, CheckCircle, DollarSign, Shield, AlertCircle, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DonationStatementsPage() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [donations, setDonations] = useState([]);
    const [statements, setStatements] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);

    const checkAccess = useCallback(async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Check if user has financial access
            const hasFinancialAccess = user.role === 'admin' || 
                                       user.can_access_financials === true || 
                                       user.access_level === 'admin' || 
                                       user.access_level === 'accountant';

            if (!hasFinancialAccess) {
                setHasAccess(false);
                setIsLoading(false);
                return;
            }

            setHasAccess(true);
        } catch (error) {
            console.error("Access check failed:", error);
            navigate(createPageUrl('Dashboard'));
        }
    }, [navigate]);

    const loadData = useCallback(async () => {
        if (!hasAccess) return;
        
        setIsLoading(true);
        try {
            const [allDonations, allStatements] = await Promise.all([
                base44.entities.Donation.list('-donation_date'),
                base44.entities.DonationStatement.filter({ statement_year: selectedYear })
            ]);
            setDonations(allDonations);
            setStatements(allStatements);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setIsLoading(false);
    }, [selectedYear, hasAccess]);

    useEffect(() => {
        checkAccess();
    }, [checkAccess]);

    useEffect(() => {
        if (hasAccess) { // Only load data if access has been confirmed
            loadData();
        }
    }, [loadData, hasAccess]); // Dependency array for useEffect

    const generateAllStatements = async () => {
        setIsGenerating(true);
        
        try {
            // Group donations by donor for selected year
            const yearStart = new Date(selectedYear, 0, 1);
            const yearEnd = new Date(selectedYear, 11, 31);
            
            const yearDonations = donations.filter(d => {
                const donationDate = new Date(d.donation_date);
                return donationDate >= yearStart && donationDate <= yearEnd && d.tax_deductible;
            });

            // Group by donor email
            const donorMap = {};
            yearDonations.forEach(donation => {
                const key = donation.donor_email.toLowerCase();
                if (!donorMap[key]) {
                    donorMap[key] = {
                        donor_name: donation.donor_name,
                        donor_email: donation.donor_email,
                        donor_address: donation.donor_address || '',
                        donations: []
                    };
                }
                donorMap[key].donations.push(donation);
            });

            // Generate statement for each donor
            let generatedCount = 0;
            for (const [email, donorData] of Object.entries(donorMap)) {
                const totalAmount = donorData.donations.reduce((sum, d) => sum + d.amount, 0);
                
                const breakdown = donorData.donations.map(d => ({
                    date: d.donation_date,
                    amount: d.amount,
                    type: d.donation_type,
                    payment_method: d.payment_method
                }));

                // Check if statement already exists
                const existingStatements = await base44.entities.DonationStatement.filter({
                    donor_email: email,
                    statement_year: selectedYear
                });

                if (existingStatements.length > 0) {
                    // Update existing
                    await base44.entities.DonationStatement.update(existingStatements[0].id, {
                        total_amount: totalAmount,
                        donation_count: donorData.donations.length,
                        donation_breakdown: breakdown,
                        statement_date: new Date().toISOString().split('T')[0]
                    });
                } else {
                    // Create new
                    await base44.entities.DonationStatement.create({
                        statement_year: selectedYear,
                        donor_name: donorData.donor_name,
                        donor_email: donorData.donor_email,
                        donor_address: donorData.donor_address,
                        total_amount: totalAmount,
                        donation_count: donorData.donations.length,
                        donation_breakdown: breakdown,
                        statement_date: new Date().toISOString().split('T')[0],
                        sent_via: 'not_sent'
                    });
                }

                // Mark donations as included
                for (const donation of donorData.donations) {
                    await base44.entities.Donation.update(donation.id, { included_in_statement: true });
                }

                generatedCount++;
            }

            alert(`Successfully generated ${generatedCount} tax statements for ${selectedYear}`);
            await loadData();

        } catch (error) {
            console.error("Failed to generate statements:", error);
            alert("Failed to generate statements. Please try again.");
        }

        setIsGenerating(false);
    };

    const sendStatementEmail = async (statement) => {
        setIsSending(true);

        try {
            // Format donation type for display
            const formatDonationType = (type) => {
                return (type || 'offering')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            };

            // Group donations by type for summary
            const typeBreakdown = {};
            statement.donation_breakdown.forEach(d => {
                const type = d.type || 'offering';
                if (!typeBreakdown[type]) {
                    typeBreakdown[type] = { count: 0, total: 0 };
                }
                typeBreakdown[type].count++;
                typeBreakdown[type].total += d.amount;
            });

            const emailBody = `Dear ${statement.donor_name},

Thank you for your generous support throughout ${statement.statement_year}! Your partnership in ministry has made a significant impact.

TOTAL TAX-DEDUCTIBLE DONATIONS FOR ${statement.statement_year}: $${statement.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}

This statement includes all ${statement.donation_count} tax-deductible donation(s) made to our church during the ${statement.statement_year} calendar year.

GIVING BY CATEGORY:
${Object.entries(typeBreakdown).map(([type, data]) => 
    `- ${formatDonationType(type)}: $${data.total.toFixed(2)} (${data.count} gift${data.count !== 1 ? 's' : ''})`
).join('\n')}

DETAILED TRANSACTION HISTORY:
${statement.donation_breakdown.map(d => 
    `${new Date(d.date).toLocaleDateString()} - ${formatDonationType(d.type)}: $${d.amount.toFixed(2)} (${d.payment_method})`
).join('\n')}

IMPORTANT TAX INFORMATION:
- EIN: [Your Church Tax ID]
- Tax-exempt status: 501(c)(3)
- No goods or services were provided in exchange for these donations
- Please retain this statement for your tax records

If you have any questions about this statement, please contact us.

Your generosity enables us to fulfill our mission and serve our community. Thank you for your faithful partnership!

God bless you,
Church Administration

---
This is an official tax donation statement for the ${statement.statement_year} calendar year.`;

            await base44.integrations.Core.SendEmail({
                to: statement.donor_email,
                subject: `${statement.statement_year} Tax Donation Statement`,
                body: emailBody
            });

            // Update statement as sent
            await base44.entities.DonationStatement.update(statement.id, {
                sent_via: 'email',
                sent_date: new Date().toISOString().split('T')[0]
            });

            alert(`Statement sent to ${statement.donor_email}`);
            await loadData();

        } catch (error) {
            console.error("Failed to send statement:", error);
            alert("Failed to send statement. Please try again.");
        }

        setIsSending(false);
    };

    const sendAllStatements = async () => {
        if (!confirm(`Send ${statements.length} tax statements via email? This cannot be undone.`)) {
            return;
        }

        setIsSending(true);
        let successCount = 0;
        let failCount = 0;

        for (const statement of statements) {
            // Only send if not already sent via email or if it's explicitly marked as 'not_sent' or 'mail'
            if (statement.sent_via === 'not_sent' || statement.sent_via === 'mail') {
                try {
                    await sendStatementEmail(statement);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to send to ${statement.donor_email}:`, error);
                    failCount++;
                }
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        alert(`Sent ${successCount} statements successfully. ${failCount} failed.`);
        await loadData();
        setIsSending(false);
    };

    const yearOptions = [];
    for (let year = new Date().getFullYear(); year >= 2020; year--) {
        yearOptions.push(year);
    }

    // Access denied screen
    if (!isLoading && !hasAccess) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-red-50/30 min-h-screen">
                <div className="max-w-2xl mx-auto mt-20">
                    <Card className="shadow-2xl border-2 border-red-200">
                        <CardContent className="pt-12 pb-12 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <Shield className="w-12 h-12 text-red-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                Access Restricted
                            </h1>
                            <div className="space-y-3 text-left bg-red-50 p-6 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-900">Confidential Financial Information</p>
                                        <p className="text-sm text-red-800 mt-1">
                                            Tax donation statements contain sensitive financial data and are restricted to authorized personnel only.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-lg text-left space-y-2">
                                <p className="font-semibold text-blue-900">Who can access this page:</p>
                                <ul className="list-disc ml-6 text-sm text-blue-800 space-y-1">
                                    <li>Church Administrators</li>
                                    <li>Accountants/Treasurers with financial permissions</li>
                                    <li>Designated financial staff members</li>
                                </ul>
                            </div>
                            <p className="text-slate-600 text-sm">
                                If you believe you should have access to this page, please contact your church administrator.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button onClick={() => navigate(createPageUrl('Dashboard'))} variant="outline">
                                    Return to Dashboard
                                </Button>
                                <Button onClick={() => navigate(createPageUrl('MyDonations'))} className="bg-blue-600">
                                    View My Donations
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // While loading user access or data, show a general loading state
    if (isLoading && !hasAccess) {
        return (
            <div className="p-6 min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="ml-3 text-lg text-blue-700">Loading access and data...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">Tax Donation Statements</h1>
                            <Shield className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-slate-600">Generate and send year-end donation statements for tax purposes.</p>
                        <p className="text-xs text-red-600 mt-1">⚠️ Confidential - Authorized Personnel Only</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-2">
                            <Label>Tax Year:</Label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="border border-slate-300 rounded-md px-3 py-2"
                            >
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="statements" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="statements">Generated Statements</TabsTrigger>
                        <TabsTrigger value="donations">Donations by Donor</TabsTrigger>
                        <TabsTrigger value="actions">Actions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="statements">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Tax Statements for {selectedYear} ({statements.length})</span>
                                    {statements.length > 0 && (
                                        <Button
                                            onClick={sendAllStatements}
                                            disabled={isSending}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {isSending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Email All Unsent
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Donor Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Total Amount</TableHead>
                                                <TableHead># Donations</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Sent Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                        <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : statements.length > 0 ? (
                                                statements.map(statement => (
                                                    <TableRow key={statement.id}>
                                                        <TableCell className="font-medium">{statement.donor_name}</TableCell>
                                                        <TableCell>{statement.donor_email}</TableCell>
                                                        <TableCell className="font-semibold text-green-600">
                                                            ${statement.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell>{statement.donation_count}</TableCell>
                                                        <TableCell>
                                                            {statement.sent_via === 'email' || statement.sent_via === 'both' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Sent
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {statement.sent_date || 'Not sent'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {statement.sent_via === 'not_sent' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => sendStatementEmail(statement)}
                                                                    disabled={isSending}
                                                                >
                                                                    <Mail className="w-4 h-4 mr-2" />
                                                                    Send Email
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8">
                                                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                        <p className="text-slate-500">No statements generated for {selectedYear}</p>
                                                        <p className="text-sm text-slate-400">Click "Generate Statements" to create them</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="donations">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Donations by Donor - {selectedYear}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const yearStart = new Date(selectedYear, 0, 1);
                                    const yearEnd = new Date(selectedYear, 11, 31);
                                    
                                    const yearDonations = donations.filter(d => {
                                        const donationDate = new Date(d.donation_date);
                                        return donationDate >= yearStart && donationDate <= yearEnd;
                                    });

                                    const donorMap = {};
                                    yearDonations.forEach(donation => {
                                        const key = donation.donor_email.toLowerCase();
                                        if (!donorMap[key]) {
                                            donorMap[key] = {
                                                donor_name: donation.donor_name,
                                                donor_email: donation.donor_email,
                                                donations: [],
                                                total: 0
                                            };
                                        }
                                        donorMap[key].donations.push(donation);
                                        donorMap[key].total += donation.amount;
                                    });

                                    const sortedDonors = Object.values(donorMap).sort((a, b) => b.total - a.total);

                                    return (
                                        <div className="space-y-4">
                                            {sortedDonors.map((donor, idx) => (
                                                <Card key={idx} className="border border-slate-200">
                                                    <CardHeader className="pb-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h3 className="font-semibold text-lg">{donor.donor_name}</h3>
                                                                <p className="text-sm text-slate-600">{donor.donor_email}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-bold text-green-600">
                                                                    ${donor.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                                <p className="text-sm text-slate-600">
                                                                    {donor.donations.length} donation{donor.donations.length !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-2">
                                                            {donor.donations.map((donation, dIdx) => (
                                                                <div key={dIdx} className="flex justify-between items-center text-sm py-1 border-b border-slate-100 last:border-0">
                                                                    <span className="text-slate-600">
                                                                        {new Date(donation.donation_date).toLocaleDateString()} - {donation.donation_type}
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        ${donation.amount.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="actions">
                        <div className="grid gap-6">
                            <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                                <Calendar className="w-5 h-5 text-green-600" />
                                <AlertDescription>
                                    <p className="font-bold text-green-900 mb-2">🎄 Automated Year-End Tax Statements</p>
                                    <div className="text-sm text-green-800 space-y-2">
                                        <p>
                                            <strong>✅ Complete Giving History:</strong> Every donation is automatically recorded and tracked by donor email. 
                                            All contributions are included in year-end tax statements.
                                        </p>
                                        <p>
                                            <strong>📧 Automatic Emails:</strong> Set up a scheduled task to automatically email tax statements to all donors 
                                            on December 31st each year by calling the sendYearEndStatements function.
                                        </p>
                                        <p>
                                            <strong>💡 Manual Option:</strong> You can also generate and send statements manually anytime using the button below.
                                        </p>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            <Alert className="bg-blue-50 border-2 border-blue-200">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                <AlertDescription>
                                    <p className="font-bold text-blue-900 mb-2">📅 Scheduling December 31st Auto-Send</p>
                                    <div className="text-sm text-blue-800 space-y-2">
                                        <p>To automate year-end statements on December 31st:</p>
                                        <ol className="list-decimal ml-5 space-y-1">
                                            <li>Use a service like EasyCron, Cron-job.org, or GitHub Actions</li>
                                            <li>Schedule to trigger on December 31st at 6:00 PM</li>
                                            <li>Call your sendYearEndStatements function endpoint with the current year</li>
                                            <li>All donors will automatically receive their tax statements via email</li>
                                        </ol>
                                        <p className="mt-2 bg-white p-2 rounded border border-blue-300 font-mono text-xs">
                                            Function URL available in: Dashboard → Code → Functions → sendYearEndStatements
                                        </p>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Generate Tax Statements</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-slate-600">
                                        This will create individual tax statements for all donors who made contributions during {selectedYear}.
                                        Each statement will include:
                                    </p>
                                    <ul className="list-disc ml-6 text-slate-600 space-y-1">
                                        <li>Total donation amount for the year</li>
                                        <li>Number of donations made</li>
                                        <li>Detailed breakdown of each donation</li>
                                        <li>Dates and types of donations</li>
                                    </ul>
                                    <Button
                                        onClick={generateAllStatements}
                                        disabled={isGenerating}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        size="lg"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Generating Statements...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-5 h-5 mr-2" />
                                                Generate {selectedYear} Tax Statements
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg border-0 bg-green-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                        Tax Statement Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const yearStart = new Date(selectedYear, 0, 1);
                                        const yearEnd = new Date(selectedYear, 11, 31);
                                        
                                        const yearDonations = donations.filter(d => {
                                            const donationDate = new Date(d.donation_date);
                                            return donationDate >= yearStart && donationDate <= yearEnd && d.tax_deductible;
                                        });

                                        const totalAmount = yearDonations.reduce((sum, d) => sum + d.amount, 0);
                                        const uniqueDonors = new Set(yearDonations.map(d => d.donor_email.toLowerCase())).size;

                                        return (
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-green-600">
                                                        ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-sm text-slate-600">Total Tax-Deductible</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-blue-600">{uniqueDonors}</p>
                                                    <p className="text-sm text-slate-600">Unique Donors</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-purple-600">{yearDonations.length}</p>
                                                    <p className="text-sm text-slate-600">Total Tax-Deductible Donations</p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}