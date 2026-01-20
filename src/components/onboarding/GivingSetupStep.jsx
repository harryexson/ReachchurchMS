import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, HelpCircle } from "lucide-react";

export default function GivingSetupStep({ onComplete }) {
  const [setupMethod, setSetupMethod] = useState("later");
  const [formData, setFormData] = useState({
    donation_goal_title: "Monthly Operations",
    donation_goal_description: "Help us continue our ministry",
    donation_goal_monthly: 5000,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "donation_goal_monthly" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const settings = await base44.entities.ChurchSettings.list();
      if (settings.length > 0) {
        await base44.entities.ChurchSettings.update(settings[0].id, {
          ...formData,
          show_goal_on_public_page: true,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error("Error setting up giving:", err);
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Giving Setup Complete!</h3>
        <p className="text-slate-600">Your giving page is ready for donations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Enable online giving so your congregation can give anytime, anywhere. REACH connects to Stripe for secure payments.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="font-semibold text-slate-900">How would you like to set up giving?</Label>
        <div className="grid gap-3">
          <div
            onClick={() => setSetupMethod("goal")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              setupMethod === "goal"
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="font-semibold text-slate-900">🎯 Set Giving Goal</p>
            <p className="text-sm text-slate-600">Display a progress bar with your monthly goal</p>
          </div>

          <div
            onClick={() => setSetupMethod("later")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              setupMethod === "later"
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="font-semibold text-slate-900">⏭️ Do This Later</p>
            <p className="text-sm text-slate-600">Configure giving settings in Church Settings</p>
          </div>
        </div>
      </div>

      {setupMethod === "goal" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="goal_title" className="font-semibold text-slate-900">
                Goal Title
              </Label>
              <div className="relative group cursor-help">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                  What are you fundraising for?
                </div>
              </div>
            </div>
            <Input
              id="goal_title"
              name="donation_goal_title"
              placeholder="e.g., Building Fund, Ministry Expansion"
              value={formData.donation_goal_title}
              onChange={handleChange}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="goal_description" className="font-semibold text-slate-900">
                Description
              </Label>
              <div className="relative group cursor-help">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                  Explain the purpose
                </div>
              </div>
            </div>
            <Input
              id="goal_description"
              name="donation_goal_description"
              placeholder="e.g., Help us expand our community outreach programs"
              value={formData.donation_goal_description}
              onChange={handleChange}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="goal_amount" className="font-semibold text-slate-900">
                Monthly Goal Amount
              </Label>
              <div className="relative group cursor-help">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                  Your target monthly giving
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-slate-900">$</span>
              <Input
                id="goal_amount"
                name="donation_goal_monthly"
                type="number"
                placeholder="5000"
                value={formData.donation_goal_monthly}
                onChange={handleChange}
                className="h-11 text-2xl font-bold"
              />
            </div>
            <p className="text-xs text-slate-500">Update this anytime in your Church Settings</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-3">PREVIEW</p>
            <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
              <h3 className="font-bold text-slate-900">{formData.donation_goal_title}</h3>
              <p className="text-sm text-slate-700">{formData.donation_goal_description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-semibold text-slate-900">$0 / ${formData.donation_goal_monthly}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-11"
          >
            {isLoading ? "Setting Up..." : "Configure Giving"}
          </Button>
        </form>
      )}

      {setupMethod === "later" && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">⏭️</div>
          <p className="text-slate-600 mb-4">You can set up giving goals anytime from Church Settings.</p>
          <Button
            onClick={onComplete}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue to Next Step
          </Button>
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-slate-700">
          Displaying a giving goal motivates generosity and shows transparency about your ministry needs. Update it monthly based on your actual needs.
        </p>
      </div>
    </div>
  );
}