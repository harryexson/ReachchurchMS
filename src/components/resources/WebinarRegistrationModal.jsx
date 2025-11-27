import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function WebinarRegistrationModal({ isOpen, onClose, webinar, onSuccess }) {
    const [formData, setFormData] = useState({
        attendee_name: "",
        attendee_email: "",
        church_name: "",
        role: ""
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await base44.entities.WebinarRegistration.create({
                ...formData,
                webinar_id: webinar.id,
                webinar_title: webinar.title
            });

            // Update registration count
            await base44.entities.Webinar.update(webinar.id, {
                registration_count: (webinar.registration_count || 0) + 1
            });

            // Send confirmation email
            await base44.integrations.Core.SendEmail({
                to: formData.attendee_email,
                subject: `Registered: ${webinar.title}`,
                body: `
Hi ${formData.attendee_name},

You're registered for "${webinar.title}"!

📅 Date: ${format(new Date(webinar.scheduled_date), 'MMMM d, yyyy')}
🕐 Time: ${webinar.scheduled_time}
⏱️ Duration: ${webinar.duration_minutes} minutes

${webinar.meeting_url ? `Join Link: ${webinar.meeting_url}` : 'Meeting link will be sent before the webinar.'}

We'll send you a reminder before the webinar starts.

Best,
REACH Church Connect Team
                `.trim()
            });

            setIsSuccess(true);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Failed to register. Please try again.");
        }
        setIsSaving(false);
    };

    const generateCalendarUrl = () => {
        const startDate = new Date(`${webinar.scheduled_date}T12:00:00`);
        const endDate = new Date(startDate.getTime() + (webinar.duration_minutes || 60) * 60000);
        
        const formatForGoogle = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinar.title)}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent(webinar.description || '')}${webinar.meeting_url ? `&location=${encodeURIComponent(webinar.meeting_url)}` : ''}`;
    };

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md text-center">
                    <div className="py-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">You're Registered!</h2>
                        <p className="text-slate-600 mb-6">
                            Check your email for confirmation and calendar invite details.
                        </p>
                        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                            <h3 className="font-semibold text-slate-900">{webinar.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                {format(new Date(webinar.scheduled_date), 'MMMM d, yyyy')} • {webinar.scheduled_time}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.open(generateCalendarUrl(), '_blank')}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Add to Calendar
                            </Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={onClose}>
                                Done
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Register for Webinar</DialogTitle>
                </DialogHeader>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900">{webinar.title}</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        {format(new Date(webinar.scheduled_date), 'MMMM d, yyyy')} • {webinar.scheduled_time}
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Full Name *</Label>
                        <Input
                            value={formData.attendee_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, attendee_name: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <Label>Email *</Label>
                        <Input
                            type="email"
                            value={formData.attendee_email}
                            onChange={(e) => setFormData(prev => ({ ...prev, attendee_email: e.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <Label>Church Name</Label>
                        <Input
                            value={formData.church_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, church_name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label>Your Role</Label>
                        <Input
                            value={formData.role}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            placeholder="e.g., Pastor, Admin, Volunteer"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register Free"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}