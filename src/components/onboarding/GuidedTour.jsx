import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, Lightbulb } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function GuidedTour({ onComplete, churchSize }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isOpen, setIsOpen] = useState(true);

    const getTourSteps = () => {
        const steps = [
            {
                title: "Welcome to Your Dashboard",
                description: "This is your command center. You can see key metrics, recent activity, and quick actions all in one place.",
                icon: "📊",
                action: "view_dashboard",
                delay: 500
            },
            {
                title: "Add Your Members",
                description: "Import or manually add your church members. They'll be able to log in and view announcements, give online, and more.",
                icon: "👥",
                action: "go_to_members",
                delay: 1000
            },
            {
                title: "Set Up Online Giving",
                description: "Accept donations through your giving page. Your members and visitors can give securely from anywhere.",
                icon: "💰",
                action: "go_to_giving",
                delay: 1500
            },
            {
                title: "Create Your First Event",
                description: "Schedule church services, small groups, or events. Members can register and you can track attendance.",
                icon: "📅",
                action: "go_to_events",
                delay: 2000
            }
        ];

        // Add size-specific tips
        if (churchSize === 'medium' || churchSize === 'large') {
            steps.push({
                title: "Enable Communications",
                description: "Send SMS, email, and push notifications to keep your congregation informed and engaged.",
                icon: "📱",
                action: "go_to_comms",
                delay: 2500
            });
        }

        if (churchSize === 'large') {
            steps.push({
                title: "Multi-Campus Support",
                description: "Manage multiple campus locations with separate staffing, events, and member groups.",
                icon: "🏢",
                action: "view_settings",
                delay: 3000
            });
        }

        steps.push({
            title: "You're All Set!",
            description: "Your church is ready to go. Need help? Visit our help center or contact our support team.",
            icon: "🎉",
            action: "complete_tour",
            delay: 0
        });

        return steps;
    };

    const steps = getTourSteps();
    const currentTourStep = steps[currentStep];

    const handleAction = (action) => {
        switch (action) {
            case 'go_to_members':
                window.location.href = createPageUrl('Members');
                break;
            case 'go_to_giving':
                window.location.href = createPageUrl('Giving');
                break;
            case 'go_to_events':
                window.location.href = createPageUrl('Events');
                break;
            case 'go_to_comms':
                window.location.href = createPageUrl('CommunicationHub');
                break;
            case 'view_settings':
                window.location.href = createPageUrl('Settings');
                break;
            case 'complete_tour':
                onComplete();
                setIsOpen(false);
                break;
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleAction('complete_tour');
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full">
                <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl">{currentTourStep.icon}</div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{currentTourStep.title}</h2>
                                <p className="text-sm text-slate-500 mt-1">Step {currentStep + 1} of {steps.length}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                        {currentTourStep.description}
                    </p>

                    {/* Progress dots */}
                    <div className="flex gap-2 mb-8">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentStep 
                                        ? 'bg-blue-600 w-6' 
                                        : index < currentStep
                                        ? 'bg-green-500 w-2'
                                        : 'bg-slate-300 w-2'
                                }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3 justify-between">
                        <Button
                            variant="outline"
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                        >
                            Previous
                        </Button>

                        {currentTourStep.action !== 'complete_tour' ? (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Skip Tour
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                                    onClick={() => handleAction(currentTourStep.action)}
                                >
                                    Go to {currentTourStep.title.split(' ')[currentTourStep.title.split(' ').length - 1]}
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleNext}
                            >
                                Start Using REACH
                            </Button>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <p className="text-sm text-blue-900">
                            <strong>Pro tip:</strong> You can restart this tour anytime from the Help Center.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}