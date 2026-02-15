import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Send, CheckCircle2, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function FirstCampaignStep({ onComplete }) {
  const [subject, setSubject] = useState("Welcome to Our Church Family! 🎉");
  const [message, setMessage] = useState(
    "Dear Church Family,\n\nWe're excited to stay connected with you through our new church management system! You'll now receive:\n\n• Weekly service updates\n• Event invitations\n• Prayer requests\n• Important announcements\n\nBlessings,\nYour Church Leadership"
  );
  const [isSending, setIsSending] = useState(false);
  const [useAI, setUseAI] = useState(false);

  const handleGenerateAI = async () => {
    setUseAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a warm, friendly welcome email for a church announcing their new church management system. Keep it under 200 words. Include mentions of staying connected, upcoming features like events and prayer requests. Make it personal and welcoming.`,
      });
      setMessage(result);
      toast.success("AI-generated message created!");
    } catch (error) {
      console.error("Error generating message:", error);
      toast.error("Failed to generate AI message");
    } finally {
      setUseAI(false);
    }
  };

  const handleSendTest = async () => {
    setIsSending(true);
    try {
      const user = await base44.auth.me();
      
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `[TEST] ${subject}`,
        body: message,
      });

      toast.success("Test email sent to your inbox!");
    } catch (error) {
      console.error("Error sending test:", error);
      toast.error("Failed to send test email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Send your first message</p>
          <p className="text-sm text-blue-800 mt-1">
            Let your congregation know about your new communication system with a welcome message.
          </p>
        </div>
      </div>

      <Card className="border-2 border-blue-200">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="subject" className="text-base font-semibold">
              Email Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="message" className="text-base font-semibold">
                Message
              </Label>
              <Button
                onClick={handleGenerateAI}
                disabled={useAI}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {useAI ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="mt-2"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSendTest}
              disabled={isSending}
              variant="outline"
              className="flex-1"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isSending ? "Sending..." : "Send Test to Me"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-900">
          <strong>Pro tip:</strong> Send a test email to yourself first to preview how it looks.
          You can send the full campaign to your members from the Communication Hub later.
        </p>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onComplete}
          className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Continue
        </Button>
      </motion.div>
    </div>
  );
}