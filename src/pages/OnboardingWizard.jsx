import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import SEO from "../components/shared/SEO";

export default function OnboardingWizardPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
        } catch (error) {
            console.error("Failed to load user:", error);
            base44.auth.redirectToLogin(window.location.href);
        }
        setIsLoading(false);
    };

    const handleComplete = async () => {
        // Mark onboarding as complete for this user
        try {
            const progress = await base44.entities.OnboardingProgress.filter({ user_email: currentUser.email });
            if (progress.length > 0) {
                await base44.entities.OnboardingProgress.update(progress[0].id, {
                    onboarding_completed: true,
                    completion_date: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("Error updating onboarding progress:", error);
        }

        if (currentUser?.role === 'admin') {
            window.location.href = createPageUrl('Dashboard');
        } else {
            window.location.href = createPageUrl('MemberDashboard');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!currentUser) {
        return null;
    }

    return (
        <>
            <SEO 
                title="Welcome - Get Started with REACH Church Connect"
                description="Complete your onboarding to get the most out of your church management experience."
                url="/onboardingwizard"
            />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
                <div className="max-w-7xl mx-auto py-8">
                    <OnboardingWizard
                        userEmail={currentUser.email}
                        userName={currentUser.full_name}
                        userType={currentUser.role === 'admin' ? 'admin' : 'member'}
                        onComplete={handleComplete}
                    />
                </div>
            </div>
        </>
    );
}