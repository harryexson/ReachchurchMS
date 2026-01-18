import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  Users, 
  MessageSquare, 
  Bell,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Megaphone,
  UsersRound
} from "lucide-react";
import BroadcastComposer from '@/components/messaging/BroadcastComposer';
import GroupChatCreator from '@/components/messaging/GroupChatCreator';

export default function AdminMessaging() {
  const [messageType, setMessageType] = useState("in_app");
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [sending, setSending] = useState(false);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [groupsData, membersData, messagesData] = await Promise.all([
      base44.entities.MemberGroup.list(),
      base44.entities.Member.list(),
      base44.entities.InAppMessage.list('-sent_date', 50)
    ]);
    
    setGroups(groupsData);
    setMembers(membersData);
    setSentMessages(messagesData);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    setSending(true);

    try {
      const user = await base44.auth.me();
      let recipientEmails = [];

      if (recipientType === "all") {
        recipientEmails = members.map(m => m.email);
      } else if (recipientType === "groups") {
        const selectedGroupMembers = await base44.entities.MemberGroupAssignment.filter({
          group_id: { $in: selectedGroups }
        });
        recipientEmails = [...new Set(selectedGroupMembers.map(m => m.member_email))];
      }

      if (messageType === "in_app") {
        await base44.entities.InAppMessage.create({
          subject: subject,
          message_body: message,
          sender_email: user.email,
          sender_name: user.full_name,
          sender_role: "admin",
          recipient_emails: recipientEmails,
          message_type: "announcement",
          status: "sent",
          sent_date: new Date().toISOString()
        });
      } else if (messageType === "push") {
        await base44.functions.invoke('sendPushNotification', {
          title: subject,
          body: message,
          targetUsers: recipientEmails
        });
      }

      alert(`Message sent to ${recipientEmails.length} recipient(s)!`);
      setSubject("");
      setMessage("");
      loadData();
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send message: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = sentMessages.filter(msg => {
    if (filterStatus === "all") return true;
    return msg.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Messaging Center</h1>
            <p className="text-slate-600 mt-1">Send messages and notifications to your members</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBroadcast(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Broadcast
            </Button>
            <Button
              onClick={() => setShowGroupChat(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <UsersRound className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Compose Message */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>Message Type</Label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_app">In-App Message</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Recipients</Label>
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="groups">Specific Groups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipientType === "groups" && (
                  <div>
                    <Label>Select Groups</Label>
                    <div className="space-y-2 mt-2">
                      {groups.map(group => (
                        <label key={group.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroups([...selectedGroups, group.id]);
                              } else {
                                setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{group.group_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Subject / Title</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter message subject"
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Members</p>
                    <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Messages Sent</p>
                    <p className="text-2xl font-bold text-slate-900">{sentMessages.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Member Groups</p>
                    <p className="text-2xl font-bold text-slate-900">{groups.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Messages */}
        <Card className="shadow-xl">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                Recent Messages
              </span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {filteredMessages.slice(0, 10).map(msg => (
                <div key={msg.id} className="p-4 rounded-lg border bg-white hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{msg.subject}</h3>
                    <Badge className={
                      msg.status === 'sent' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }>
                      {msg.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">{msg.message_body}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>To: {msg.recipient_emails?.length || 0} recipients</span>
                    <span>{new Date(msg.sent_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {filteredMessages.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No messages yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Broadcast Composer */}
        <BroadcastComposer
          open={showBroadcast}
          onOpenChange={setShowBroadcast}
          onSuccess={loadData}
        />

        {/* Group Chat Creator */}
        <GroupChatCreator
          open={showGroupChat}
          onOpenChange={setShowGroupChat}
          onSuccess={loadData}
        />
      </div>
    </div>
  );
}