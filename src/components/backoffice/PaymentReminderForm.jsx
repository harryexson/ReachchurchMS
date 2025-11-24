import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

export default function PaymentReminderForm({ isOpen, setIsOpen, accounts, onSendReminder }) {
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [reminderType, setReminderType] = useState("gentle");
    const [isLoading, setIsLoading] = useState(false);

    const handleAccountToggle = (accountId) => {
        setSelectedAccounts(prev => 
            prev.includes(accountId) 
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    };

    const handleSelectAll = () => {
        setSelectedAccounts(accounts.map(account => account.id));
    };

    const handleSelectNone = () => {
        setSelectedAccounts([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        for (const accountId of selectedAccounts) {
            const account = accounts.find(a => a.id === accountId);
            if (account) {
                await onSendReminder(account, reminderType);
            }
        }
        
        setIsLoading(false);
        setIsOpen(false);
        setSelectedAccounts([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Send Payment Reminders
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Reminder Type</Label>
                            <Select value={reminderType} onValueChange={setReminderType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gentle">Gentle Reminder</SelectItem>
                                    <SelectItem value="urgent">Urgent Notice</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Select Accounts ({selectedAccounts.length} of {accounts.length} selected)</Label>
                                <div className="space-x-2">
                                    <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                                        Select All
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleSelectNone}>
                                        Select None
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                                {accounts.map(account => (
                                    <div key={account.id} className="flex items-center space-x-3 p-2 rounded border">
                                        <Checkbox
                                            checked={selectedAccounts.includes(account.id)}
                                            onCheckedChange={() => handleAccountToggle(account.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{account.church_name}</div>
                                            <div className="text-sm text-slate-500">{account.church_admin_email}</div>
                                        </div>
                                        <Badge className="bg-red-100 text-red-800">
                                            ${account.monthly_price} overdue
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {reminderType === 'gentle' && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Gentle Reminder:</strong> Friendly payment reminder with payment link.
                                </p>
                            </div>
                        )}

                        {reminderType === 'urgent' && (
                            <div className="p-3 bg-orange-50 rounded-lg">
                                <p className="text-sm text-orange-800">
                                    <strong>Urgent Notice:</strong> Stern warning about potential service interruption.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading || selectedAccounts.length === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? "Sending..." : `Send Reminders (${selectedAccounts.length})`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}