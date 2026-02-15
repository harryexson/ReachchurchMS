import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Upload, Plus, CheckCircle2, Info, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function MembersSetupStep({ onComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      // Extract member data from CSV/Excel
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "object",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
          },
        },
      });

      if (extractResult.status === "success" && extractResult.output) {
        const members = Array.isArray(extractResult.output) ? extractResult.output : [extractResult.output];
        
        // Bulk create members
        await base44.entities.Member.bulkCreate(
          members.map((m) => ({
            first_name: m.first_name,
            last_name: m.last_name,
            email: m.email,
            phone: m.phone,
            member_status: "member",
          }))
        );

        setMemberCount(members.length);
        toast.success(`Successfully imported ${members.length} members!`);
        onComplete();
      } else {
        toast.error("Failed to extract member data from file");
      }
    } catch (error) {
      console.error("Error uploading members:", error);
      toast.error("Failed to import members");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Import your congregation</p>
          <p className="text-sm text-blue-800 mt-1">
            Upload a CSV or Excel file with member information, or add them manually later.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upload Members */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
        >
          <Label htmlFor="member-upload" className="cursor-pointer">
            <div className="text-center space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto" />
              <div>
                <p className="font-semibold text-blue-900">Upload Member List</p>
                <p className="text-sm text-blue-700 mt-1">CSV or Excel file</p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Choose File"}
              </Button>
            </div>
          </Label>
          <Input
            id="member-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </motion.div>

        {/* Add Manually */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            window.open(createPageUrl("Members"), "_blank");
            toast.success("Members page opened in new tab");
          }}
          className="p-6 border-2 border-dashed border-green-300 rounded-lg bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
        >
          <div className="text-center space-y-3">
            <Plus className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <p className="font-semibold text-green-900">Add Manually</p>
              <p className="text-sm text-green-700 mt-1">Enter member details one by one</p>
            </div>
            <Button variant="outline" className="w-full">
              Open Members Page
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Download Template */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-sm font-medium text-slate-700 mb-2">
          Need a template?
        </p>
        <p className="text-xs text-slate-600 mb-3">
          Download our sample CSV template with the correct column format:
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const csv = "first_name,last_name,email,phone\nJohn,Doe,john@example.com,(555) 123-4567\nJane,Smith,jane@example.com,(555) 987-6543";
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "member_template.csv";
            a.click();
          }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      <Button
        onClick={onComplete}
        className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        {memberCount > 0 ? `Continue (${memberCount} members imported)` : "Skip for Now"}
      </Button>
    </div>
  );
}