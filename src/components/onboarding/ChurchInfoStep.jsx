import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Tooltip_Wrapper = ({ children, content }) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-sm rounded px-3 py-2 whitespace-nowrap z-10">
      {content}
    </div>
  </div>
);

export default function ChurchInfoStep({ onComplete }) {
  const [formData, setFormData] = useState({
    church_name: "",
    tagline: "",
    primary_color: "#3b82f6",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    const loadChurchSettings = async () => {
      try {
        const settings = await base44.entities.ChurchSettings.list();
        if (settings.length > 0) {
          const churchSettings = settings[0];
          setExisting(churchSettings);
          setFormData({
            church_name: churchSettings.church_name || "",
            tagline: churchSettings.tagline || "",
            primary_color: churchSettings.primary_color || "#3b82f6",
          });
        }
      } catch (err) {
        console.error("Error loading church settings:", err);
      }
    };
    loadChurchSettings();
  }, []);

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
      if (!formData.church_name.trim()) {
        throw new Error("Church name is required");
      }

      if (existing) {
        await base44.entities.ChurchSettings.update(existing.id, formData);
      } else {
        await base44.entities.ChurchSettings.create(formData);
      }

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            This information helps personalize REACH Connect for your ministry and appears on your public giving page.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Church Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="church_name" className="font-semibold text-slate-900">
              Church Name *
            </Label>
            <div className="relative group cursor-help">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                Your church's official name
              </div>
            </div>
          </div>
          <Input
            id="church_name"
            name="church_name"
            placeholder="e.g., Grace Fellowship Church"
            value={formData.church_name}
            onChange={handleChange}
            className="h-11"
          />
          <p className="text-xs text-slate-500">This will appear on your public pages</p>
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="tagline" className="font-semibold text-slate-900">
              Church Tagline or Mission
            </Label>
            <div className="relative group cursor-help">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                A short phrase describing your mission
              </div>
            </div>
          </div>
          <Input
            id="tagline"
            name="tagline"
            placeholder="e.g., Growing in faith, serving in love"
            value={formData.tagline}
            onChange={handleChange}
            className="h-11"
          />
          <p className="text-xs text-slate-500">Optional - helps visitors understand your church's heart</p>
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="primary_color" className="font-semibold text-slate-900">
              Brand Color
            </Label>
            <div className="relative group cursor-help">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                Your church's primary brand color
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={handleChange}
                className="h-11 cursor-pointer"
              />
            </div>
            <div
              className="w-12 h-12 rounded-lg border-4 border-slate-200 shadow-md"
              style={{ backgroundColor: formData.primary_color }}
            />
          </div>
          <p className="text-xs text-slate-500">Used throughout your public pages</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base"
        >
          {isLoading ? "Saving..." : "Save Church Info"}
        </Button>
      </form>

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-slate-700">
          Use your church's official name and colors to build brand recognition with your congregation.
        </p>
      </div>
    </div>
  );
}