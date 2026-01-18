import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
    MessageSquare, X, Send, Minimize2, Maximize2, 
    Search, User, Clock, Check, CheckCheck, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadUser();
        loadThreads();
    }, []);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            loadThreads();
        }
    }, [isOpen, isMinimized]);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = base44.entities.InAppMessage.subscribe((event) => {
            if (event.type === 'create') {
                const newMessage = event.data;
                
                // Update unread count if message is for current user and not from them
                if (newMessage.recipient_emails?.includes(currentUser.email) && 
                    newMessage.sender_email !== currentUser.email) {
                    setUnreadCount(prev => prev + 1);
                }

                // Refresh threads
                loadThreads();

                // If viewing the thread, add message
                if (selectedThread && newMessage.thread_id === selectedThread.id) {
                    setMessages(prev => [...prev, newMessage]);
                    scrollToBottom();
                }
            }
        });

        return unsubscribe;
    }, [currentUser, selectedThread]);

    useEffect(() => {
        if (selectedThread) {
            loadMessages(selectedThread.id);
        }
    }, [selectedThread]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadUser = async () => {
        const user = await base44.auth.me();
        setCurrentUser(user);
    };

    const loadThreads = async () => {
        if (!currentUser) {
            const user = await base44.auth.me();
            setCurrentUser(user);
            if (!user) return;
            
            const allThreads = await base44.entities.MessageThread.list('-last_message_date');
            const myThreads = allThreads.filter(t => 
                t.participant_emails?.includes(user.email)
            );
            setThreads(myThreads);

            // Calculate unread count
            const unread = myThreads.reduce((sum, thread) => {
                return sum + (thread.unread_count?.[user.email] || 0);
            }, 0);
            setUnreadCount(unread);
        } else {
            const allThreads = await base44.entities.MessageThread.list('-last_message_date');
            const myThreads = allThreads.filter(t => 
                t.participant_emails?.includes(currentUser.email)
            );
            setThreads(myThreads);

            // Calculate unread count
            const unread = myThreads.reduce((sum, thread) => {
                return sum + (thread.unread_count?.[currentUser.email] || 0);
            }, 0);
            setUnreadCount(unread);
        }
    };

    const loadMessages = async (threadId) => {
        const msgs = await base44.entities.InAppMessage.filter({ 
            thread_id: threadId 
        }, 'created_date');
        setMessages(msgs);

        // Mark as read
        const thread = threads.find(t => t.id === threadId);
        if (thread && thread.unread_count?.[currentUser.email] > 0) {
            await base44.entities.MessageThread.update(threadId, {
                unread_count: {
                    ...thread.unread_count,
                    [currentUser.email]: 0
                }
            });
            loadThreads();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async () => {
        if (!messageText.trim() || !selectedThread || isSending) return;

        setIsSending(true);
        try {
            const newMessage = await base44.entities.InAppMessage.create({
                thread_id: selectedThread.id,
                sender_email: currentUser.email,
                sender_name: currentUser.full_name,
                sender_role: currentUser.role,
                recipient_emails: selectedThread.participant_emails.filter(e => e !== currentUser.email),
                message_body: messageText,
                message_type: "general",
                sent_date: new Date().toISOString()
            });

            // Update thread
            await base44.entities.MessageThread.update(selectedThread.id, {
                last_message_date: new Date().toISOString(),
                last_message_preview: messageText.substring(0, 100),
                last_message_sender: currentUser.full_name,
                unread_count: {
                    ...selectedThread.unread_count,
                    ...Object.fromEntries(
                        selectedThread.participant_emails
                            .filter(e => e !== currentUser.email)
                            .map(e => [e, (selectedThread.unread_count?.[e] || 0) + 1])
                    )
                }
            });

            setMessageText("");
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
        } catch (error) {
            console.error("Send error:", error);
        } finally {
            setIsSending(false);
        }
    };

    const filteredThreads = threads.filter(thread => {
        if (!searchQuery) return true;
        return thread.thread_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               thread.participant_names?.some(name => 
                   name.toLowerCase().includes(searchQuery.toLowerCase())
               );
    });

    const getThreadName = (thread) => {
        if (thread.thread_name) return thread.thread_name;
        const otherParticipants = thread.participant_names?.filter((name, idx) => 
            thread.participant_emails[idx] !== currentUser?.email
        );
        return otherParticipants?.join(", ") || "Conversation";
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
        return `${Math.floor(diffMins / 1440)}d`;
    };

    if (!currentUser) return null;

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="h-16 w-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700"
                        >
                            <MessageSquare className="h-6 w-6" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Card className="w-[400px] h-[600px] shadow-2xl flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    <h3 className="font-semibold">Messages</h3>
                                    {unreadCount > 0 && (
                                        <Badge className="bg-white text-blue-600">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setIsMinimized(!isMinimized)}
                                        className="h-8 w-8 text-white hover:bg-blue-700"
                                    >
                                        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setIsOpen(false)}
                                        className="h-8 w-8 text-white hover:bg-blue-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {!isMinimized && (
                                <>
                                    {!selectedThread ? (
                                        /* Thread List */
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            <div className="p-3 border-b">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search conversations..."
                                                        className="pl-9 h-9"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto">
                                                {filteredThreads.length === 0 ? (
                                                    <div className="text-center py-8 text-slate-500">
                                                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">No conversations yet</p>
                                                    </div>
                                                ) : (
                                                    filteredThreads.map(thread => {
                                                        const hasUnread = thread.unread_count?.[currentUser.email] > 0;
                                                        return (
                                                            <div
                                                                key={thread.id}
                                                                onClick={() => setSelectedThread(thread)}
                                                                className={`p-3 border-b cursor-pointer hover:bg-slate-50 transition-colors ${
                                                                    hasUnread ? 'bg-blue-50' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                                        <User className="h-5 w-5 text-blue-600" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className={`font-medium text-sm truncate ${
                                                                                hasUnread ? 'text-blue-900' : 'text-slate-900'
                                                                            }`}>
                                                                                {getThreadName(thread)}
                                                                            </span>
                                                                            <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                                                                                {formatTime(thread.last_message_date)}
                                                                            </span>
                                                                        </div>
                                                                        <p className={`text-xs truncate ${
                                                                            hasUnread ? 'text-blue-700 font-medium' : 'text-slate-500'
                                                                        }`}>
                                                                            {thread.last_message_preview || "No messages yet"}
                                                                        </p>
                                                                    </div>
                                                                    {hasUnread && (
                                                                        <Badge className="bg-blue-600 text-white text-xs px-2">
                                                                            {thread.unread_count[currentUser.email]}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Conversation View */
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Conversation Header */}
                                            <div className="p-3 border-b flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedThread(null);
                                                        setMessages([]);
                                                    }}
                                                    className="h-8 w-8"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{getThreadName(selectedThread)}</p>
                                                </div>
                                            </div>

                                            {/* Messages */}
                                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                                {messages.map(msg => {
                                                    const isOwn = msg.sender_email === currentUser.email;
                                                    return (
                                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                                                {!isOwn && (
                                                                    <p className="text-xs text-slate-600 mb-1 ml-2">{msg.sender_name}</p>
                                                                )}
                                                                <div className={`rounded-2xl px-3 py-2 ${
                                                                    isOwn 
                                                                        ? 'bg-blue-600 text-white' 
                                                                        : 'bg-slate-100 text-slate-900'
                                                                }`}>
                                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message_body}</p>
                                                                </div>
                                                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                                    <span className="text-xs text-slate-500">
                                                                        {formatTime(msg.sent_date || msg.created_date)}
                                                                    </span>
                                                                    {isOwn && (
                                                                        msg.read_by?.length > 1 ? 
                                                                            <CheckCheck className="h-3 w-3 text-blue-600" /> :
                                                                            <Check className="h-3 w-3 text-slate-400" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Message Input */}
                                            <div className="p-3 border-t">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={messageText}
                                                        onChange={(e) => setMessageText(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                                        placeholder="Type a message..."
                                                        className="flex-1"
                                                        disabled={isSending}
                                                    />
                                                    <Button
                                                        onClick={sendMessage}
                                                        disabled={!messageText.trim() || isSending}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}