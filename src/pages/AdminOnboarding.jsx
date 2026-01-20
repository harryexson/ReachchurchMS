import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import ChurchInfoStep from "@/components/onboarding/ChurchInfoStep";
import MembersSetupStep from "@/components/onboarding/MembersSetupStep";
import FirstCampaignStep from "@/components/onboarding/FirstCampaignStep";
import GivingSetupStep from "@/components/onboarding/GivingSetupStep";
import InviteTeamStep from "@/components/onboarding/InviteTeamStep";
import { motion } from "framer-motion";

export default function AdminOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      title: "Church Information",
      description: "Set up your church basics",
      icon: "🏢",
      component: ChurchInfoStep,
      optional: false,
    },
    {
      title: "Import Members",
      description: "Add your congregation",
      icon: "👥",
      component: MembersSetupStep,
      optional: true,
    },
    {
      title: "First Campaign",
      description: "Send your first message",
      icon: "📧",
      component: FirstCampaignStep,
      optional: true,
    },
    {
      title: "Giving Setup",
      description: "Enable donations",
      icon: "💰",
      component: GivingSetupStep,
      optional: true,
    },
    {
      title: "Invite Team",
      description: "Add team members",
      icon: "👤",
      component: InviteTeamStep,
      optional: true,
    },
  ];

  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const onboardingRecords = await base44.entities.OnboardingProgress.filter({
          user_email: currentUser.email,
        });

        if (onboardingRecords.length > 0) {
          const record = onboardingRecords[0];
          setOnboardingData(record);
          setCompletedSteps(record.completed_steps || []);
          if (record.current_step) {
            setCurrentStep(record.current_step);
          }
        } else {
          // Create new onboarding record
          const newRecord = await base44.entities.OnboardingProgress.create({
            user_email: currentUser.email,
            user_name: currentUser.full_name,
            current_step: 0,
            completed_steps: [],
            onboarding_completed: false,
          });
          setOnboardingData(newRecord);
        }
      } catch (error) {
        console.error("Error loading onboarding data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingData();
  }, []);

  const handleStepComplete = async (stepIndex) => {
    const newCompleted = [...completedSteps];
    if (!newCompleted.includes(stepIndex)) {
      newCompleted.push(stepIndex);
    }

    setCompletedSteps(newCompleted);

    // Update onboarding record
    if (onboardingData) {
      await base44.entities.OnboardingProgress.update(onboardingData.id, {
        completed_steps: newCompleted,
        current_step: Math.min(currentStep + 1, steps.length - 1),
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipOnboarding = async () => {
    if (onboardingData) {
      await base44.entities.OnboardingProgress.update(onboardingData.id, {
        onboarding_completed: true,
      });
      window.location.href = '/Dashboard';
    }
  };

  const handleCompleteOnboarding = async () => {
    if (onboardingData) {
      await base44.entities.OnboardingProgress.update(onboardingData.id, {
        onboarding_completed: true,
      });
      window.location.href = '/Dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Setting up your onboarding...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome to REACH Church Connect! 👋
          </h1>
          <p className="text-xl text-slate-600">
            Let's get your church set up in just a few minutes
          </p>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 20 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Step {currentStep + 1} of {steps.length}
              </p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                {steps[currentStep].title}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(progressPercentage)}%
              </p>
              <p className="text-sm text-slate-600">Complete</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </motion.div>

        {/* Step Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 grid grid-cols-5 gap-2"
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative flex flex-col items-center cursor-pointer transition-all ${
                index <= currentStep ? "" : "opacity-50"
              }`}
              onClick={() => setCurrentStep(index)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  index === currentStep
                    ? "bg-blue-600 text-white scale-110 shadow-lg"
                    : completedSteps.includes(index)
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {completedSteps.includes(index) ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <p className="text-xs font-medium mt-2 text-center text-slate-700 line-clamp-2">
                {step.title}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-blue-200 shadow-xl mb-8">
            <CardContent className="p-8">
              <CurrentStepComponent
                onComplete={() => handleStepComplete(currentStep)}
                stepData={{
                  user,
                  onboardingData,
                }}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-between"
        >
          <Button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleSkipOnboarding}
              variant="ghost"
              className="text-slate-600 hover:text-slate-900"
            >
              Skip for Now
            </Button>
            {isLastStep ? (
              <Button
                onClick={handleCompleteOnboarding}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Setup
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {steps[currentStep].optional ? "Optional Step" : "Required Step"}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              {steps[currentStep].description} - You can always update this later in settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}