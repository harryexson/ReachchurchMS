import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Upload, Info } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ChurchInfoStep({ onComplete, stepData }) {
  const [formData, setFormData] = useState({
    church_name: "",
    tagline: "",
    website_url: "",
    phone: "",
    address: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [existingSettings, setExistingSettings] = useState(null);

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const settings = await base44.entities.ChurchSettings.filter({});
        if (settings.length > 0) {
          const setting = settings[0];
          setExistingSettings(setting);
          setFormData({
            church_name: setting.church_name || "",
            tagline: setting.tagline || "",
            website_url: setting.website_url || "",
            phone: stepData?.onboardingData?.church_phone || "",
            address: stepData?.onboardingData?.church_address || "",
          });
          if (setting.logo_url) {
            setLogoPreview(setting.logo_url);
          }
        }
      } catch (error) {
        console.error("Error loading church settings:", error);
      }
    };

    loadExistingData();
  }, [stepData]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.church_name) {
      toast.error("Please enter your church name");
      return;
    }

    setIsSaving(true);
    try {
      let logoUrl = logoPreview;

      // Upload logo if new file selected
      if (logoFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: logoFile });
        logoUrl = uploadResult.file_url;
      }

      // Update or create church settings
      if (existingSettings) {
        await base44.entities.ChurchSettings.update(existingSettings.id, {
          church_name: formData.church_name,
          tagline: formData.tagline,
          website_url: formData.website_url,
          logo_url: logoUrl,
        });
      } else {
        await base44.entities.ChurchSettings.create({
          church_name: formData.church_name,
          tagline: formData.tagline,
          website_url: formData.website_url,
          logo_url: logoUrl,
        });
      }

      // Update onboarding progress
      if (stepData?.onboardingData) {
        await base44.entities.OnboardingProgress.update(stepData.onboardingData.id, {
          church_name: formData.church_name,
          church_phone: formData.phone,
          church_address: formData.address,
          branding_completed: true,
        });
      }

      toast.success("Church information saved!");
      onComplete();
    } catch (error) {
      console.error("Error saving church info:", error);
      toast.error("Failed to save church information");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Let's personalize your REACH account</p>
          <p className="text-sm text-blue-800 mt-1">
            This information will appear on your public pages and communications.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Logo Upload */}
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Church Logo"
                className="w-32 h-32 object-contain rounded-lg"
              />
              <Button
                onClick={() => {
                  setLogoPreview(null);
                  setLogoFile(null);
                }}
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2"
              >
                ×
              </Button>
            </div>
          ) : (
            <Upload className="w-12 h-12 text-slate-400" />
          )}
          <div className="text-center">
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <div className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {logoPreview ? "Change Logo" : "Upload Church Logo"}
              </div>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
            </Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Church Name */}
        <div>
          <Label htmlFor="church_name" className="text-base font-semibold">
            Church Name *
          </Label>
          <Input
            id="church_name"
            value={formData.church_name}
            onChange={(e) => setFormData({ ...formData, church_name: e.target.value })}
            placeholder="e.g., Grace Community Church"
            className="mt-2"
          />
        </div>

        {/* Tagline */}
        <div>
          <Label htmlFor="tagline" className="text-base font-semibold">
            Tagline or Mission Statement
          </Label>
          <Input
            id="tagline"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="e.g., Loving God, Loving People"
            className="mt-2"
          />
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website_url" className="text-base font-semibold">
            Website URL
          </Label>
          <Input
            id="website_url"
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            placeholder="https://yourchurch.com"
            className="mt-2"
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-base font-semibold">
            Church Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="mt-2"
          />
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address" className="text-base font-semibold">
            Church Address
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main St, City, State 12345"
            rows={3}
            className="mt-2"
          />
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSave}
          disabled={isSaving || !formData.church_name}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Save & Continue
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}