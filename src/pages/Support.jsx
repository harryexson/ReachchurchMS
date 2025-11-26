import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    MessageCircle, Send, Ticket, Phone, Mail, Clock, 
    CheckCircle, HelpCircle, AlertTriangle, Loader2,
    Bot, User, ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const faqItems = [
    {
        question: "How do I reset my password?",
        answer: "Click on 'Sign In' and then 'Forgot Password'. Enter your email address and we'll send you a reset link."
    },
    {
        question: "How do I connect my bank account for donations?",
        answer: "Go to Settings → Giving → 'Connect Bank Account'. Follow the Stripe Connect wizard to securely link your account."
    },
    {
        question: "Can I import members from another system?",
        answer: "Yes! Go to Members → Import and upload a CSV file. We support imports from most church management systems."
    },
    {
        question: "How do I set up SMS messaging?",
        answer: "Go to Settings → SMS/Sinch tab. Enter your Sinch credentials and phone number, then create keywords in the Text Messaging section."
    },
    {
        question: "What's included in each subscription tier?",
        answer: "Visit our Pricing page to see a detailed comparison of Starter, Growth, and Premium plans with all features listed."
    }
];

export default function SupportPage() {
    const [activeTab, setActiveTab] = useState("chat");
    const [chatMessages, setChatMessages] = useState([
        { role: "assistant", content: "Hello! I'm your REACH Church Connect support assistant. How can I help you today?" }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    const [ticketForm, setTicketForm] = useState({
        name: "",
        email: "",
        churchName: "",
        category: "",
        priority: "medium",
        subject: "",
        description: ""
    });
    const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
    const [ticketSubmitted, setTicketSubmitted] = useState(false);

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage = chatInput.trim();
        setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setChatInput("");
        setIsChatLoading(true);

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are a helpful support assistant for REACH Church Connect, a church management software platform. 
                
Answer the following customer question helpfully and concisely. If you don't know the specific answer, suggest they submit a support ticket or contact support@reachchurchMS.com.

Key features of REACH Church Connect:
- Member management
- Online giving and donations
- Event management
- SMS/text messaging with keywords
- Kids check-in
- Volunteer management
- Sermon library
- Financial reporting

Customer question: ${userMessage}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        answer: { type: "string" }
                    }
                }
            });

            setChatMessages(prev => [...prev, { role: "assistant", content: response.answer }]);
        } catch (error) {
            setChatMessages(prev => [...prev, { 
                role: "assistant", 
                content: "I apologize, but I'm having trouble processing your request. Please try again or submit a support ticket for personalized assistance." 
            }]);
        }

        setIsChatLoading(false);
    };

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingTicket(true);

        try {
            await base44.integrations.Core.SendEmail({
                to: "support@reachchurchMS.com",
                subject: `[${ticketForm.priority.toUpperCase()}] ${ticketForm.category}: ${ticketForm.subject}`,
                body: `
Support Ticket Submission

Contact Information:
- Name: ${ticketForm.name}
- Email: ${ticketForm.email}
- Church: ${ticketForm.churchName}

Ticket Details:
- Category: ${ticketForm.category}
- Priority: ${ticketForm.priority}
- Subject: ${ticketForm.subject}

Description:
${ticketForm.description}

---
Submitted via REACH Church Connect Support Portal
                `
            });

            setTicketSubmitted(true);
            setTicketForm({
                name: "",
                email: "",
                churchName: "",
                category: "",
                priority: "medium",
                subject: "",
                description: ""
            });
        } catch (error) {
            console.error("Failed to submit ticket:", error);
            alert("Failed to submit ticket. Please email support@reachchurchMS.com directly.");
        }

        setIsSubmittingTicket(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">How Can We Help?</h1>
                    <p className="text-xl text-blue-100">
                        Get support through our AI assistant, submit a ticket, or browse FAQs
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Contact Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="border-0 shadow-lg text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Email Support</h3>
                            <a href="mailto:support@reachchurchMS.com" className="text-blue-600 hover:underline">
                                support@reachchurchMS.com
                            </a>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Support Hours</h3>
                            <p className="text-slate-600">Mon-Fri: 8am - 6pm EST</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg text-center">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Average Response</h3>
                            <p className="text-slate-600">Within 24 hours</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <Button
                        variant={activeTab === "chat" ? "default" : "outline"}
                        onClick={() => setActiveTab("chat")}
                        className={activeTab === "chat" ? "bg-blue-600" : ""}
                    >
                        <Bot className="w-4 h-4 mr-2" />
                        AI Assistant
                    </Button>
                    <Button
                        variant={activeTab === "ticket" ? "default" : "outline"}
                        onClick={() => setActiveTab("ticket")}
                        className={activeTab === "ticket" ? "bg-blue-600" : ""}
                    >
                        <Ticket className="w-4 h-4 mr-2" />
                        Submit Ticket
                    </Button>
                    <Button
                        variant={activeTab === "faq" ? "default" : "outline"}
                        onClick={() => setActiveTab("faq")}
                        className={activeTab === "faq" ? "bg-blue-600" : ""}
                    >
                        <HelpCircle className="w-4 h-4 mr-2" />
                        FAQs
                    </Button>
                </div>

                {/* Chat Tab */}
                {activeTab === "chat" && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-blue-600" />
                                AI Support Assistant
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-slate-50">
                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-3 mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-4 h-4 text-blue-600" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] p-3 rounded-lg ${
                                                msg.role === "user"
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white border shadow-sm"
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        {msg.role === "user" && (
                                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-slate-600" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="bg-white border shadow-sm p-3 rounded-lg">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleChatSubmit} className="flex gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type your question..."
                                    disabled={isChatLoading}
                                />
                                <Button type="submit" disabled={isChatLoading} className="bg-blue-600 hover:bg-blue-700">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                            <p className="text-xs text-slate-500 mt-2">
                                For complex issues, please submit a support ticket for personalized assistance.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Ticket Tab */}
                {activeTab === "ticket" && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-blue-600" />
                                Submit a Support Ticket
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ticketSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Ticket Submitted!</h3>
                                    <p className="text-slate-600 mb-4">
                                        We've received your support request and will respond within 24 hours.
                                    </p>
                                    <Button onClick={() => setTicketSubmitted(false)}>Submit Another Ticket</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleTicketSubmit} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">Your Name *</Label>
                                            <Input
                                                id="name"
                                                value={ticketForm.name}
                                                onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={ticketForm.email}
                                                onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="churchName">Church Name</Label>
                                        <Input
                                            id="churchName"
                                            value={ticketForm.churchName}
                                            onChange={(e) => setTicketForm({ ...ticketForm, churchName: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Category *</Label>
                                            <Select
                                                value={ticketForm.category}
                                                onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="technical">Technical Issue</SelectItem>
                                                    <SelectItem value="billing">Billing Question</SelectItem>
                                                    <SelectItem value="feature">Feature Request</SelectItem>
                                                    <SelectItem value="account">Account Help</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Priority</Label>
                                            <Select
                                                value={ticketForm.priority}
                                                onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            value={ticketForm.subject}
                                            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                            placeholder="Brief description of your issue"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea
                                            id="description"
                                            value={ticketForm.description}
                                            onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                                            placeholder="Please provide as much detail as possible..."
                                            rows={6}
                                            required
                                        />
                                    </div>

                                    <Button type="submit" disabled={isSubmittingTicket} className="w-full bg-blue-600 hover:bg-blue-700">
                                        {isSubmittingTicket ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Submit Ticket
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* FAQ Tab */}
                {activeTab === "faq" && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-blue-600" />
                                Frequently Asked Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {faqItems.map((faq, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <h4 className="font-semibold text-slate-900 mb-2">{faq.question}</h4>
                                        <p className="text-slate-600">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
                                <p className="text-slate-700 mb-4">Can't find what you're looking for?</p>
                                <Button onClick={() => setActiveTab("ticket")} className="bg-blue-600 hover:bg-blue-700">
                                    Submit a Support Ticket
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}