
import React, { useState, useEffect } from "react";
import { MMSCampaign } from "@/entities/MMSCampaign";
import { MMSSlide } from "@/entities/MMSSlide";
import { User } from "@/entities/User";
import { TextSubscriber } from "@/entities/TextSubscriber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Save, Send, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SlideEditor from "../components/mms/SlideEditor";
import SlidePreview from "../components/mms/SlidePreview";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateMMSCampaignPage() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [campaign, setCampaign] = useState({
        title: "",
        description: "",
        campaign_type: "custom",
        delivery_method: ["in_app"],
        target_audience: [],
        status: "draft"
    });
    const [slides, setSlides] = useState([{
        slide_number: 1,
        slide_type: "image_text",
        title: "",
        body_text: "",
        media_url: "",
        media_type: "none",
        background_color: "#ffffff",
        text_color: "#000000",
        cta_text: "",
        cta_url: "",
        cta_type: "learn_more"
    }]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [subscriberGroups, setSubscriberGroups] = useState([]);

    useEffect(() => {
        loadUserAndGroups();
    }, []);

    const loadUserAndGroups = async () => {
        const user = await User.me();
        setCurrentUser(user);
        
        const subscribers = await TextSubscriber.filter({ status: "active" });
        const uniqueGroups = [...new Set(subscribers.flatMap(s => s.groups || []).filter(Boolean))];
        setSubscriberGroups(uniqueGroups);
    };

    const addSlide = () => {
        if (slides.length >= 5) {
            alert("Maximum 5 slides allowed per campaign");
            return;
        }
        setSlides([...slides, {
            slide_number: slides.length + 1,
            slide_type: "image_text",
            title: "",
            body_text: "",
            media_url: "",
            media_type: "none",
            background_color: "#ffffff",
            text_color: "#000000",
            cta_text: "",
            cta_url: "",
            cta_type: "learn_more"
        }]);
        setCurrentSlide(slides.length);
    };

    const removeSlide = (index) => {
        if (slides.length === 1) {
            alert("Campaign must have at least one slide");
            return;
        }
        const newSlides = slides.filter((_, i) => i !== index);
        // Renumber slides
        newSlides.forEach((slide, i) => {
            slide.slide_number = i + 1;
        });
        setSlides(newSlides);
        if (currentSlide >= newSlides.length) {
            setCurrentSlide(newSlides.length - 1);
        }
    };

    const updateSlide = (index, updates) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], ...updates };
        setSlides(newSlides);
    };

    const handleSave = async (sendNow = false) => {
        if (!campaign.title) {
            alert("Please enter a campaign title");
            return;
        }

        if (slides.some(s => !s.title && !s.body_text)) {
            alert("Each slide must have at least a title or body text");
            return;
        }

        // Show preview before sending
        if (sendNow) {
            const confirmed = window.confirm(
                `⚠️ CONFIRM SEND\n\n` +
                `You are about to send "${campaign.title}" to:\n` +
                `• Delivery: ${campaign.delivery_method.join(', ')}\n` +
                `• Slides: ${slides.length}\n` +
                `${campaign.target_audience?.length > 0 ? `• Groups: ${campaign.target_audience.join(', ')}\n` : ''}` +
                `\nThis will send immediately to all recipients.\n\n` +
                `Click OK to confirm or Cancel to review.`
            );
            
            if (!confirmed) {
                return;
            }
        }

        setIsSaving(true);

        try {
            // Generate unique share token and public link for ALL campaigns (even drafts)
            const shareToken = crypto.randomUUID();
            const baseUrl = window.location.origin;
            const publicLink = `${baseUrl}${createPageUrl('ViewMMSCampaign')}?token=${shareToken}`;

            const campaignData = {
                ...campaign,
                status: sendNow ? "sent" : campaign.status,
                sent_date: sendNow ? new Date().toISOString() : null,
                created_by_name: currentUser.full_name,
                created_by_email: currentUser.email,
                share_token: shareToken,
                public_link: publicLink
            };

            const createdCampaign = await MMSCampaign.create(campaignData);

            // Create slides
            for (const slide of slides) {
                await MMSSlide.create({
                    ...slide,
                    campaign_id: createdCampaign.id
                });
            }

            if (sendNow) {
                // Send campaign
                const { sendMMSCampaign } = await import("@/functions/sendMMSCampaign");
                await sendMMSCampaign({ campaign_id: createdCampaign.id });
                alert(`✅ Campaign sent successfully!\n\n📱 Shareable Link:\n${publicLink}\n\nYou can find the link and QR code in the campaign list.`);
            } else {
                alert(`✅ Campaign saved as draft!\n\n📱 Shareable Link:\n${publicLink}\n\nYou can share this link and generate QR codes from the campaign list.`);
            }

            navigate(createPageUrl('MultimediaMessaging'));
        } catch (error) {
            console.error("Failed to save campaign:", error);
            alert("❌ Failed to save campaign. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDeliveryMethod = (method) => {
        const methods = campaign.delivery_method || [];
        if (methods.includes(method)) {
            setCampaign({
                ...campaign,
                delivery_method: methods.filter(m => m !== method)
            });
        } else {
            setCampaign({
                ...campaign,
                delivery_method: [...methods, method]
            });
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-purple-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate(createPageUrl('MultimediaMessaging'))}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-slate-900">Create Multimedia Campaign</h1>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {isPreview ? "Edit" : "Preview"}
                        </Button>
                        <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button 
                            onClick={() => handleSave(true)} 
                            disabled={isSaving || campaign.delivery_method.length === 0}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Send Now
                        </Button>
                    </div>
                </div>

                {isPreview ? (
                    /* Preview Mode */
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle>Campaign Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SlidePreview slides={slides} />
                        </CardContent>
                    </Card>
                ) : (
                    /* Edit Mode */
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Campaign Settings */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="shadow-lg border-0">
                                <CardHeader>
                                    <CardTitle>Campaign Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Campaign Title *</Label>
                                        <Input 
                                            value={campaign.title}
                                            onChange={(e) => setCampaign({...campaign, title: e.target.value})}
                                            placeholder="e.g., Easter Service Invitation"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea 
                                            value={campaign.description}
                                            onChange={(e) => setCampaign({...campaign, description: e.target.value})}
                                            placeholder="Internal notes about this campaign"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Campaign Type</Label>
                                        <Select 
                                            value={campaign.campaign_type}
                                            onValueChange={(value) => setCampaign({...campaign, campaign_type: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="announcement">Announcement</SelectItem>
                                                <SelectItem value="event_promo">Event Promotion</SelectItem>
                                                <SelectItem value="giving_appeal">Giving Appeal</SelectItem>
                                                <SelectItem value="ministry_update">Ministry Update</SelectItem>
                                                <SelectItem value="holiday_greeting">Holiday Greeting</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Delivery Method *</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id="sms"
                                                    checked={campaign.delivery_method?.includes('sms_mms')}
                                                    onCheckedChange={() => toggleDeliveryMethod('sms_mms')}
                                                />
                                                <Label htmlFor="sms">SMS/MMS</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id="email"
                                                    checked={campaign.delivery_method?.includes('email')}
                                                    onCheckedChange={() => toggleDeliveryMethod('email')}
                                                />
                                                <Label htmlFor="email">Email</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id="inapp"
                                                    checked={campaign.delivery_method?.includes('in_app')}
                                                    onCheckedChange={() => toggleDeliveryMethod('in_app')}
                                                />
                                                <Label htmlFor="inapp">In-App</Label>
                                            </div>
                                        </div>
                                    </div>

                                    {subscriberGroups.length > 0 && (
                                        <div className="space-y-2">
                                            <Label>Target Groups (optional)</Label>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {subscriberGroups.map(group => (
                                                    <div key={group} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`group-${group}`}
                                                            checked={campaign.target_audience?.includes(group)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setCampaign({
                                                                        ...campaign,
                                                                        target_audience: [...(campaign.target_audience || []), group]
                                                                    });
                                                                } else {
                                                                    setCampaign({
                                                                        ...campaign,
                                                                        target_audience: (campaign.target_audience || []).filter(g => g !== group)
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                        <Label htmlFor={`group-${group}`}>{group}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Slide Navigation */}
                            <Card className="shadow-lg border-0">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Slides ({slides.length}/5)</CardTitle>
                                        <Button 
                                            size="sm" 
                                            onClick={addSlide}
                                            disabled={slides.length >= 5}
                                            variant="outline"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {slides.map((slide, index) => (
                                            <div 
                                                key={index}
                                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    currentSlide === index ? 'bg-purple-50 border-purple-300' : 'hover:bg-slate-50'
                                                }`}
                                                onClick={() => setCurrentSlide(index)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">Slide {index + 1}</p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {slide.title || "Untitled"}
                                                        </p>
                                                    </div>
                                                    {slides.length > 1 && (
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeSlide(index);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Slide Editor */}
                        <div className="lg:col-span-2">
                            <SlideEditor 
                                slide={slides[currentSlide]}
                                onChange={(updates) => updateSlide(currentSlide, updates)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
