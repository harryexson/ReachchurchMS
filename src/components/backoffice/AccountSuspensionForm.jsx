import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export default function AccountSuspensionForm({ isOpen, setIsOpen, account, onSuspend }) {
    const [formData, setFormData] = useState({
        reason: "",
        customReason: "",
        duration: "",
        notifyUser: true
    });
    const [isLoading, setIsLoading] = useState(false);

    const suspensionReasons = [
        { value: "non_payment", label: "Non-payment of subscription" },
        { value: "terms_violation", label: "Terms of service violation" },
        { value: "copyright_infringement", label: "Copyright infringement" },
        { value: "system_abuse", label: "System abuse or misuse" },
        { value: "security_concern", label: "Security concern" },
        { value: "customer_request", label: "Customer request" },
        { value: "custom", label: "Other (specify)" }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        const reason = formData.reason === 'custom' ? formData.customReason : 
                      suspensionReasons.find(r => r.value === formData.reason)?.label;
        
        await onSuspend(account, reason, formData.duration ? parseInt(formData.duration) : null);
        setIsLoading(false);
    };

    if (!account) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Suspend Account
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm text-red-800">
                                <strong>Account:</strong> {account.church_name}
                            </p>
                            <p className="text-sm text-red-700">
                                This will immediately suspend access to all services.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Suspension Reason</Label>
                            <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason for suspension" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suspensionReasons.map(reason => (
                                        <SelectItem key={reason.value} value={reason.value}>
                                            {reason.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.reason === 'custom' && (
                            <div className="space-y-2">
                                <Label htmlFor="customReason">Custom Reason</Label>
                                <Textarea
                                    id="customReason"
                                    value={formData.customReason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customReason: e.target.value }))}
                                    placeholder="Provide details about the suspension reason..."
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (days)</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="1"
                                max="365"
                                value={formData.duration}
                                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                                placeholder="Leave empty for indefinite suspension"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={isLoading || !formData.reason}>
                            {isLoading ? "Suspending..." : "Suspend Account"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}