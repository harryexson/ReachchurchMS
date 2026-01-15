import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Table, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReportDistributionModal from './ReportDistributionModal';

export default function ReportExportModal({ isOpen, setIsOpen, reportType }) {
    const [format, setFormat] = useState('pdf');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [includeCharts, setIncludeCharts] = useState(true);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [includeRegistrations, setIncludeRegistrations] = useState(true);
    const [groupBy, setGroupBy] = useState('donor');
    const [isExporting, setIsExporting] = useState(false);
    const [generatedReport, setGeneratedReport] = useState(null);
    const [reportName, setReportName] = useState('');
    const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        // Clear previous report details when a new export is attempted
        setGeneratedReport(null);
        setReportName('');
        try {
            let functionName = '';
            let params = { format, startDate, endDate };

            switch (reportType) {
                case 'financial':
                    functionName = 'exportFinancialReport';
                    params.includeCharts = includeCharts;
                    break;
                case 'members':
                    functionName = 'exportMemberReport';
                    params.includeInactive = includeInactive;
                    break;
                case 'giving':
                    functionName = 'exportGivingReport';
                    params.groupBy = groupBy;
                    break;
                case 'events':
                    functionName = 'exportEventReport';
                    params.includeRegistrations = includeRegistrations;
                    break;
                default:
                    throw new Error('Unknown report type');
            }

            const response = await base44.functions.invoke(functionName, params);

            // Create blob
            const blob = new Blob([response.data], { 
                type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
            });
            
            const fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
            
            // Store for distribution
            setGeneratedReport(blob);
            setReportName(fileName);

            // Download file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            // Don't close modal - show distribution option
            // setIsOpen(false); // Changed: Modal stays open
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export report. Please try again.');
        }
        setIsExporting(false);
    };

    const handleDistribute = () => {
        if (!generatedReport) {
            alert('Please export the report first'); // This scenario should be prevented by UI state
            return;
        }
        setIsDistributionModalOpen(true);
    };

    const getReportTitle = () => {
        switch (reportType) {
            case 'financial': return 'Financial Report';
            case 'members': return 'Member Directory Report';
            case 'giving': return 'Giving Report';
            case 'events': return 'Event Attendance Report';
            default: return 'Report';
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Export {getReportTitle()}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Format</Label>
                            <Select value={String(format)} onValueChange={setFormat}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            PDF Document
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="csv">
                                        <div className="flex items-center gap-2">
                                            <Table className="w-4 h-4" />
                                            CSV Spreadsheet
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>End Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {reportType === 'financial' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeCharts"
                                    checked={includeCharts}
                                    onCheckedChange={setIncludeCharts}
                                />
                                <Label htmlFor="includeCharts">Include charts and visualizations</Label>
                            </div>
                        )}

                        {reportType === 'members' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeInactive"
                                    checked={includeInactive}
                                    onCheckedChange={setIncludeInactive}
                                />
                                <Label htmlFor="includeInactive">Include inactive members</Label>
                            </div>
                        )}

                        {reportType === 'giving' && (
                            <div>
                                <Label>Group By</Label>
                                <Select value={String(groupBy)} onValueChange={setGroupBy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="donor">By Donor</SelectItem>
                                        <SelectItem value="type">By Donation Type</SelectItem>
                                        <SelectItem value="method">By Payment Method</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {reportType === 'events' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeRegistrations"
                                    checked={includeRegistrations}
                                    onCheckedChange={setIncludeRegistrations}
                                />
                                <Label htmlFor="includeRegistrations">Include registration details</Label>
                            </div>
                        )}

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">
                                <strong>Note:</strong> {format === 'pdf' ? 'PDF reports are formatted for printing and include charts.' : 'CSV files can be opened in Excel or Google Sheets for further analysis.'}
                            </p>
                        </div>

                        {generatedReport && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-green-900">✅ Report Generated</p>
                                        <p className="text-sm text-green-700">{reportName}</p>
                                    </div>
                                    <Button
                                        onClick={handleDistribute}
                                        variant="outline"
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Distribute
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            {generatedReport ? 'Close' : 'Cancel'}
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            <Download className="w-4 h-4 mr-2" />
                            {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isDistributionModalOpen && generatedReport && (
                <ReportDistributionModal
                    isOpen={isDistributionModalOpen}
                    setIsOpen={setIsDistributionModalOpen}
                    reportBlob={generatedReport}
                    reportName={reportName}
                    reportType={reportType}
                />
            )}
        </>
    );
}