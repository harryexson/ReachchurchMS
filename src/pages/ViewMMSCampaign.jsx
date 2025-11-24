import React, { useState, useEffect } from "react";
import { MMSCampaign } from "@/entities/MMSCampaign";
import { MMSSlide } from "@/entities/MMSSlide";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Church, ExternalLink } from "lucide-react";
import SlidePreview from "../components/mms/SlidePreview";

export default function ViewMMSCampaignPage() {
    const [campaign, setCampaign] = useState(null);
    const [slides, setSlides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCampaign();
    }, []);

    const loadCampaign = async () => {
        setIsLoading(true);
        try {
            // Get share token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const shareToken = urlParams.get('token');

            if (!shareToken) {
                setError("Invalid link - no token provided");
                setIsLoading(false);
                return;
            }

            console.log("Loading campaign with token:", shareToken);

            // Load campaign by share token - PUBLIC ACCESS, NO AUTH REQUIRED
            const campaigns = await MMSCampaign.filter({ share_token: shareToken });
            
            if (campaigns.length === 0) {
                setError("Campaign not found or link has expired");
                setIsLoading(false);
                return;
            }

            const foundCampaign = campaigns[0];
            console.log("Campaign found:", foundCampaign);
            setCampaign(foundCampaign);

            // Load slides - PUBLIC ACCESS
            const campaignSlides = await MMSSlide.filter({ campaign_id: foundCampaign.id });
            campaignSlides.sort((a, b) => a.slide_number - b.slide_number);
            console.log("Slides loaded:", campaignSlides.length);
            setSlides(campaignSlides);

            // Track view (increment opened_count) - Try to update, but don't fail if can't
            try {
                await MMSCampaign.update(foundCampaign.id, {
                    opened_count: (foundCampaign.opened_count || 0) + 1
                });
                console.log("View tracked successfully");
            } catch (updateError) {
                // Silently fail - view tracking is not critical
                console.log("Could not update view count (non-critical):", updateError);
            }

        } catch (error) {
            console.error("Failed to load campaign:", error);
            setError("Failed to load campaign. Please try again or contact support.");
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
                    <p className="text-slate-600">Loading message...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 flex items-center justify-center p-6">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <Church className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Not Found</h2>
                        <p className="text-slate-600 mb-4">{error}</p>
                        <p className="text-sm text-slate-500">
                            If you received this link recently, please contact the sender for an updated link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">{campaign.title}</h1>
                    {campaign.description && (
                        <p className="text-slate-600">{campaign.description}</p>
                    )}
                    {campaign.created_by_name && (
                        <p className="text-sm text-slate-500">From: {campaign.created_by_name}</p>
                    )}
                </div>

                {/* Campaign Content */}
                {slides.length > 0 ? (
                    <SlidePreview slides={slides} />
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-slate-600">This campaign has no content yet.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-slate-500 space-y-2">
                    <p>Powered by ChurchConnect</p>
                    <p className="text-xs">📱 No registration required to view this message</p>
                </div>
            </div>
        </div>
    );
}