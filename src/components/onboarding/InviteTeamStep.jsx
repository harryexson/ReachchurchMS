import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, CheckCircle2, X, Info, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function InviteTeamStep({ onComplete }) {
  const [invites, setInvites] = useState([{ email: "", role: "user" }]);
  const [isSending, setIsSending] = useState(false);

  const addInvite = () => {
    setInvites([...invites, { email: "", role: "user" }]);
  };

  const removeInvite = (index) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const updateInvite = (index, field, value) => {
    const newInvites = [...invites];
    newInvites[index][field] = value;
    setInvites(newInvites);
  };

  const handleSendInvites = async () => {
    const validInvites = invites.filter((inv) => inv.email.trim());
    
    if (validInvites.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    setIsSending(true);
    try {
      let successCount = 0;
      
      for (const invite of validInvites) {
        try {
          await base44.users.inviteUser(invite.email, invite.role);
          successCount++;
        } catch (error) {
          console.error(`Failed to invite ${invite.email}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}!`);
        onComplete();
      } else {
        toast.error("Failed to send invitations");
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.error("Failed to send invitations");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Build your team</p>
          <p className="text-sm text-blue-800 mt-1">
            Invite staff members and volunteers to help manage your church operations.
          </p>
        </div>
      </div>

      <Card className="border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <AnimatePresence>
              {invites.map((invite, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3"
                >
                  <div className="flex-1">
                    <Label htmlFor={`email-${index}`} className="sr-only">
                      Email Address
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      placeholder="team.member@church.com"
                      value={invite.email}
                      onChange={(e) => updateInvite(index, "email", e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      value={invite.role}
                      onValueChange={(value) => updateInvite(index, "role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {invites.length > 1 && (
                    <Button
                      onClick={() => removeInvite(index)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              onClick={addInvite}
              variant="outline"
              className="w-full"
              disabled={invites.length >= 10}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Another Person
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-900 text-sm">Admin Role</p>
              <p className="text-xs text-green-800 mt-1">
                Full access to all features, settings, and member data
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 text-sm">Member Role</p>
              <p className="text-xs text-blue-800 mt-1">
                Limited access to view information and self-serve features
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <Button
            onClick={handleSendInvites}
            disabled={isSending}
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
          >
            <Mail className="w-5 h-5 mr-2" />
            {isSending ? "Sending Invites..." : "Send Invitations"}
          </Button>
        </motion.div>
        <Button
          onClick={onComplete}
          variant="outline"
          className="h-12"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}