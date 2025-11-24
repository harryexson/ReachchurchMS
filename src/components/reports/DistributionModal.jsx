import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, X, Plus } from "lucide-react";

export default function DistributionModal({ reportData, filters, onClose }) {
    const [recipients, setRecipients] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [subject, setSubject] = useState('Financial Report');
    const [message, setMessage] = useState('Please find attached the financial report for the selected period.');
    const [format, setFormat] = useState('pdf');
    const [isSending, setIsSending] = useState(false);

    const addRecipient = () => {
        if (newEmail && !recipients.includes(newEmail)) {
            setRecipients([...recipients, newEmail]);
            setNewEmail('');
        }
    };

    const removeRecipient = (email) => {
        setRecipients(recipients.filter(e => e !== email));
    };

    const handleSend = async () => {
        if (recipients.length === 0) {
            alert('Please add at least one recipient');
            return;
        }

        setIsSending(true);
        try {
            await base44.functions.invoke('distributeFinancialReport', {
                recipients,
                subject,
                message,
                format,
                donations: reportData,
                filters
            });

            alert(`Report sent successfully to ${recipients.length} recipient(s)!`);
            onClose();
        } catch (error) {
            console.error("Distribution failed:", error);
            alert("Failed to send report. Please try again.");
        }
        setIsSending(false);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Distribute Financial Report
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Add Recipients</Label>
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="email@example.com"
                                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                            />
                            <Button onClick={addRecipient} variant="outline">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {recipients.map(email => (
                                <Badge key={email} variant="secondary" className="gap-2">
                                    {email}
                                    <X 
                                        className="w-3 h-3 cursor-pointer" 
                                        onClick={() => removeRecipient(email)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Report Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">PDF Report</SelectItem>
                                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Email Subject</Label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Email Message</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-900 font-semibold mb-1">Report Summary</p>
                        <div className="text-sm text-blue-800">
                            <p>• {reportData.length} transactions</p>
                            <p>• ${reportData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} total</p>
                            <p>• Period: {filters.dateFrom} to {filters.dateTo}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Report
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}