import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Facebook, Twitter, Mail, Link as LinkIcon, Copy, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import QRCodeGenerator from "../links/QRCodeGenerator";

export default function EventPromotion({ event, registrationUrl }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const eventTitle = event.title;
    const eventDate = format(new Date(event.start_datetime), 'MMMM d, yyyy');
    const eventTime = format(new Date(event.start_datetime), 'h:mm a');
    const location = event.location || 'Our Church';

    const shareText = `Join us for ${eventTitle} on ${eventDate} at ${eventTime}! ${event.description || ''} Register here: ${registrationUrl}`;
    const hashtagsText = "church,community,faith";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(registrationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(registrationUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    const shareOnTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=${hashtagsText}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(`You're Invited: ${eventTitle}`);
        const body = encodeURIComponent(`
Hi there,

I'd like to invite you to ${eventTitle}!

📅 When: ${eventDate} at ${eventTime}
📍 Where: ${location}

${event.description || ''}

Register here: ${registrationUrl}

Hope to see you there!
        `);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="text-blue-700 border-blue-200 hover:bg-blue-50"
            >
                <Share2 className="w-4 h-4 mr-1" />
                Share & Promote
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Promote {eventTitle}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Event Image */}
                        {event.promotion_image_url && (
                            <div className="rounded-lg overflow-hidden">
                                <img src={event.promotion_image_url} alt={eventTitle} className="w-full h-48 object-cover" />
                            </div>
                        )}

                        {/* Share Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Share on Social Media</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                <Button onClick={shareOnFacebook} variant="outline" className="flex-1">
                                    <Facebook className="w-4 h-4 mr-2" />
                                    Facebook
                                </Button>
                                <Button onClick={shareOnTwitter} variant="outline" className="flex-1">
                                    <Twitter className="w-4 h-4 mr-2" />
                                    Twitter
                                </Button>
                                <Button onClick={shareViaEmail} variant="outline" className="flex-1">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Copy Registration Link */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Registration Link</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input value={registrationUrl} readOnly className="flex-1" />
                                    <Button onClick={copyToClipboard} variant="outline">
                                        {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* QR Code */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">QR Code for Event</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <QRCodeGenerator 
                                    url={registrationUrl}
                                    fileName={`${event.title.replace(/\s+/g, '-')}-qr-code`}
                                />
                                <p className="text-xs text-slate-500 mt-2">Print and display this QR code for easy registration</p>
                            </CardContent>
                        </Card>

                        {/* Pre-written Social Post */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Copy Pre-written Post</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-slate-50 p-3 rounded text-sm">
                                    {shareText}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareText);
                                        alert("Post copied to clipboard!");
                                    }}
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy Post
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}