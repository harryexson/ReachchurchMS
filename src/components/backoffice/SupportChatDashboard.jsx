import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SupportChatDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("open");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Load conversations
        const convs = await base44.entities.SupportChat.filter(
          { status: filterStatus },
          "-last_message_time",
          100
        );

        // Group by conversation_id and get latest message for each
        const grouped = {};
        convs.forEach((msg) => {
          if (!grouped[msg.conversation_id]) {
            grouped[msg.conversation_id] = msg;
          } else if (new Date(msg.created_date) > new Date(grouped[msg.conversation_id].created_date)) {
            grouped[msg.conversation_id] = msg;
          }
        });

        const uniqueConversations = Object.values(grouped);
        setConversations(uniqueConversations);

        if (selectedConversation && !uniqueConversations.find(c => c.conversation_id === selectedConversation.conversation_id)) {
          setSelectedConversation(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.SupportChat.subscribe((event) => {
      if (event.type === "create" || event.type === "update") {
        queryClient.invalidateQueries({ queryKey: ["support_chats"] });
        loadData();
      }
    });

    return () => unsubscribe();
  }, [filterStatus, selectedConversation]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;

      try {
        const msgs = await base44.entities.SupportChat.filter(
          { conversation_id: selectedConversation.conversation_id },
          "created_date",
          200
        );
        setMessages(msgs);

        // Mark all as read by support
        msgs.forEach((msg) => {
          if (!msg.read_by_support) {
            base44.entities.SupportChat.update(msg.id, { read_by_support: true });
          }
        });
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();

    // Subscribe to messages for this conversation
    const unsubscribe = base44.entities.SupportChat.subscribe((event) => {
      if (event.data.conversation_id === selectedConversation?.conversation_id) {
        if (event.type === "create" || event.type === "update") {
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === event.data.id);
            if (exists) {
              return prev.map((m) => (m.id === event.data.id ? event.data : m));
            }
            return [...prev, event.data];
          });
        }
      }
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || !selectedConversation || !currentUser) return;

    setIsLoading(true);
    try {
      await base44.entities.SupportChat.create({
        conversation_id: selectedConversation.conversation_id,
        user_email: selectedConversation.user_email,
        user_name: selectedConversation.user_name,
        church_name: selectedConversation.church_name,
        message: newReply,
        message_type: "support",
        status: selectedConversation.status,
        assigned_to: currentUser.email,
        last_message_time: new Date().toISOString(),
      });

      setNewReply("");
      queryClient.invalidateQueries({ queryKey: ["support_chats"] });
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveConversation = async () => {
    if (!selectedConversation) return;

    try {
      // Find and update the conversation status
      const convMessages = await base44.entities.SupportChat.filter({
        conversation_id: selectedConversation.conversation_id,
      });

      for (const msg of convMessages) {
        await base44.entities.SupportChat.update(msg.id, {
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: currentUser.email,
        });
      }

      setSelectedConversation(null);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["support_chats"] });
    } catch (error) {
      console.error("Error resolving conversation:", error);
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedConversation || !currentUser) return;

    try {
      const convMessages = await base44.entities.SupportChat.filter({
        conversation_id: selectedConversation.conversation_id,
      });

      for (const msg of convMessages) {
        await base44.entities.SupportChat.update(msg.id, {
          assigned_to: currentUser.email,
          status: "in_progress",
        });
      }

      setSelectedConversation((prev) => ({
        ...prev,
        assigned_to: currentUser.email,
        status: "in_progress",
      }));
      queryClient.invalidateQueries({ queryKey: ["support_chats"] });
    } catch (error) {
      console.error("Error assigning conversation:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Support Chats
            </CardTitle>
            <div className="mt-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedConversation?.conversation_id === conv.conversation_id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm truncate">{conv.user_name}</p>
                    <Badge className={`text-xs ${
                      conv.status === "open"
                        ? "bg-blue-100 text-blue-800"
                        : conv.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {conv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{conv.user_email}</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{conv.message}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(conv.created_date).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Details */}
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle>{selectedConversation.user_name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{selectedConversation.user_email}</p>
                  {selectedConversation.church_name && (
                    <p className="text-sm text-slate-600">{selectedConversation.church_name}</p>
                  )}
                </div>
                <Badge className={`${
                  selectedConversation.status === "open"
                    ? "bg-blue-100 text-blue-800"
                    : selectedConversation.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {selectedConversation.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                {selectedConversation.status !== "resolved" && (
                  <>
                    {!selectedConversation.assigned_to && (
                      <Button size="sm" onClick={handleAssignToMe}>
                        Assign to Me
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResolveConversation}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.message_type === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      msg.message_type === "user"
                        ? "bg-slate-100 text-slate-900"
                        : msg.message_type === "support"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {msg.message}
                    <div className={`text-xs mt-1 ${
                      msg.message_type === "support"
                        ? "text-blue-100"
                        : "text-slate-500"
                    }`}>
                      {new Date(msg.created_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            {selectedConversation.status !== "resolved" && (
              <form onSubmit={handleSendReply} className="border-t border-slate-200 p-4">
                <div className="space-y-2">
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Type your response..."
                    disabled={isLoading}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading || !newReply.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent className="text-center text-slate-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Select a conversation to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}