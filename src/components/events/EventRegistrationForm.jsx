import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Loader2, CreditCard, Banknote } from "lucide-react";
import { format } from "date-fns";
import { createOneTimePayment } from "@/functions/createOneTimePayment";

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
    const [paymentMethod, setPaymentMethod] = useState('card');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const regCode = generateRegistrationCode();
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(regCode)}`;

            const registrationData = {
                event_id: event.id,
                event_title: event.title,
                church_admin_email: event.church_admin_email || event.created_by || "",
                registration_code: regCode,
                registration_date: new Date().toISOString().split('T')[0],
                qr_code_url: qrCodeUrl,
                checked_in: false,
                ...formData
            };

            const createdReg = await base44.entities.EventRegistration.create(registrationData);

            // If there's a fee and user chose card, redirect to Stripe
            if (event.registration_fee && paymentMethod === 'card') {
                const res = await createOneTimePayment({
                    amount: event.registration_fee,
                    description: `Event Registration: ${event.title}`,
                    customer_email: formData.registrant_email,
                    customer_name: formData.registrant_name,
                    metadata: { registration_id: createdReg.id, event_id: event.id, order_type: 'event_registration' },
                    success_url: window.location.origin + window.location.pathname + window.location.search + '&payment_success=true&reg_id=' + createdReg.id,
                    cancel_url: window.location.origin + window.location.pathname + window.location.search
                });
                if (res.data?.checkout_url) {
                    window.location.href = res.data.checkout_url;
                    return;
                }
            }

            const eventDate = format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy');
            const eventTime = format(new Date(event.start_datetime), 'h:mm a');
            const location = event.location || 'To be announced';

            // 1. Send confirmation EMAIL with QR code image
            const emailBody = `Dear ${formData.registrant_name},

Thank you for registering for "${event.title}"!

📅 Date: ${eventDate}
🕐 Time: ${eventTime}
📍 Location: ${location}
🎫 Registration Code: ${regCode}

Your QR Code for check-in:
${qrCodeUrl}

Please present this QR code (or your registration code) at the check-in desk. You can scan it directly from your phone screen.
${formData.special_requirements ? `\nSpecial Requirements Noted: ${formData.special_requirements}` : ''}${event.pastor_speaker ? `\nSpeaker: ${event.pastor_speaker}` : ''}

We look forward to seeing you there!

Blessings,
REACH ChurchConnect Team`;

            // 2. Send SMS if phone provided
            const smsText = `Hi ${formData.registrant_name}! You're registered for "${event.title}" on ${eventDate} at ${eventTime}. Location: ${location}. Your QR code: ${qrCodeUrl} (Code: ${regCode}). Show this at check-in. - REACH Church`;

            // 3. Create in-app message
            const inAppMsg = {
                recipient_email: formData.registrant_email,
                sender_name: 'Church Events',
                subject: `Registration Confirmed: ${event.title}`,
                message: `You're registered for **${event.title}**!\n\n📅 ${eventDate} at ${eventTime}\n📍 ${location}\n\n🎫 **Registration Code:** ${regCode}\n\n![QR Code](${qrCodeUrl})\n\nPresent this QR code or your registration code at the check-in desk.`,
                message_type: 'event_registration',
                is_read: false,
                sent_at: new Date().toISOString()
            };

            // Fire all three in parallel
            const tasks = [
                base44.integrations.Core.SendEmail({
                    to: formData.registrant_email,
                    subject: `Registration Confirmed - ${event.title}`,
                    body: emailBody
                }),
                base44.entities.InAppMessage.create(inAppMsg)
            ];

            // Only send SMS if phone number provided
            if (formData.registrant_phone && formData.registrant_phone.trim()) {
                tasks.push(
                    base44.functions.invoke('sendSignalhouseSMS', {
                        recipients: [formData.registrant_phone.trim()],
                        message: smsText,
                        skip_disclaimer: true
                    }).catch(err => console.warn('SMS send failed (non-critical):', err))
                );
            }

            await Promise.all(tasks);

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
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(registrationCode)}`;
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <DialogTitle className="text-xl">Registration Confirmed!</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className="text-center space-y-4">
                        <p className="text-slate-700">You're registered for <strong>{event.title}</strong>!</p>

                        {/* QR Code */}
                        <div className="flex flex-col items-center gap-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <img src={qrUrl} alt="Check-in QR Code" className="w-48 h-48" />
                            <p className="text-xs text-slate-500">Scan at the check-in desk</p>
                            <p className="font-mono font-bold text-blue-600 text-sm tracking-wide">{registrationCode}</p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 space-y-1 text-left">
                            <p>✅ Confirmation email sent to <strong>{formData.registrant_email}</strong></p>
                            {formData.registrant_phone && <p>✅ SMS sent to <strong>{formData.registrant_phone}</strong></p>}
                            <p>✅ QR code saved to your in-app messages</p>
                        </div>
                        <p className="text-xs text-slate-500">Present this QR code from your phone screen or email at check-in.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">Done</Button>
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

                        {event.registration_fee > 0 && (
                            <div className="space-y-2">
                                <Label>Payment Method for ${event.registration_fee} fee</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('card')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        <span className="font-medium text-sm">Pay by Card</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                    >
                                        <Banknote className="w-4 h-4" />
                                        <span className="font-medium text-sm">Pay in Person</span>
                                    </button>
                                </div>
                            </div>
                        )}
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