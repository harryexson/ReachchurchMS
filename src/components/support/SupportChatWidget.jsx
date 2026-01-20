import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Minimize2, Maximize2, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversationStatus, setConversationStatus] = useState("open");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initChat = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Create or get conversation ID from localStorage
        let convId = localStorage.getItem("support_conversation_id");
        if (!convId) {
          convId = `conv_${user.email}_${Date.now()}`;
          localStorage.setItem("support_conversation_id", convId);
        }
        setConversationId(convId);

        // Load existing messages for this conversation
        const existingMessages = await base44.entities.SupportChat.filter({
          conversation_id: convId,
        }, "-created_date", 50);
        
        setMessages(existingMessages);
        if (existingMessages.length > 0) {
          setConversationStatus(existingMessages[0].status);
        }

        // Subscribe to real-time updates
        const unsubscribe = base44.entities.SupportChat.subscribe((event) => {
          if (event.data.conversation_id === convId) {
            if (event.type === "create" || event.type === "update") {
              setMessages((prev) => {
                const exists = prev.find((m) => m.id === event.data.id);
                if (exists) {
                  return prev.map((m) => (m.id === event.data.id ? event.data : m));
                }
                return [...prev, event.data];
              });
              setConversationStatus(event.data.status);
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    const unsub = initChat();
    return () => {
      unsub?.then((fn) => fn?.());
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !currentUser) return;

    setIsLoading(true);
    try {
      await base44.entities.SupportChat.create({
        conversation_id: conversationId,
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        message: newMessage,
        message_type: "user",
        status: conversationStatus,
        last_message_time: new Date().toISOString(),
      });

      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["support_chats"] });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-110"
          title="Open support chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col transition-all ${
          isMinimized ? "h-14" : "h-[600px]"
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex-1">
              <h3 className="font-semibold">Support Chat</h3>
              <p className="text-xs text-blue-100">
                {conversationStatus === "resolved" ? "Issue Resolved ✓" : "Online"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-blue-500 p-1 rounded"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-500 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Start a conversation with our support team</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.message_type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                          msg.message_type === "user"
                            ? "bg-blue-600 text-white"
                            : msg.message_type === "support"
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-100 text-slate-600 italic"
                        }`}
                      >
                        {msg.message}
                        <div className={`text-xs mt-1 ${
                          msg.message_type === "user"
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
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {conversationStatus !== "closed" ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg text-center text-sm text-slate-600">
                  This conversation has been closed
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}