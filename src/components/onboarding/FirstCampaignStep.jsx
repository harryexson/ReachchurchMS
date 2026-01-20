import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, HelpCircle } from "lucide-react";

export default function FirstCampaignStep({ onComplete }) {
  const [campaignType, setCampaignType] = useState("email");
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.title.trim() || !formData.message.trim()) {
        throw new Error("Title and message are required");
      }

      // Create announcement as first campaign
      await base44.entities.Announcement.create({
        title: formData.title,
        message: formData.message,
        category: "general",
        target_audience: "all_members",
        priority: "medium",
        status: "draft",
      });

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📧</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Campaign Created!</h3>
        <p className="text-slate-600">Your first announcement has been saved as a draft. You can publish it anytime!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Create your first announcement to welcome your congregation. This will be saved as a draft so you can review and publish it when ready.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Type */}
        <div className="space-y-3">
          <Label className="font-semibold text-slate-900">Communication Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setCampaignType("email")}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                campaignType === "email"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="font-semibold text-slate-900">📧 Email</p>
              <p className="text-xs text-slate-600">Send to all members</p>
            </div>
            <div
              onClick={() => setCampaignType("sms")}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                campaignType === "sms"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="font-semibold text-slate-900">💬 SMS</p>
              <p className="text-xs text-slate-600">Text messages</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="title" className="font-semibold text-slate-900">
              {campaignType === "email" ? "Subject" : "Message Title"} *
            </Label>
            <div className="relative group cursor-help">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                What's the main purpose of this message?
              </div>
            </div>
          </div>
          <Input
            id="title"
            name="title"
            placeholder={
              campaignType === "email"
                ? "e.g., Welcome to our church community!"
                : "e.g., Summer events are coming!"
            }
            value={formData.title}
            onChange={handleChange}
            className="h-11"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="message" className="font-semibold text-slate-900">
              Message *
            </Label>
            <div className="relative group cursor-help">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                Keep it clear and concise
              </div>
            </div>
          </div>
          <Textarea
            id="message"
            name="message"
            placeholder="Write your message here. Keep it warm and welcoming!"
            value={formData.message}
            onChange={handleChange}
            rows={6}
          />
          <p className="text-xs text-slate-500">
            {campaignType === "sms" && "SMS messages work best under 160 characters"}
          </p>
        </div>

        {/* Preview */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-3">PREVIEW</p>
          <div className="bg-white rounded border border-slate-200 p-4">
            <p className="font-semibold text-slate-900 text-sm mb-2">{formData.title || "Your subject here"}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {formData.message || "Your message will appear here"}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 h-11"
        >
          {isLoading ? "Creating Campaign..." : "Create Campaign Draft"}
        </Button>
      </form>

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-slate-700">
          Start with a warm welcome message. This helps set the tone and shows your congregation you're excited to connect with them.
        </p>
      </div>
    </div>
  );
}