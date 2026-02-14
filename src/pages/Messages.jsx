import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';
import { 
    MessageSquare, Send, Users, Search, Loader2, 
    Plus, ArrowLeft, Paperclip, AlertCircle, Bell,
    Check, CheckCheck, UserPlus, Link as LinkIcon, Inbox,
    Star, Archive, Trash2, MailOpen, Mail, Clock,
    Filter, RefreshCw, MoreVertical, Flag, Reply, Forward,
    UsersRound, Megaphone
} from 'lucide-react';
import GroupChatCreator from '@/components/messaging/GroupChatCreator';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function MessagesPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [newMessageBody, setNewMessageBody] = useState('');
    const [newMessageSubject, setNewMessageSubject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [allMembers, setAllMembers] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [filter, setFilter] = useState('all'); // all, unread, starred
    const [starredThreads, setStarredThreads] = useState([]);
    const [showGroupCreator, setShowGroupCreator] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        
        // Set up real-time subscription for new messages
        const unsubscribe = base44.entities.InAppMessage.subscribe((event) => {
            if (event.type === 'create') {
                const message = event.data;
                if (message.recipient_emails?.includes(currentUser?.email)) {
                    loadData();
                }
            }
        });

        return unsubscribe;
    }, [currentUser]);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            if (!user) {
                toast.error('Please log in to view messages');
                setIsLoading(false);
                return;
            }
            setCurrentUser(user);

            // Load threads where user is a participant
            const allThreads = await base44.entities.MessageThread.filter({});
            const myThreads = allThreads.filter(t => 
                Array.isArray(t.participant_emails) && 
                t.participant_emails.includes(user.email) && 
                !t.is_archived
            );
            
            setThreads(myThreads.sort((a, b) => {
                const dateA = a.last_message_date ? new Date(a.last_message_date) : new Date(0);
                const dateB = b.last_message_date ? new Date(b.last_message_date) : new Date(0);
                return dateB - dateA;
            }));

            // Load all church members for creating new conversations
            const members = await base44.entities.Member.filter({});
            const validMembers = members.filter(m => m.email && (m.first_name || m.last_name));
            setAllMembers(validMembers);

            // Load user's groups
            try {
                const groupAssignments = await base44.entities.MemberGroupAssignment.filter({
                    member_email: user.email
                });
                const groupIds = groupAssignments.map(g => g.group_id);
                const groups = await base44.entities.MemberGroup.filter({});
                setMyGroups(groups.filter(g => groupIds.includes(g.id)));
            } catch (groupError) {
                console.log('Groups not available:', groupError);
                setMyGroups([]);
            }

        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error(`Failed to load messages: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const loadThreadMessages = async (threadId) => {
        try {
            const threadMessages = await base44.entities.InAppMessage.filter({
                thread_id: threadId
            });
            
            const sortedMessages = threadMessages.sort((a, b) => {
                const dateA = a.sent_date ? new Date(a.sent_date) : new Date(0);
                const dateB = b.sent_date ? new Date(b.sent_date) : new Date(0);
                return dateA - dateB;
            });
            
            setMessages(sortedMessages);

            // Mark messages as read (in background)
            threadMessages.forEach(async (msg) => {
                if (msg.id && !msg.read_by?.includes(currentUser.email)) {
                    try {
                        await base44.entities.InAppMessage.update(msg.id, {
                            read_by: [...(msg.read_by || []), currentUser.email]
                        });
                    } catch (readError) {
                        console.log('Could not mark message as read:', readError);
                    }
                }
            });

            // Refresh threads to update unread counts
            setTimeout(() => loadData(), 500);

        } catch (error) {
            console.error('Error loading thread messages:', error);
            toast.error('Failed to load messages');
        }
    };

    const handleSelectThread = (thread) => {
        setSelectedThread(thread);
        loadThreadMessages(thread.id);
    };

    const handleSendReply = async () => {
        if (!newMessageBody.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (!selectedThread || !selectedThread.id) {
            toast.error('No conversation selected');
            return;
        }

        setIsSending(true);
        try {
            const otherParticipants = (selectedThread.participant_emails || []).filter(
                email => email !== currentUser.email
            );

            if (otherParticipants.length === 0) {
                toast.error('No recipients found');
                setIsSending(false);
                return;
            }

            await base44.functions.invoke('sendInAppMessage', {
                message_body: newMessageBody,
                recipient_emails: otherParticipants,
                message_type: 'general',
                thread_id: selectedThread.id,
                send_email_notification: false
            });

            setNewMessageBody('');
            await loadThreadMessages(selectedThread.id);
            toast.success('Message sent!');

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(`Failed to send message: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const getThreadTitle = (thread) => {
        if (thread.thread_name && thread.thread_name !== 'Conversation') {
            return thread.thread_name;
        }
        
        const otherParticipants = thread.participant_names?.filter(
            (name, idx) => thread.participant_emails[idx] !== currentUser?.email
        );
        return otherParticipants?.join(', ') || 'Conversation';
    };

    const getUnreadCount = (thread) => {
        return thread.unread_count?.[currentUser?.email] || 0;
    };

    const filteredThreads = threads.filter(thread => {
        const title = getThreadTitle(thread).toLowerCase();
        const matchesSearch = title.includes(searchQuery.toLowerCase());
        
        if (filter === 'unread') {
            return matchesSearch && getUnreadCount(thread) > 0;
        } else if (filter === 'starred') {
            return matchesSearch && starredThreads.includes(thread.id);
        }
        return matchesSearch;
    });

    const toggleStar = (threadId) => {
        setStarredThreads(prev => 
            prev.includes(threadId) 
                ? prev.filter(id => id !== threadId)
                : [...prev, threadId]
        );
    };

    const handleCreateThread = async () => {
        if (selectedParticipants.length === 0) {
            toast.error('Please select at least one participant');
            return;
        }
        if (!newMessageBody.trim()) {
            toast.error('Please enter a message');
            return;
        }

        setIsSending(true);
        try {
            // Get participant names
            const participantNames = selectedParticipants.map(email => {
                const member = allMembers.find(m => m.email === email);
                return member ? `${member.first_name} ${member.last_name}` : email;
            });

            // Create thread
            const thread = await base44.entities.MessageThread.create({
                thread_name: groupName || 'Conversation',
                participant_emails: [currentUser.email, ...selectedParticipants],
                participant_names: [currentUser.full_name, ...participantNames],
                last_message_date: new Date().toISOString(),
                last_message_preview: newMessageBody.substring(0, 100),
                last_message_sender: currentUser.full_name,
                thread_type: selectedParticipants.length > 1 ? 'group' : 'direct',
                unread_count: {}
            });

            // Send initial message
            await base44.functions.invoke('sendInAppMessage', {
                subject: newMessageSubject || '(No Subject)',
                message_body: newMessageBody,
                recipient_emails: selectedParticipants,
                message_type: 'general',
                thread_id: thread.id,
                send_email_notification: false
            });

            setShowNewMessage(false);
            setNewMessageBody('');
            setNewMessageSubject('');
            setGroupName('');
            setSelectedParticipants([]);
            loadData();
            toast.success('Conversation started!');

        } catch (error) {
            console.error('Error creating thread:', error);
            toast.error('Failed to start conversation');
        }
        setIsSending(false);
    };

    const generateGroupInviteLink = (threadId) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/join-group?thread=${threadId}`;
    };

    const memberOptions = allMembers
        .filter(m => m.email && m.email !== currentUser?.email)
        .map(m => ({
            value: m.email,
            label: `${m.first_name || ''} ${m.last_name || ''} (${m.email})`.trim()
        }));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white md:bg-gradient-to-br md:from-slate-50 md:to-blue-50/30">
            <div className="h-screen flex flex-col">
                {/* Email-style Header - Native Mobile */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 md:bg-white md:border-b px-4 md:px-6 py-3 md:py-4 text-white md:text-slate-900 shadow-md md:shadow-none safe-area-inset-top">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail className="w-6 h-6 md:text-blue-600" />
                            <h1 className="text-xl md:text-2xl font-bold">Reach Messenger</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => loadData()}
                                variant="ghost"
                                size="icon"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button 
                                onClick={() => setShowNewMessage(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Message
                            </Button>
                            <Button 
                                onClick={() => setShowGroupCreator(true)}
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                                <UsersRound className="w-4 h-4 mr-2" />
                                Group Chat
                            </Button>
                            {currentUser?.role === 'admin' && (
                                <Button 
                                    onClick={() => window.location.href = '/admin-messaging'}
                                    variant="outline"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Admin
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - Hidden on mobile */}
                    <div className="hidden md:flex w-64 border-r bg-slate-50 flex-col">
                        {/* Filter Tabs */}
                        <div className="p-4 space-y-1">
                            <button
                                onClick={() => setFilter('all')}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                    filter === 'all' 
                                        ? 'bg-blue-100 text-blue-700 font-medium' 
                                        : 'text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <Inbox className="w-5 h-5" />
                                <span>All Messages</span>
                                {threads.length > 0 && (
                                    <Badge className="ml-auto bg-slate-300 text-slate-700">
                                        {threads.length}
                                    </Badge>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                    filter === 'unread' 
                                        ? 'bg-blue-100 text-blue-700 font-medium' 
                                        : 'text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <Mail className="w-5 h-5" />
                                <span>Unread</span>
                                {threads.filter(t => getUnreadCount(t) > 0).length > 0 && (
                                    <Badge className="ml-auto bg-blue-600 text-white">
                                        {threads.filter(t => getUnreadCount(t) > 0).length}
                                    </Badge>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter('starred')}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                    filter === 'starred' 
                                        ? 'bg-blue-100 text-blue-700 font-medium' 
                                        : 'text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <Star className="w-5 h-5" />
                                <span>Starred</span>
                                {starredThreads.length > 0 && (
                                    <Badge className="ml-auto bg-yellow-500 text-white">
                                        {starredThreads.length}
                                    </Badge>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Messages List - Full width on mobile */}
                    <div className={`flex-1 flex flex-col md:border-r bg-white ${selectedThread ? 'hidden md:flex' : ''}`}>
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredThreads.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">No messages</p>
                                    <p className="text-sm mt-1">Start a new conversation</p>
                                </div>
                            ) : (
                                filteredThreads.map(thread => (
                                    <button
                                        key={thread.id}
                                        onClick={() => handleSelectThread(thread)}
                                        className={`w-full p-4 border-b hover:bg-slate-50 transition-colors text-left flex items-center gap-3 ${
                                            selectedThread?.id === thread.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                        } ${getUnreadCount(thread) > 0 ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleStar(thread.id);
                                            }}
                                            className="flex-shrink-0"
                                        >
                                            <Star 
                                                className={`w-5 h-5 transition-colors ${
                                                    starredThreads.includes(thread.id)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-slate-300 hover:text-yellow-400'
                                                }`}
                                            />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={`truncate ${
                                                    getUnreadCount(thread) > 0 
                                                        ? 'font-bold text-slate-900' 
                                                        : 'font-medium text-slate-700'
                                                }`}>
                                                    {getThreadTitle(thread)}
                                                </p>
                                                <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                                                    {format(new Date(thread.last_message_date), 'MMM d')}
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate ${
                                                getUnreadCount(thread) > 0 
                                                    ? 'text-slate-700 font-medium' 
                                                    : 'text-slate-500'
                                            }`}>
                                                {thread.last_message_preview}
                                            </p>
                                        </div>
                                        {getUnreadCount(thread) > 0 && (
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                                {getUnreadCount(thread)}
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Message View Panel - Full width on mobile */}
                    <div className={`flex-1 flex flex-col bg-white ${!selectedThread ? 'hidden md:flex' : ''}`}>
                        {selectedThread ? (
                            <>
                                {/* Thread Header - Native Mobile */}
                                <div className="border-b px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 md:bg-white text-white md:text-slate-900 shadow-sm md:shadow-none">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedThread(null)}
                                                className="md:hidden h-9 w-9 text-white hover:bg-white/10"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </Button>
                                            <div>
                                                <h2 className="text-lg md:text-xl font-semibold">
                                                    {getThreadTitle(selectedThread)}
                                                </h2>
                                                <p className="text-xs md:text-sm opacity-80 md:opacity-100 md:text-slate-500 mt-0.5">
                                                    {selectedThread.participant_emails.length} participants
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleStar(selectedThread.id)}
                                            >
                                                <Star 
                                                    className={`w-5 h-5 ${
                                                        starredThreads.includes(selectedThread.id)
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-slate-400'
                                                    }`}
                                                />
                                            </Button>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Container - Native Mobile */}
                                <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50 overscroll-contain ios-scroll">
                                    <div className="space-y-6">
                                        {messages.map(message => (
                                            <div key={message.id} className="bg-white rounded-lg shadow-sm border p-5">
                                                {/* Message Header */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                            {message.sender_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {message.sender_name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {format(new Date(message.sent_date), 'MMM d, yyyy • h:mm a')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {message.sender_email === currentUser.email && (
                                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                {message.read_by?.length > 1 ? (
                                                                    <>
                                                                        <CheckCheck className="w-4 h-4 text-blue-600" />
                                                                        <span>Read</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check className="w-4 h-4" />
                                                                        <span>Sent</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Subject */}
                                                {message.subject && message.subject !== '(No Subject)' && (
                                                    <h3 className="font-semibold text-slate-900 mb-2">
                                                        {message.subject}
                                                    </h3>
                                                )}

                                                {/* Message Body */}
                                                <div className="text-slate-700 whitespace-pre-wrap mb-3">
                                                    {message.message_body}
                                                </div>

                                                {/* Attachments */}
                                                {message.attachment_urls?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                                        {message.attachment_urls.map((url, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                                                            >
                                                                <Paperclip className="w-4 h-4 text-slate-600" />
                                                                <span>Attachment {idx + 1}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Compose Reply - Native Mobile */}
                                    <div className="bg-white rounded-2xl md:rounded-lg shadow-md md:shadow-sm border-0 md:border p-4 mt-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                {currentUser.full_name?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <Textarea
                                                    placeholder="Write a reply..."
                                                    value={newMessageBody}
                                                    onChange={(e) => setNewMessageBody(e.target.value)}
                                                    rows={3}
                                                    className="border-0 focus-visible:ring-0 resize-none p-0"
                                                />
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="sm" className="text-slate-600">
                                                            <Paperclip className="w-4 h-4 mr-1" />
                                                            Attach
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        onClick={handleSendReply}
                                                        disabled={isSending || !newMessageBody.trim()}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {isSending ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4 mr-2" />
                                                        )}
                                                        Send
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-slate-400">
                                    <Mail className="w-24 h-24 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl font-medium mb-2">Select a message</p>
                                    <p className="text-sm">Choose a conversation from your inbox</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* New Message Dialog */}
                <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Start New Conversation</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Group Name (Optional)</Label>
                                <Input
                                    placeholder="e.g., Youth Team, Prayer Group"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Select Members</Label>
                                <MultiSelect
                                    options={memberOptions}
                                    selected={selectedParticipants}
                                    onChange={setSelectedParticipants}
                                    placeholder="Select church members..."
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    You can message fellow church members. For group chats, select multiple members.
                                </p>
                            </div>

                            <div>
                                <Label>Subject (Optional)</Label>
                                <Input
                                    placeholder="Message subject"
                                    value={newMessageSubject}
                                    onChange={(e) => setNewMessageSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Message</Label>
                                <Textarea
                                    placeholder="Type your message..."
                                    value={newMessageBody}
                                    onChange={(e) => setNewMessageBody(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowNewMessage(false);
                                        setNewMessageBody('');
                                        setNewMessageSubject('');
                                        setGroupName('');
                                        setSelectedParticipants([]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateThread}
                                    disabled={isSending}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Send
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Group Chat Creator */}
                <GroupChatCreator
                    open={showGroupCreator}
                    onOpenChange={setShowGroupCreator}
                    onSuccess={loadData}
                />
            </div>
        </div>
    );
}