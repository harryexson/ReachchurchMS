import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Megaphone, Users, Tag, Heart, Briefcase, 
    Send, Loader2, AlertCircle, Calendar, Bell 
} from 'lucide-react';
import { toast } from 'sonner';

export default function BroadcastComposer({ open, onOpenChange, onSuccess }) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('all'); // all, groups, interests, ministries, age_groups
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedMinistries, setSelectedMinistries] = useState([]);
    const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
    const [memberStatus, setMemberStatus] = useState('all'); // all, member, visitor, regular_attendee
    const [deliveryMethod, setDeliveryMethod] = useState('in_app'); // in_app, push, both
    const [isSending, setIsSending] = useState(false);
    const [previewCount, setPreviewCount] = useState(0);

    const [groups, setGroups] = useState([]);
    const [allMembers, setAllMembers] = useState([]);

    const ageGroupOptions = ['child', 'teen', 'young_adult', 'adult', 'senior'];

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    useEffect(() => {
        calculateRecipientCount();
    }, [targetAudience, selectedGroups, selectedInterests, selectedMinistries, selectedAgeGroups, memberStatus, allMembers]);

    const loadData = async () => {
        try {
            const [groupsData, membersData] = await Promise.all([
                base44.entities.MemberGroup.filter({}).catch(() => []),
                base44.entities.Member.filter({})
            ]);
            
            setGroups(groupsData);
            setAllMembers(membersData.filter(m => m.email));
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        }
    };

    const calculateRecipientCount = async () => {
        try {
            const recipients = await getRecipientEmails();
            setPreviewCount(recipients.length);
        } catch (error) {
            console.error('Error calculating recipients:', error);
            setPreviewCount(0);
        }
    };

    const getRecipientEmails = async () => {
        let recipients = [];

        if (targetAudience === 'all') {
            recipients = allMembers
                .filter(m => memberStatus === 'all' || m.member_status === memberStatus)
                .map(m => m.email);
        } 
        else if (targetAudience === 'groups') {
            if (selectedGroups.length === 0) return [];
            const assignments = await base44.entities.MemberGroupAssignment.filter({
                group_id: { $in: selectedGroups }
            });
            const emails = [...new Set(assignments.map(a => a.member_email))];
            recipients = emails;
        } 
        else if (targetAudience === 'interests') {
            recipients = allMembers
                .filter(m => m.interests?.some(i => selectedInterests.includes(i)))
                .filter(m => memberStatus === 'all' || m.member_status === memberStatus)
                .map(m => m.email);
        } 
        else if (targetAudience === 'ministries') {
            recipients = allMembers
                .filter(m => m.ministry_involvement?.some(mi => selectedMinistries.includes(mi)))
                .filter(m => memberStatus === 'all' || m.member_status === memberStatus)
                .map(m => m.email);
        }
        else if (targetAudience === 'age_groups') {
            recipients = allMembers
                .filter(m => selectedAgeGroups.includes(m.age_group))
                .filter(m => memberStatus === 'all' || m.member_status === memberStatus)
                .map(m => m.email);
        }

        return [...new Set(recipients)];
    };

    const handleSendBroadcast = async () => {
        if (!subject.trim() || !message.trim()) {
            toast.error('Please fill in subject and message');
            return;
        }

        setIsSending(true);
        try {
            const user = await base44.auth.me();
            const recipientEmails = await getRecipientEmails();

            if (recipientEmails.length === 0) {
                toast.error('No recipients match your criteria');
                setIsSending(false);
                return;
            }

            // Send in-app message
            if (deliveryMethod === 'in_app' || deliveryMethod === 'both') {
                await base44.entities.InAppMessage.create({
                    subject: subject,
                    message_body: message,
                    sender_email: user.email,
                    sender_name: user.full_name,
                    sender_role: 'admin',
                    recipient_emails: recipientEmails,
                    message_type: 'broadcast',
                    status: 'sent',
                    sent_date: new Date().toISOString(),
                    read_by: []
                });
            }

            // Send push notification
            if (deliveryMethod === 'push' || deliveryMethod === 'both') {
                try {
                    await base44.functions.invoke('sendPushNotification', {
                        title: subject,
                        body: message,
                        targetUsers: recipientEmails
                    });
                } catch (pushError) {
                    console.warn('Push notification failed:', pushError);
                }
            }

            toast.success(`Broadcast sent to ${recipientEmails.length} members!`);
            
            // Reset form
            setSubject('');
            setMessage('');
            setTargetAudience('all');
            setSelectedGroups([]);
            setSelectedInterests([]);
            setSelectedMinistries([]);
            setSelectedAgeGroups([]);
            setMemberStatus('all');
            
            onOpenChange(false);
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error sending broadcast:', error);
            toast.error('Failed to send broadcast');
        } finally {
            setIsSending(false);
        }
    };

    const allInterests = [...new Set(allMembers.flatMap(m => m.interests || []))];
    const allMinistries = [...new Set(allMembers.flatMap(m => m.ministry_involvement || []))];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-purple-600" />
                        Broadcast Message
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Message Details */}
                    <div className="space-y-4">
                        <div>
                            <Label>Subject *</Label>
                            <Input
                                placeholder="Message subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Message *</Label>
                            <Textarea
                                placeholder="Type your broadcast message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                            />
                        </div>

                        <div>
                            <Label>Delivery Method</Label>
                            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="in_app" id="in_app" />
                                    <Label htmlFor="in_app" className="font-normal cursor-pointer">In-App Message</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="push" id="push" />
                                    <Label htmlFor="push" className="font-normal cursor-pointer">Push Notification</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="both" id="both" />
                                    <Label htmlFor="both" className="font-normal cursor-pointer">Both (In-App + Push)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <Label className="mb-3 block">Target Audience</Label>
                        
                        <Tabs value={targetAudience} onValueChange={setTargetAudience}>
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="groups">Groups</TabsTrigger>
                                <TabsTrigger value="interests">Interests</TabsTrigger>
                                <TabsTrigger value="ministries">Ministries</TabsTrigger>
                                <TabsTrigger value="age_groups">Age</TabsTrigger>
                            </TabsList>

                            <TabsContent value="groups" className="mt-4">
                                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                                    {groups.map(group => (
                                        <label key={group.id} className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={selectedGroups.includes(group.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedGroups(prev =>
                                                        checked
                                                            ? [...prev, group.id]
                                                            : prev.filter(id => id !== group.id)
                                                    );
                                                }}
                                            />
                                            <span className="text-sm">{group.group_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="interests" className="mt-4">
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
                            </TabsContent>

                            <TabsContent value="ministries" className="mt-4">
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
                            </TabsContent>

                            <TabsContent value="age_groups" className="mt-4">
                                <div className="flex flex-wrap gap-2">
                                    {ageGroupOptions.map(age => (
                                        <Badge
                                            key={age}
                                            variant={selectedAgeGroups.includes(age) ? 'default' : 'outline'}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                setSelectedAgeGroups(prev =>
                                                    prev.includes(age)
                                                        ? prev.filter(a => a !== age)
                                                        : [...prev, age]
                                                );
                                            }}
                                        >
                                            {age.replace('_', ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Member Status Filter */}
                        <div className="mt-4">
                            <Label className="mb-2 block">Member Status</Label>
                            <RadioGroup value={memberStatus} onValueChange={setMemberStatus}>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="status_all" />
                                        <Label htmlFor="status_all" className="font-normal cursor-pointer">All</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="member" id="status_member" />
                                        <Label htmlFor="status_member" className="font-normal cursor-pointer">Members</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="visitor" id="status_visitor" />
                                        <Label htmlFor="status_visitor" className="font-normal cursor-pointer">Visitors</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="regular_attendee" id="status_attendee" />
                                        <Label htmlFor="status_attendee" className="font-normal cursor-pointer">Regular Attendees</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    {/* Preview */}
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-900">
                            This broadcast will be sent to <strong>{previewCount} members</strong> via {deliveryMethod === 'both' ? 'in-app message and push notification' : deliveryMethod === 'push' ? 'push notification' : 'in-app message'}.
                        </AlertDescription>
                    </Alert>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                setSubject('');
                                setMessage('');
                                setTargetAudience('all');
                                setSelectedGroups([]);
                                setSelectedInterests([]);
                                setSelectedMinistries([]);
                                setSelectedAgeGroups([]);
                                setMemberStatus('all');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendBroadcast}
                            disabled={isSending || !subject.trim() || !message.trim() || previewCount === 0}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send to {previewCount} Members
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    async function handleSendBroadcast() {
        setIsSending(true);
        try {
            const user = await base44.auth.me();
            const recipientEmails = await getRecipientEmails();

            if (recipientEmails.length === 0) {
                toast.error('No recipients match your criteria');
                setIsSending(false);
                return;
            }

            // Send in-app message
            if (deliveryMethod === 'in_app' || deliveryMethod === 'both') {
                await base44.entities.InAppMessage.create({
                    subject: subject,
                    message_body: message,
                    sender_email: user.email,
                    sender_name: user.full_name,
                    sender_role: 'admin',
                    recipient_emails: recipientEmails,
                    message_type: 'broadcast',
                    status: 'sent',
                    sent_date: new Date().toISOString(),
                    read_by: []
                });
            }

            // Send push notification
            if (deliveryMethod === 'push' || deliveryMethod === 'both') {
                try {
                    await base44.functions.invoke('sendPushNotification', {
                        title: subject,
                        body: message,
                        targetUsers: recipientEmails
                    });
                } catch (pushError) {
                    console.warn('Push notification failed (continuing):', pushError);
                }
            }

            toast.success(`Broadcast sent to ${recipientEmails.length} members!`);
            
            onOpenChange(false);
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error sending broadcast:', error);
            toast.error('Failed to send broadcast');
        } finally {
            setIsSending(false);
        }
    }
}