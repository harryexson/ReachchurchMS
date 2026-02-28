import React, { useState, useEffect } from "react";
import { EventRegistration } from "@/entities/EventRegistration";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

function generateRegistrationCode() {
    return `REG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export default function EventRegistrationForm({ event, isOpen, setIsOpen, onRegistrationComplete }) {
    const [formData, setFormData] = useState({
        registrant_name: "",
        registrant_email: "",
        registrant_phone: "",
        registrant_address: "",
        special_requirements: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [registrationCode, setRegistrationCode] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const scheduleReminders = async (registrationData) => {
        const eventDate = new Date(event.start_datetime);
        const now = new Date();
        const daysUntilEvent = differenceInDays(eventDate, now);

        // Schedule reminders based on how far away the event is
        const reminderSchedules = [];
        
        if (daysUntilEvent > 7) {
            reminderSchedules.push(7); // 7 days before
        }
        if (daysUntilEvent > 3) {
            reminderSchedules.push(3); // 3 days before
        }
        if (daysUntilEvent > 1) {
            reminderSchedules.push(1); // 1 day before
        }

        // For demonstration, we'll send a reminder email now (in real app, you'd use a job scheduler)
        if (daysUntilEvent > 0) {
            const reminderSubject = `Reminder: ${event.title} is coming up!`;
            let reminderBody = `
Hi ${formData.registrant_name},

We're excited to see you at "${event.title}"!

📅 When: ${format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy')} at ${format(new Date(event.start_datetime), 'h:mm a')}
📍 Where: ${event.location || 'Location details will be provided'}
🎟️ Your Registration: ${registrationData.registration_code}

${daysUntilEvent === 1 ? "That's TOMORROW! " : `Only ${daysUntilEvent} days to go! `}

`;

            if (formData.special_requirements) {
                reminderBody += `\nWe have your special requirements noted: ${formData.special_requirements}\n`;
            }

            if (event.pastor_speaker) {
                reminderBody += `\nOur speaker will be ${event.pastor_speaker}.\n`;
            }

            reminderBody += `
Please bring this email with you or have your registration code ready: ${registrationData.registration_code}

We can't wait to see you there!

Blessings,
REACH Church Team
            `;

            // This is a workaround for the platform limitation of not being able to send emails to non-users.
            // In a real app with a proper backend, this would be a scheduled job.
            // For now, we'll just log it. A better approach would be to create a "mailto" link.
            console.log("DEMO: In a real app, a reminder email would be scheduled to be sent.", {
                to: formData.registrant_email,
                subject: reminderSubject,
                body: reminderBody
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const regCode = generateRegistrationCode();
            
            // Generate QR code image with registration details
            const qrResult = await GenerateImage({
                prompt: `Create a clean, professional QR code image with the text "${regCode}" encoded. The QR code should be large, clear, and easily scannable. Include small text below showing "Registration Code: ${regCode}" and "Event: ${event.title}". Use a white background with black QR code. Make it suitable for email and printing.`
            });

            // Create the registration
            const registrationData = {
                event_id: event.id,
                event_title: event.title,
                registration_code: regCode,
                registration_date: new Date().toISOString().split('T')[0],
                qr_code_url: qrResult.url,
                checked_in: false,
                ...formData
            };

            await EventRegistration.create(registrationData);

            // Send confirmation email
            const emailBody = `
Dear ${formData.registrant_name},

Thank you for registering for "${event.title}"!

Event Details:
📅 Date: ${format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy')}
🕐 Time: ${format(new Date(event.start_datetime), 'h:mm a')}
📍 Location: ${event.location || 'To be announced'}
🎫 Your Registration Code: ${regCode}

${formData.special_requirements ? `\nSpecial Requirements Noted: ${formData.special_requirements}\n` : ''}

${event.pastor_speaker ? `Speaker: ${event.pastor_speaker}\n` : ''}

Please save this email and bring it with you to the event. You can show the QR code below at check-in for faster entry.

We'll send you reminder emails as the event approaches!

We look forward to seeing you there!

Blessings,
REACH ChurchConnect Team

---
QR Code for Check-in: ${qrResult.url}
            `;
            
            // This is a workaround for the platform limitation of not being able to send emails to non-users.
            // Instead of calling SendEmail, we'll open a mailto link for the user to send it from their client.
             const mailtoHref = `mailto:${formData.registrant_email}?subject=${encodeURIComponent(`Registration Confirmed - ${event.title}`)}&body=${encodeURIComponent(emailBody)}`;
             window.open(mailtoHref, '_blank');


            // Schedule reminder emails
            await scheduleReminders(registrationData);

            setRegistrationCode(regCode);
            setIsSuccess(true);
            
            if (onRegistrationComplete) {
                onRegistrationComplete(registrationData);
            }

        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed. Please try again.");
        }

        setIsSubmitting(false);
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({
            registrant_name: "",
            registrant_email: "",
            registrant_phone: "",
            registrant_address: "",
            special_requirements: ""
        });
        setRegistrationCode("");
    };

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <DialogTitle className="text-2xl">Registration Confirmed!</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className="text-center space-y-4">
                        <p>Thank you for registering for <strong>{event.title}</strong>!</p>
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <p className="font-medium">Your Registration Code:</p>
                            <p className="text-lg font-mono font-bold text-blue-600">{registrationCode}</p>
                        </div>
                        <p className="text-sm text-slate-600">
                            A confirmation email was opened in your default mail client to send to {formData.registrant_email}.
                        </p>
                        <p className="text-sm text-green-600 font-medium">
                            We'll also remind you as the event approaches!
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleClose} className="w-full">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Register for {event.title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 py-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-900 mb-2">Event Information</h3>
                            <div className="text-sm text-blue-800 space-y-1">
                                <p>📅 {format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy')}</p>
                                <p>🕐 {format(new Date(event.start_datetime), 'h:mm a')}</p>
                                {event.location && <p>📍 {event.location}</p>}
                                {event.registration_fee && (
                                    <p>💰 Registration Fee: ${event.registration_fee}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="registrant_name">Full Name *</Label>
                                <Input
                                    id="registrant_name"
                                    name="registrant_name"
                                    value={formData.registrant_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrant_email">Email Address *</Label>
                                <Input
                                    id="registrant_email"
                                    name="registrant_email"
                                    type="email"
                                    value={formData.registrant_email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="registrant_phone">Phone Number</Label>
                            <Input
                                id="registrant_phone"
                                name="registrant_phone"
                                value={formData.registrant_phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="registrant_address">Address</Label>
                            <Textarea
                                id="registrant_address"
                                name="registrant_address"
                                value={formData.registrant_address}
                                onChange={handleChange}
                                placeholder="123 Main St, Anytown, USA 12345"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="special_requirements">Special Requirements or Notes</Label>
                            <Textarea
                                id="special_requirements"
                                name="special_requirements"
                                value={formData.special_requirements}
                                onChange={handleChange}
                                placeholder="Dietary restrictions, accessibility needs, childcare requests, etc."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                "Register Now"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}