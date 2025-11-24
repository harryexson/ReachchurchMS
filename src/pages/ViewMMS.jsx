import React, { useState, useEffect } from "react";
import { MMSCampaign } from "@/entities/MMSCampaign";
import { MMSSlide } from "@/entities/MMSSlide";
import { MMSDelivery } from "@/entities/MMSDelivery";
import SlidePreview from "../components/mms/SlidePreview";
import { Loader2 } from "lucide-react";

export default function ViewMMSPage() {
    const [campaign, setCampaign] = useState(null);
    const [slides, setSlides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCampaign();
    }, []);

    const loadCampaign = async () => {
        try {
            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = window.location.pathname.split('/').pop();

            // Find delivery record
            const deliveries = await MMSDelivery.filter({ view_token: token });
            if (deliveries.length === 0) {
                setError("Campaign not found");
                setIsLoading(false);
                return;
            }

            const delivery = deliveries[0];
            const campaignId = delivery.campaign_id;

            // Load campaign and slides
            const campaigns = await MMSCampaign.filter({ id: campaignId });
            if (campaigns.length === 0) {
                setError("Campaign not found");
                setIsLoading(false);
                return;
            }

            setCampaign(campaigns[0]);
            const slideList = await MMSSlide.filter({ campaign_id: campaignId });
            setSlides(slideList.sort((a, b) => a.slide_number - b.slide_number));

            // Mark as opened
            if (delivery.status === 'sent') {
                await MMSDelivery.update(delivery.id, {
                    status: 'opened',
                    opened_date: new Date().toISOString()
                });

                // Update campaign open count
                await MMSCampaign.update(campaignId, {
                    opened_count: (campaigns[0].opened_count || 0) + 1
                });
            }
        } catch (error) {
            console.error("Failed to load campaign:", error);
            setError("Failed to load campaign");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50/30">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50/30">
                <div className="text-center">
                    <p className="text-xl text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 py-12">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{campaign?.title}</h1>
                    {campaign?.description && (
                        <p className="text-slate-600">{campaign.description}</p>
                    )}
                </div>

                <SlidePreview slides={slides} />
            </div>
        </div>
    );
}