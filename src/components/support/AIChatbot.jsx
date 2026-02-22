import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Loader2 } from "lucide-react";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        // Not authenticated - chatbot still works for public users
        setCurrentUser(null);
      }
    };
    loadUser();

    // Show welcome message
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: "👋 Hi! I'm your REACH Connect AI assistant. I can help you with:\n\n• Subscription plans and pricing\n• Billing and payment questions\n• Features and how to use them\n• Troubleshooting common issues\n\nWhat can I help you with today?",
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      // Build context about the user and their question
      const contextPrompt = `You are a helpful AI assistant for REACH Church Connect, a comprehensive church management platform.

SUBSCRIPTION PLANS:
- Starter Plan: $49/month - Up to 150 members, basic features, SMS/MMS limited, email support
- Growth Plan: $119/month - Up to 750 members, advanced features including video conferencing (25 participants), SMS (1000/month), MMS (10/month), automated workflows, priority support
- Premium Plan: $249/month - Unlimited members, all features including video (200 participants), unlimited SMS/MMS, multi-campus support, white-label, API access, dedicated account manager, phone support

KEY FEATURES:
- Member & Visitor Management
- Online Giving & Donation Tracking
- Event Management & Registration
- Kids Check-In System
- Text Messaging (SMS/MMS)
- Email Campaigns
- Video Meetings
- Sermon Library
- Volunteer Management
- Financial Reports
- Automated Workflows

BILLING & PRICING:
- 14-day free trial for all plans
- Monthly or annual billing (annual saves 17%)
- All major credit cards accepted
- Secure payment processing via Stripe
- Easy plan upgrades/downgrades

TROUBLESHOOTING COMMON ISSUES:
- Login problems: Check email/password, use "Forgot Password" link
- Payment issues: Verify card details, contact your bank
- SMS not sending: Check Sinch integration in settings
- Members not receiving emails: Check spam folder, verify email addresses
- Video not working: Allow camera/microphone permissions, use Chrome/Edge

SUPPORT:
- Email: support@reachchurchconnect.com
- Available Monday-Friday 9am-5pm EST
- Response time: Within 24 hours
- For urgent issues, contact human support

User question: "${newMessage}"

${currentUser ? `User context: ${currentUser.full_name} (${currentUser.email}), Role: ${currentUser.role}` : 'User is not logged in (public visitor)'}

Provide a helpful, friendly, and concise response. If the question requires human support (complex billing issues, account-specific problems, feature requests), recommend contacting support@reachchurchconnect.com. Keep responses under 200 words unless the user asks for detailed information.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
        add_context_from_internet: false
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your request right now. For immediate assistance, please contact our support team at support@reachchurchconnect.com or use the live chat to speak with a human agent.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "What are your pricing plans?",
    "How do I set up online giving?",
    "How does the free trial work?",
    "I need help with billing"
  ];

  const handleQuickAction = (question) => {
    setNewMessage(question);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transition-all hover:scale-110"
          title="AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 left-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col transition-all ${
          isMinimized ? "h-14" : "h-[600px]"
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-2 flex-1">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-purple-100">Always here to help</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-purple-500 p-1 rounded"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-purple-500 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      {msg.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-xs mt-1 ${
                        msg.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span className="text-sm text-slate-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 space-y-2">
                  <p className="text-xs text-slate-600 font-medium">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action)}
                        className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !newMessage.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Need to speak with a human? Contact <a href="mailto:support@reachchurchconnect.com" className="text-blue-600 hover:underline">support@reachchurchconnect.com</a>
                </p>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}