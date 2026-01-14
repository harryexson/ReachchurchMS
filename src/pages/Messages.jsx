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
    Check, CheckCheck, UserPlus, Link as LinkIcon
} from 'lucide-react';
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

    useEffect(() => {
        loadData();
        
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
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Load threads where user is a participant
            const allThreads = await base44.entities.MessageThread.filter({});
            const myThreads = allThreads.filter(t => 
                t.participant_emails?.includes(user.email) && !t.is_archived
            );
            
            setThreads(myThreads.sort((a, b) => 
                new Date(b.last_message_date) - new Date(a.last_message_date)
            ));

            // Load all church members for creating new conversations
            const members = await base44.entities.Member.filter({});
            setAllMembers(members);

            // Load user's groups
            const groupAssignments = await base44.entities.MemberGroupAssignment.filter({
                member_email: user.email
            });
            const groupIds = groupAssignments.map(g => g.group_id);
            const groups = await base44.entities.MemberGroup.filter({});
            setMyGroups(groups.filter(g => groupIds.includes(g.id)));

        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Failed to load messages');
        }
        setIsLoading(false);
    };

    const loadThreadMessages = async (threadId) => {
        try {
            const threadMessages = await base44.entities.InAppMessage.filter({
                thread_id: threadId
            });
            
            setMessages(threadMessages.sort((a, b) => 
                new Date(a.sent_date) - new Date(b.sent_date)
            ));

            // Mark messages as read
            for (const msg of threadMessages) {
                if (!msg.read_by?.includes(currentUser.email)) {
                    await base44.entities.InAppMessage.update(msg.id, {
                        read_by: [...(msg.read_by || []), currentUser.email]
                    });
                }
            }

            loadData(); // Refresh threads to update unread counts

        } catch (error) {
            console.error('Error loading thread messages:', error);
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

        setIsSending(true);
        try {
            const otherParticipants = selectedThread.participant_emails.filter(
                email => email !== currentUser.email
            );

            await base44.functions.invoke('sendInAppMessage', {
                message_body: newMessageBody,
                recipient_emails: otherParticipants,
                message_type: 'general',
                thread_id: selectedThread.id,
                send_email_notification: false
            });

            setNewMessageBody('');
            loadThreadMessages(selectedThread.id);
            toast.success('Message sent!');

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
        setIsSending(false);
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
        return title.includes(searchQuery.toLowerCase());
    });

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
        .filter(m => m.email !== currentUser?.email)
        .map(m => ({
            value: m.email,
            label: `${m.first_name} ${m.last_name} (${m.email})`
        }));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setShowNewMessage(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Message
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

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Threads List */}
                    <Card className="lg:col-span-1 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Conversations</CardTitle>
                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                            {filteredThreads.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No conversations yet</p>
                                </div>
                            ) : (
                                filteredThreads.map(thread => (
                                    <button
                                        key={thread.id}
                                        onClick={() => handleSelectThread(thread)}
                                        className={`w-full p-4 border-b hover:bg-slate-50 transition-colors text-left ${
                                            selectedThread?.id === thread.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="font-semibold text-slate-900 truncate flex-1">
                                                {getThreadTitle(thread)}
                                            </p>
                                            {getUnreadCount(thread) > 0 && (
                                                <Badge className="bg-blue-600 text-white ml-2">
                                                    {getUnreadCount(thread)}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 truncate mb-1">
                                            {thread.last_message_preview}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {format(new Date(thread.last_message_date), 'MMM d, h:mm a')}
                                        </p>
                                    </button>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Message View */}
                    <Card className="lg:col-span-2 shadow-lg">
                        {selectedThread ? (
                            <>
                                <CardHeader className="border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedThread(null)}
                                                className="lg:hidden"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </Button>
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {getThreadTitle(selectedThread)}
                                                </CardTitle>
                                                <p className="text-sm text-slate-600">
                                                    {selectedThread.participant_emails.length} participants
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {/* Messages */}
                                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                                        {messages.map(message => (
                                            <div
                                                key={message.id}
                                                className={`flex ${
                                                    message.sender_email === currentUser.email ? 'justify-end' : 'justify-start'
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg p-4 ${
                                                        message.sender_email === currentUser.email
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-900'
                                                    }`}
                                                >
                                                    {message.subject && message.subject !== '(No Subject)' && (
                                                        <p className="font-semibold mb-2">{message.subject}</p>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{message.message_body}</p>
                                                    {message.attachment_urls?.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-white/20">
                                                            {message.attachment_urls.map((url, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-sm underline"
                                                                >
                                                                    <Paperclip className="w-4 h-4" />
                                                                    Attachment {idx + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                                                        <span>{format(new Date(message.sent_date), 'MMM d, h:mm a')}</span>
                                                        {message.sender_email === currentUser.email && (
                                                            <span className="flex items-center gap-1">
                                                                {message.read_by?.length > 1 ? (
                                                                    <CheckCheck className="w-4 h-4" />
                                                                ) : (
                                                                    <Check className="w-4 h-4" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Reply Box */}
                                    <div className="border-t pt-4">
                                        <Textarea
                                            placeholder="Type your message..."
                                            value={newMessageBody}
                                            onChange={(e) => setNewMessageBody(e.target.value)}
                                            rows={3}
                                            className="mb-3"
                                        />
                                        <div className="flex justify-end">
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
                                                Send Message
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </>
                        ) : (
                            <CardContent className="flex items-center justify-center h-full min-h-[500px]">
                                <div className="text-center text-slate-500">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">Select a conversation</p>
                                    <p className="text-sm">Choose a conversation to view messages</p>
                                </div>
                            </CardContent>
                        )}
                    </Card>
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
                                    value={selectedParticipants}
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
            </div>
        </div>
    );
}