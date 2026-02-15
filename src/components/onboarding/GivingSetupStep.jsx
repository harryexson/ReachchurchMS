import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CheckCircle2, ExternalLink, CreditCard, Info } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function GivingSetupStep({ onComplete, stepData }) {
  const [stripeConnected, setStripeConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkStripeConnection();
  }, []);

  const checkStripeConnection = async () => {
    try {
      const settings = await base44.entities.ChurchSettings.filter({});
      if (settings.length > 0) {
        setStripeConnected(!!settings[0].stripe_account_id);
      }
    } catch (error) {
      console.error("Error checking Stripe:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnectStripe = () => {
    window.open(createPageUrl("ChurchSettings") + "#stripe", "_blank");
    toast.success("Church settings opened - navigate to Giving section to connect Stripe");
  };

  const handleUpdateProgress = async () => {
    if (stepData?.onboardingData && stripeConnected) {
      await base44.entities.OnboardingProgress.update(stepData.onboardingData.id, {
        stripe_connected: true,
      });
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Enable online giving</p>
          <p className="text-sm text-blue-800 mt-1">
            Connect your Stripe account to accept online donations securely.
          </p>
        </div>
      </div>

      <Card className="border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">Stripe Integration</h3>
              <p className="text-sm text-slate-600 mt-1">
                Accept credit cards, debit cards, and digital wallets
              </p>
            </div>
            {stripeConnected && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-semibold">Connected</span>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Accept donations 24/7 from anywhere</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Recurring giving with automatic receipts</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>PCI-compliant secure payment processing</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Automatic year-end tax statements</span>
            </div>
          </div>

          {!stripeConnected ? (
            <Button
              onClick={handleConnectStripe}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Connect Stripe Account
            </Button>
          ) : (
            <Button
              onClick={() => window.open(createPageUrl("PublicGiving"), "_blank")}
              variant="outline"
              className="w-full h-12"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              View Giving Page
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-900">
          <strong>Note:</strong> You can set this up later. Stripe connection takes 2-3 minutes
          and requires your bank information for receiving donations.
        </p>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleUpdateProgress}
          className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {stripeConnected ? "Continue" : "Skip for Now"}
        </Button>
      </motion.div>
    </div>
  );
}