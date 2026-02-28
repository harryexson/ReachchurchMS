import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, HandHeart, Users, Clock, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function SuccessDialog({ isOpen, onClose, eventTitle }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <DialogTitle className="text-2xl">Thank You!</DialogTitle>
                    </div>
                </DialogHeader>
                <div className="text-center space-y-4">
                    <p>Thank you for signing up to volunteer for <strong>{eventTitle}</strong>!</p>
                    <p className="text-sm text-slate-600">
                        The event coordinator will be in touch with you soon with more details.
                    </p>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} className="w-full">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function VolunteerRegistrationPage() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');
    
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        volunteer_name: "",
        volunteer_email: "",
        volunteer_phone: "",
        selected_role: ""
    });

    const loadEventData = useCallback(async () => {
        if (!eventId) return;
        
        setIsLoading(true);
        try {
            const events = await base44.entities.Event.filter({ id: eventId });
            if (events.length > 0) {
                setEvent(events[0]);
            }
        } catch (error) {
            console.error("Failed to load event data:", error);
        }
        setIsLoading(false);
    }, [eventId]);

    useEffect(() => {
        loadEventData();
    }, [loadEventData]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.selected_role) {
            alert("Please select a preferred role.");
            return;
        }
        setIsSubmitting(true);
        try {
            await base44.entities.VolunteerRegistration.create({
                ...formData,
                event_id: event.id,
                event_title: event.title,
                church_admin_email: event.church_admin_email || event.created_by || "",
                registration_date: new Date().toISOString().split('T')[0]
            });

            // Send notification email to the event planner
            if (event.planner_email) {
                await base44.integrations.Core.SendEmail({
                    to: event.planner_email,
                    from_name: "REACH Volunteer System",
                    subject: `New Volunteer for: ${event.title}`,
                    body: `
                        <p>Hi ${event.planner_name || 'Event Planner'},</p>
                        <p>A new volunteer has signed up for your event, "<strong>${event.title}</strong>".</p>
                        <br/>
                        <p><strong>Volunteer Details:</strong></p>
                        <ul>
                            <li><strong>Name:</strong> ${formData.volunteer_name}</li>
                            <li><strong>Email:</strong> ${formData.volunteer_email}</li>
                            <li><strong>Phone:</strong> ${formData.volunteer_phone || 'Not provided'}</li>
                            <li><strong>Selected Role:</strong> ${formData.selected_role}</li>
                        </ul>
                        <br/>
                        <p>You can view all volunteers in the Event Check-in tab in your dashboard.</p>
                        <p>Thank you,</p>
                        <p>The REACH Team</p>
                    `
                });
            }

            setIsSuccess(true);
        } catch (error) {
            console.error("Failed to submit volunteer registration:", error);
            alert("Submission failed. Please try again.");
        }
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p>Loading Volunteer Opportunity...</p>
                </div>
            </div>
        );
    }

    if (!event || !event.require_volunteers) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-4">Opportunity Not Found</h1>
                        <p className="text-slate-600">The volunteer opportunity you're looking for could not be found or is no longer available.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-6">
                        <div className="text-center space-y-4">
                            <HandHeart className="w-12 h-12 mx-auto text-orange-600"/>
                            <CardTitle className="text-3xl font-bold text-slate-900">
                                Volunteer for {event.title}
                            </CardTitle>
                            <p className="text-lg text-slate-600">Thank you for your interest in serving!</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-blue-900">Date & Time</p>
                                    <p className="text-blue-800">{format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-900">Event Type</p>
                                    <p className="text-green-800 capitalize">{event.event_type.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="volunteer_name">Full Name *</Label>
                                    <Input id="volunteer_name" name="volunteer_name" value={formData.volunteer_name} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="volunteer_email">Email Address *</Label>
                                    <Input id="volunteer_email" name="volunteer_email" type="email" value={formData.volunteer_email} onChange={handleChange} required />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="volunteer_phone">Phone Number</Label>
                                <Input id="volunteer_phone" name="volunteer_phone" value={formData.volunteer_phone} onChange={handleChange} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="selected_role">Preferred Role *</Label>
                                <Select value={formData.selected_role} onValueChange={(value) => handleSelectChange('selected_role', value)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(event.volunteers_needed || []).map(role => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up to Volunteer"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <SuccessDialog
                    isOpen={isSuccess}
                    onClose={() => setIsSuccess(false)}
                    eventTitle={event.title}
                />
            </div>
        </div>
    );
}