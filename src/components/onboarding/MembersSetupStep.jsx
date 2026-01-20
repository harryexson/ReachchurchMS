import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, Plus, HelpCircle } from "lucide-react";

export default function MembersSetupStep({ onComplete }) {
  const [importMethod, setImportMethod] = useState("manual");
  const [manualMembers, setManualMembers] = useState([
    { first_name: "", last_name: "", email: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAddMember = () => {
    setManualMembers([...manualMembers, { first_name: "", last_name: "", email: "" }]);
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...manualMembers];
    updated[index][field] = value;
    setManualMembers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const validMembers = manualMembers.filter(
        (m) => m.first_name && m.last_name && m.email
      );

      if (validMembers.length === 0) {
        setSuccess(true);
        onComplete();
        return;
      }

      // Create members
      const membersToCreate = validMembers.map((m) => ({
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        member_status: "member",
      }));

      await base44.entities.Member.bulkCreate(membersToCreate);

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
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Members Added!</h3>
        <p className="text-slate-600">Your members have been successfully added to the system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            You can add members now or skip this step. You can always import members later in the Members section.
          </p>
        </div>
      </div>

      {/* Method Selection */}
      <div className="space-y-3">
        <Label className="font-semibold text-slate-900">How would you like to add members?</Label>
        <div className="grid gap-3">
          <div
            onClick={() => setImportMethod("manual")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              importMethod === "manual"
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <div>
                <p className="font-semibold text-slate-900">Add Manually</p>
                <p className="text-sm text-slate-600">Add members one by one</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setImportMethod("later")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              importMethod === "later"
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5" />
              <div>
                <p className="font-semibold text-slate-900">Do This Later</p>
                <p className="text-sm text-slate-600">Skip for now and import in bulk later</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {importMethod === "manual" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {manualMembers.map((member, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
                <p className="text-sm font-medium text-slate-700">Member {index + 1}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">First Name</Label>
                    <Input
                      placeholder="First"
                      value={member.first_name}
                      onChange={(e) => handleMemberChange(index, "first_name", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Last Name</Label>
                    <Input
                      placeholder="Last"
                      value={member.last_name}
                      onChange={(e) => handleMemberChange(index, "last_name", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddMember}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Member
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Adding Members..." : "Add Members"}
          </Button>
        </form>
      )}

      {importMethod === "later" && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">⏭️</div>
          <p className="text-slate-600 mb-4">No problem! You can import members anytime from the Members page.</p>
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
          You can bulk import members later using a CSV file. This makes it easy to import your entire congregation at once.
        </p>
      </div>
    </div>
  );
}