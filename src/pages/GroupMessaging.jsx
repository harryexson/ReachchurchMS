import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Users, Calendar, Heart, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function GroupMessaging() {
  const [formData, setFormData] = useState({
    group_type: "all_members",
    group_id: "",
    message_subject: "",
    message_body: "",
    send_sms: false
  });
  const [loading, setLoading] = useState(false);

  const { data: servicePlans = [] } = useQuery({
    queryKey: ['servicePlans'],
    queryFn: () => base44.entities.ServicePlan.list('-service_date'),
  });

  const { data: memberGroups = [] } = useQuery({
    queryKey: ['memberGroups'],
    queryFn: () => base44.entities.MemberGroup.list(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await base44.functions.invoke('sendGroupMessage', formData);
      toast.success(`Message sent to ${response.emails_sent} recipients!`);
      
      // Reset form
      setFormData({
        group_type: "all_members",
        group_id: "",
        message_subject: "",
        message_body: "",
        send_sms: false
      });
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Group Messaging</h1>
          <p className="text-slate-600">Send emails and SMS to specific groups</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Send To *</Label>
                <select
                  value={formData.group_type}
                  onChange={(e) => setFormData({ ...formData, group_type: e.target.value, group_id: "" })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="all_members">All Members</option>
                  <option value="service_team">Service Team</option>
                  <option value="member_group">Member Group</option>
                  <option value="volunteers">All Volunteers</option>
                </select>
              </div>

              {formData.group_type === 'service_team' && (
                <div>
                  <Label>Select Service *</Label>
                  <select
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Choose service...</option>
                    {servicePlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.title} - {new Date(plan.service_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.group_type === 'member_group' && (
                <div>
                  <Label>Select Group *</Label>
                  <select
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Choose group...</option>
                    {memberGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>Subject *</Label>
                <Input
                  value={formData.message_subject}
                  onChange={(e) => setFormData({ ...formData, message_subject: e.target.value })}
                  placeholder="Message subject"
                  required
                />
              </div>

              <div>
                <Label>Message *</Label>
                <ReactQuill
                  value={formData.message_body}
                  onChange={(value) => setFormData({ ...formData, message_body: value })}
                  className="bg-white rounded-lg"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>

              <div className="flex items-center gap-2 bg-blue-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="send_sms"
                  checked={formData.send_sms}
                  onChange={(e) => setFormData({ ...formData, send_sms: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="send_sms" className="cursor-pointer">
                  Also send as SMS (to members with phone numbers)
                </Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start">
                <Users className="w-5 h-5 mr-2" />
                Message All Members
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="w-5 h-5 mr-2" />
                Message Service Team
              </Button>
              <Button variant="outline" className="justify-start">
                <Heart className="w-5 h-5 mr-2" />
                Message Volunteers
              </Button>
              <Button variant="outline" className="justify-start">
                <MessageSquare className="w-5 h-5 mr-2" />
                Message Group
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}