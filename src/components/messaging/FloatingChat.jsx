import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
    MessageSquare, X, Send, Minimize2, Maximize2, 
    Search, User, Clock, Check, CheckCheck, Users, Mic, Image, Smile, Camera
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";

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
    const [isTyping, setIsTyping] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const inputRef = useRef(null);

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
                       className="fixed bottom-6 right-6 z-50 md:w-[400px] w-screen md:h-[600px] h-screen md:rounded-lg rounded-none"
                    >
                       <Card className="w-full h-full shadow-2xl flex flex-col overflow-hidden">
                            {/* Header - Native Style */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                                <div className="flex items-center gap-3">
                                    {selectedThread && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setSelectedThread(null)}
                                            className="h-9 w-9 text-white hover:bg-white/10 md:hidden"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <MessageSquare className="h-6 w-6" />
                                            {unreadCount > 0 && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold"
                                                >
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </motion.div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg leading-tight">
                                                {selectedThread ? getThreadName(selectedThread) : 'Messages'}
                                            </h3>
                                            {selectedThread && isTyping && (
                                                <motion.p 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-xs text-blue-100"
                                                >
                                                    typing...
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setIsMinimized(!isMinimized)}
                                        className="h-9 w-9 text-white hover:bg-white/10 hidden md:flex"
                                    >
                                        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setIsOpen(false)}
                                        className="h-9 w-9 text-white hover:bg-white/10"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {!isMinimized && (
                                <>
                                    {!selectedThread ? (
                                        /* Thread List - Native Style */
                                        <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                            <div className="p-4 bg-slate-50 border-b">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search conversations..."
                                                        className="pl-11 h-10 bg-white rounded-full border-0 shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto overscroll-contain">
                                                {filteredThreads.length === 0 ? (
                                                    <div className="text-center py-8 text-slate-500">
                                                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">No conversations yet</p>
                                                    </div>
                                                ) : (
                                                    filteredThreads.map(thread => {
                                                        const hasUnread = thread.unread_count?.[currentUser.email] > 0;
                                                        return (
                                                            <motion.div
                                                                key={thread.id}
                                                                whileTap={{ scale: 0.98 }}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                onClick={() => setSelectedThread(thread)}
                                                                className={`px-4 py-3 border-b border-slate-100 cursor-pointer active:bg-slate-100 transition-colors ${
                                                                    hasUnread ? 'bg-blue-50/50' : 'bg-white'
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="relative flex-shrink-0">
                                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                                                            <span className="text-white font-semibold text-lg">
                                                                                {getThreadName(thread)[0]?.toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        {hasUnread && (
                                                                            <motion.div 
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: 1 }}
                                                                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className={`font-semibold text-[15px] truncate ${
                                                                                hasUnread ? 'text-slate-900' : 'text-slate-800'
                                                                            }`}>
                                                                                {getThreadName(thread)}
                                                                            </span>
                                                                            <span className="text-xs text-slate-500 ml-2 flex-shrink-0 font-medium">
                                                                                {formatTime(thread.last_message_date)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <p className={`text-sm truncate ${
                                                                                hasUnread ? 'text-slate-800 font-medium' : 'text-slate-500'
                                                                            }`}>
                                                                                {thread.last_message_preview || "No messages yet"}
                                                                            </p>
                                                                            {hasUnread && (
                                                                                <motion.div
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="ml-2 flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm"
                                                                                >
                                                                                    {thread.unread_count[currentUser.email] > 99 ? '99+' : thread.unread_count[currentUser.email]}
                                                                                </motion.div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Conversation View - WhatsApp Style */
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Messages - Native Chat Bubbles */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-slate-50 to-white overscroll-contain" 
                                                 style={{ 
                                                     backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.02"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                                                 }}>
                                                <AnimatePresence>
                                                {messages.map((msg, index) => {
                                                    const isOwn = msg.sender_email === currentUser.email;
                                                    const showAvatar = index === 0 || messages[index - 1].sender_email !== msg.sender_email;
                                                    const showName = !isOwn && showAvatar;
                                                    
                                                    return (
                                                        <motion.div 
                                                            key={msg.id}
                                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                                            className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            {!isOwn && (
                                                                <div className="w-8 h-8 flex-shrink-0">
                                                                    {showAvatar && (
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                                                                            <span className="text-white text-xs font-semibold">
                                                                                {msg.sender_name?.[0] || 'U'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                                                {showName && (
                                                                    <span className="text-[11px] text-slate-600 font-medium mb-1 px-3">
                                                                        {msg.sender_name}
                                                                    </span>
                                                                )}
                                                                <motion.div 
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className={`relative group ${
                                                                        isOwn 
                                                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[18px] rounded-tr-sm shadow-md' 
                                                                            : 'bg-white text-slate-900 rounded-[18px] rounded-tl-sm shadow-sm border border-slate-100'
                                                                    } px-3 py-2`}
                                                                >
                                                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                                                        {msg.message_body}
                                                                    </p>
                                                                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                                                                        isOwn ? 'text-blue-100' : 'text-slate-400'
                                                                    }`}>
                                                                        <span className="text-[11px]">
                                                                            {formatTime(msg.sent_date || msg.created_date)}
                                                                        </span>
                                                                        {isOwn && (
                                                                            msg.read_by?.length > 1 ? 
                                                                                <CheckCheck className="h-3.5 w-3.5 text-blue-200" /> :
                                                                                <Check className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                                </AnimatePresence>
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Message Input - Native Style */}
                                            <div className="p-3 bg-white border-t border-slate-200">
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1 relative">
                                                        <Input
                                                            ref={inputRef}
                                                            value={messageText}
                                                            onChange={(e) => setMessageText(e.target.value)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    sendMessage();
                                                                }
                                                            }}
                                                            placeholder="Message"
                                                            className="flex-1 rounded-full bg-slate-100 border-0 py-2.5 px-4 pr-10 focus-visible:ring-1 focus-visible:ring-blue-500"
                                                            disabled={isSending}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-500 hover:text-slate-700"
                                                        >
                                                            <Smile className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                    <motion.div whileTap={{ scale: 0.9 }}>
                                                        <Button
                                                            onClick={sendMessage}
                                                            disabled={!messageText.trim() || isSending}
                                                            size="icon"
                                                            className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg disabled:opacity-50"
                                                        >
                                                            {isSending ? (
                                                                <motion.div
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                                >
                                                                    <Clock className="h-5 w-5" />
                                                                </motion.div>
                                                            ) : (
                                                                <Send className="h-5 w-5" />
                                                            )}
                                                        </Button>
                                                    </motion.div>
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