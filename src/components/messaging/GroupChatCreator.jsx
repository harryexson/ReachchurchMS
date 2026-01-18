import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Tag, Briefcase, Heart, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupChatCreator({ open, onOpenChange, onSuccess }) {
    const [groupName, setGroupName] = useState('');
    const [firstMessage, setFirstMessage] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [filterBy, setFilterBy] = useState('all');
    const [isSending, setIsSending] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Filter options
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedMinistries, setSelectedMinistries] = useState([]);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const members = await base44.entities.Member.filter({});
            const validMembers = members.filter(m => m.email && (m.first_name || m.last_name));
            setAllMembers(validMembers);
        } catch (error) {
            console.error('Error loading members:', error);
            toast.error('Failed to load members');
        }
    };

    // Get unique interests and ministries from all members
    const allInterests = [...new Set(allMembers.flatMap(m => m.interests || []))];
    const allMinistries = [...new Set(allMembers.flatMap(m => m.ministry_involvement || []))];
    const allVolunteerRoles = [...new Set(allMembers.flatMap(m => m.volunteer_roles || []))];

    // Filter members based on criteria
    const getFilteredMembers = () => {
        if (filterBy === 'all') {
            return allMembers;
        }

        if (filterBy === 'interests') {
            if (selectedInterests.length === 0) return allMembers;
            return allMembers.filter(m => 
                m.interests?.some(interest => selectedInterests.includes(interest))
            );
        }

        if (filterBy === 'ministries') {
            if (selectedMinistries.length === 0) return allMembers;
            return allMembers.filter(m => 
                m.ministry_involvement?.some(ministry => selectedMinistries.includes(ministry))
            );
        }

        if (filterBy === 'volunteer_roles') {
            if (selectedRoles.length === 0) return allMembers;
            return allMembers.filter(m => 
                m.volunteer_roles?.some(role => selectedRoles.includes(role))
            );
        }

        return allMembers;
    };

    const filteredMembers = getFilteredMembers();

    const toggleMember = (email) => {
        setSelectedMembers(prev => 
            prev.includes(email) 
                ? prev.filter(e => e !== email)
                : [...prev, email]
        );
    };

    const selectAll = () => {
        setSelectedMembers(filteredMembers.map(m => m.email));
    };

    const deselectAll = () => {
        setSelectedMembers([]);
    };

    const handleCreateGroupChat = async () => {
        if (selectedMembers.length === 0) {
            toast.error('Please select at least one member');
            return;
        }

        if (!groupName.trim()) {
            toast.error('Please enter a group name');
            return;
        }

        if (!firstMessage.trim()) {
            toast.error('Please enter a message to start the conversation');
            return;
        }

        setIsSending(true);
        try {
            // Get participant names
            const participantNames = selectedMembers.map(email => {
                const member = allMembers.find(m => m.email === email);
                return member ? `${member.first_name} ${member.last_name}` : email;
            });

            // Create thread
            const thread = await base44.entities.MessageThread.create({
                thread_name: groupName,
                thread_type: 'group',
                participant_emails: [currentUser.email, ...selectedMembers],
                participant_names: [currentUser.full_name, ...participantNames],
                last_message_date: new Date().toISOString(),
                last_message_preview: firstMessage.substring(0, 100),
                last_message_sender: currentUser.full_name,
                is_group_chat: true,
                created_by_email: currentUser.email,
                unread_count: {}
            });

            // Send first message
            await base44.entities.InAppMessage.create({
                thread_id: thread.id,
                sender_email: currentUser.email,
                sender_name: currentUser.full_name,
                sender_role: currentUser.role,
                recipient_emails: selectedMembers,
                message_body: firstMessage,
                message_type: 'group_chat',
                sent_date: new Date().toISOString(),
                read_by: [currentUser.email]
            });

            toast.success(`Group chat created with ${selectedMembers.length} members!`);
            
            // Reset form
            setGroupName('');
            setFirstMessage('');
            setSelectedMembers([]);
            setFilterBy('all');
            setSelectedInterests([]);
            setSelectedMinistries([]);
            setSelectedRoles([]);
            
            onOpenChange(false);
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error creating group chat:', error);
            toast.error('Failed to create group chat');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Create Group Chat
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Group Details */}
                    <div className="space-y-4">
                        <div>
                            <Label>Group Name *</Label>
                            <Input
                                placeholder="e.g., Youth Ministry Team, Prayer Warriors"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>First Message *</Label>
                            <Textarea
                                placeholder="Start the conversation..."
                                value={firstMessage}
                                onChange={(e) => setFirstMessage(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Member Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label>Select Members ({selectedMembers.length} selected)</Label>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={selectAll}
                                >
                                    Select All ({filteredMembers.length})
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={deselectAll}
                                >
                                    Deselect All
                                </Button>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <Tabs value={filterBy} onValueChange={setFilterBy} className="mb-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="all">
                                    <Users className="w-4 h-4 mr-1" />
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="interests">
                                    <Heart className="w-4 h-4 mr-1" />
                                    Interests
                                </TabsTrigger>
                                <TabsTrigger value="ministries">
                                    <Briefcase className="w-4 h-4 mr-1" />
                                    Ministries
                                </TabsTrigger>
                                <TabsTrigger value="volunteer_roles">
                                    <Tag className="w-4 h-4 mr-1" />
                                    Roles
                                </TabsTrigger>
                            </TabsList>

                            {/* Interest Filters */}
                            <TabsContent value="interests" className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <Label className="mb-2 block">Filter by Interests</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {allInterests.map(interest => (
                                            <Badge
                                                key={interest}
                                                variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    setSelectedInterests(prev =>
                                                        prev.includes(interest)
                                                            ? prev.filter(i => i !== interest)
                                                            : [...prev, interest]
                                                    );
                                                }}
                                            >
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Ministry Filters */}
                            <TabsContent value="ministries" className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <Label className="mb-2 block">Filter by Ministry</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {allMinistries.map(ministry => (
                                            <Badge
                                                key={ministry}
                                                variant={selectedMinistries.includes(ministry) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    setSelectedMinistries(prev =>
                                                        prev.includes(ministry)
                                                            ? prev.filter(m => m !== ministry)
                                                            : [...prev, ministry]
                                                    );
                                                }}
                                            >
                                                {ministry}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Volunteer Role Filters */}
                            <TabsContent value="volunteer_roles" className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <Label className="mb-2 block">Filter by Volunteer Role</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {allVolunteerRoles.map(role => (
                                            <Badge
                                                key={role}
                                                variant={selectedRoles.includes(role) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    setSelectedRoles(prev =>
                                                        prev.includes(role)
                                                            ? prev.filter(r => r !== role)
                                                            : [...prev, role]
                                                    );
                                                }}
                                            >
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Member List */}
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                            {filteredMembers.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No members match your filters</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredMembers.map(member => (
                                        <label
                                            key={member.email}
                                            className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={selectedMembers.includes(member.email)}
                                                onCheckedChange={() => toggleMember(member.email)}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                                {(member.interests?.length > 0 || member.ministry_involvement?.length > 0) && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {member.interests?.slice(0, 2).map(interest => (
                                                            <Badge key={interest} variant="secondary" className="text-xs">
                                                                {interest}
                                                            </Badge>
                                                        ))}
                                                        {member.ministry_involvement?.slice(0, 2).map(ministry => (
                                                            <Badge key={ministry} variant="outline" className="text-xs">
                                                                {ministry}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="text-sm text-slate-500">
                            Showing {filteredMembers.length} of {allMembers.length} members
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                setGroupName('');
                                setFirstMessage('');
                                setSelectedMembers([]);
                                setFilterBy('all');
                                setSelectedInterests([]);
                                setSelectedMinistries([]);
                                setSelectedRoles([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateGroupChat}
                            disabled={isSending || selectedMembers.length === 0 || !groupName.trim() || !firstMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Create Group Chat
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}