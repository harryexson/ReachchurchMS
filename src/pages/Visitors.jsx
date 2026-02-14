import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Mail, MessageSquare, Loader2, CheckCircle, Users, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays } from "date-fns";
import VisitorForm from "../components/visitors/VisitorForm";
import ComposeEmailModal from "../components/visitors/ComposeEmailModal";

const FOLLOW_UP_TEMPLATES = {
    1: {
        subject: "So great to have you at REACH Church! 👋",
        body: `Hey {name}!

Wow, what a joy it was to have you with us at REACH Church this past Sunday! We were so blessed by your visit. 

Our hope is that you felt welcomed, encouraged, and maybe even a little bit like you were already home. We're not perfect, but we're passionate about creating a place where everyone can experience God's love and find real community.

We'd be thrilled to see you again soon! If you have any questions or if there's anything at all we can be praying for you about, please don't hesitate to just hit 'reply' to this email.

Can't wait to connect again!

Blessings,
The REACH Church Team`
    },
    2: {
        subject: "Thinking of you from REACH Church! ✨",
        body: `Hi {name},

Just wanted to reach out from all of us at REACH Church and say we're thinking of you! We hope you've had a great week.

We believe church is so much more than a Sunday service—it's about doing life together. It's about finding a family where you can be yourself, grow in your faith, and make a real difference. If you're looking for a place to get plugged in, whether it's through a small group, a volunteer team, or just grabbing coffee, we would love to help you find your spot.

You matter to us, and more importantly, you matter to God. If there is any way our church can serve you or be a help in your life right now, please let us know. We are here for you.

Hope to see you again soon!

With love,
Your friends at REACH Church`
    },
    3: {
        subject: "We'd love to get to know you better! ☕",
        body: `Hello {name},

We noticed it's been a little while since we last connected, and we wanted to reach out personally. We genuinely care about you and would love to get to know you better!

At REACH Church, we believe that everyone has a story, and we'd be honored to hear yours. Whether you're exploring faith for the first time, returning after some time away, or looking for a church family, we're here for you.

Here are some ways to get more connected:
• Join us for Coffee & Connect this Sunday after service
• Check out one of our small groups (we have groups for all ages and interests)
• Attend our monthly newcomers' lunch (next one is [DATE])
• Reach out anytime to chat - we'd love to grab coffee with you!

What questions can we answer for you? What can we be praying about?

Looking forward to connecting,
The REACH Church Team`
    },
    4: {
        subject: "You're always welcome at REACH Church 🏠",
        body: `Hey {name},

We just wanted to send a quick note to let you know that you're always welcome at REACH Church! No matter where you are in your faith journey, no matter what you're going through, our doors (and hearts) are open to you.

Life gets busy, and we totally understand that. But if you're looking for:
• A community that genuinely cares
• A place to grow spiritually
• Opportunities to serve and make a difference
• Or simply a place to belong

We're here, and we'd love to walk alongside you.

Our Sunday services are at [TIME], and we'd be thrilled to see you again. If Sunday mornings don't work, we have midweek gatherings, online services, and small groups throughout the week.

Is there anything specific you're looking for in a church? We'd love to hear from you and help you find your place.

You're always in our prayers,
The REACH Church Team`
    },
    5: {
        subject: "Stay connected with REACH Church 💬",
        body: `Hi {name},

We wanted to reach out one more time to let you know that our church family is here for you, whenever you need us.

We understand that finding the right church home is a personal journey, and we respect whatever decision is best for you and your family. But we want you to know that:

• You can always reach out to us for prayer, encouragement, or support
• You're welcome to join us for any service, event, or gathering - no commitment required
• We're here to serve you and your family in any way we can

If you'd like to stay in the loop about what's happening at REACH Church, you can:
• Follow us on [SOCIAL MEDIA]
• Check out our website for upcoming events
• Subscribe to our monthly newsletter
• Or simply save this email and reach out whenever you'd like

We're grateful that our paths crossed, and we're always here if you need anything.

May God bless you and your family,
The REACH Church Team

P.S. If you'd prefer not to receive these emails, just let us know and we'll respect your wishes. No hard feelings!`
    }
};

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState([]);
    const [followUps, setFollowUps] = useState([]);
    const [visitorVisits, setVisitorVisits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [sendingFollowUp, setSendingFollowUp] = useState(null);
    const [emailToSend, setEmailToSend] = useState(null);
    const [showVisitHistory, setShowVisitHistory] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            console.log('Loading visitors for user:', user.email);
            
            // Load all visitors for this organization
            const visitorList = await base44.entities.Visitor.filter({ 
                "data.created_by": user.email 
            }, "-visit_date");
            
            console.log('Loaded visitors:', visitorList.length);
            setVisitors(visitorList);
            
            // Load related data
            const [followUpList, visitsList] = await Promise.all([
                base44.entities.VisitorFollowUp.filter({ "data.created_by": user.email }),
                base44.entities.VisitorVisit.filter({ "data.created_by": user.email }, "-visit_date")
            ]);
            setFollowUps(followUpList);
            setVisitorVisits(visitsList);
        } catch (error) {
            console.error("Error loading data:", error);
            if (error.message?.includes('Rate limit')) {
                alert('Too many requests. Please wait a moment and refresh the page.');
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!currentUser) return;

        // Real-time subscriptions for instant updates
        const unsubscribeVisitor = base44.entities.Visitor.subscribe((event) => {
            if (event.data?.data?.created_by === currentUser.email) {
                if (event.type === 'create') {
                    setVisitors(prev => [event.data, ...prev]);
                } else if (event.type === 'update') {
                    setVisitors(prev => prev.map(v => v.id === event.id ? event.data : v));
                } else if (event.type === 'delete') {
                    setVisitors(prev => prev.filter(v => v.id !== event.id));
                }
            }
        });

        return () => {
            unsubscribeVisitor();
        };
    }, [currentUser]);

    const handleFormSubmit = async (data) => {
        try {
            let visitorId;
            let isNewVisitor = false;
            
            if (selectedVisitor) {
                await base44.entities.Visitor.update(selectedVisitor.id, data);
                visitorId = selectedVisitor.id;
            } else {
                const newVisitor = await base44.entities.Visitor.create(data);
                visitorId = newVisitor.id;
                isNewVisitor = true;
            }
            
            if (isNewVisitor) {
                await checkAndEnrollWorkflows(visitorId, 'first_visit');
            }
            
            await loadData();
            setIsFormOpen(false);
            setSelectedVisitor(null);
        } catch (error) {
            console.error('Error saving visitor:', error);
            alert('Failed to save visitor');
        }
    };

    const checkAndEnrollWorkflows = async (visitorId, triggerType) => {
        try {
            const visitors = await base44.entities.Visitor.filter({ id: visitorId });
            if (visitors.length === 0) return;
            
            const visitor = visitors[0];
            
            const workflows = await base44.entities.VisitorWorkflow.filter({
                trigger_type: triggerType,
                is_active: true
            });
            
            console.log(`Found ${workflows.length} workflows for trigger: ${triggerType}`);
            
            for (const workflow of workflows) {
                const existing = await base44.entities.VisitorWorkflowExecution.filter({
                    workflow_id: workflow.id,
                    visitor_id: visitorId,
                    status: 'active'
                });
                
                if (existing.length > 0) {
                    console.log(`Visitor already enrolled in workflow: ${workflow.workflow_name}`);
                    continue;
                }
                
                const enrollDate = new Date();
                const firstActionDate = new Date(enrollDate);
                firstActionDate.setDate(firstActionDate.getDate() + (workflow.trigger_delay_days || 0));
                
                await base44.entities.VisitorWorkflowExecution.create({
                    workflow_id: workflow.id,
                    workflow_name: workflow.workflow_name,
                    visitor_id: visitorId,
                    visitor_name: visitor.name,
                    visitor_email: visitor.email,
                    visitor_phone: visitor.phone,
                    status: 'active',
                    current_step: 1,
                    total_steps: workflow.total_steps,
                    enrolled_date: enrollDate.toISOString(),
                    next_action_date: firstActionDate.toISOString(),
                    steps_completed: []
                });
                
                console.log(`✅ Enrolled ${visitor.name} in workflow: ${workflow.workflow_name}`);
            }
        } catch (error) {
            console.error('Error enrolling in workflows:', error);
        }
    };

    const handleEdit = (visitor) => {
        setSelectedVisitor(visitor);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedVisitor(null);
        setIsFormOpen(true);
    };

    const triggerFollowUp = useCallback((visitor, step) => {
        if (!visitor) return;

        if (!visitor.email || visitor.email.includes('@temp.') || visitor.email.startsWith('sms_') || visitor.email.includes('@visitor.temp')) {
            alert(`❌ Cannot send email to ${visitor.name}\n\nThis visitor was registered via SMS and doesn't have a valid email address.\n\nPhone: ${visitor.phone || 'Not provided'}\n\nPlease contact them by phone or text message instead.`);
            return;
        }

        const template = FOLLOW_UP_TEMPLATES[step] || FOLLOW_UP_TEMPLATES[1];
        const personalizedBody = template.body.replace(/{name}/g, visitor.name.split(' ')[0]);

        setEmailToSend({
            to: visitor.email,
            subject: template.subject,
            body: personalizedBody,
            visitor,
            step,
        });
    }, []);

    const handleMarkAsSent = async () => {
        if (!emailToSend) return;

        const { visitor, step } = emailToSend;
        setSendingFollowUp(visitor.id);

        try {
            const { sendVisitorEmail } = await import("@/functions/sendVisitorEmail");
            
            const response = await sendVisitorEmail({
                to: visitor.email,
                from_name: "REACH Church",
                subject: emailToSend.subject,
                body: emailToSend.body
            });

            if (response.data?.action_required === 'domain_verification') {
                alert(response.data.details);
                setSendingFollowUp(null);
                setEmailToSend(null);
                return;
            }

            if (response.data?.is_temp_email) {
                alert(response.data.details);
                setSendingFollowUp(null);
                setEmailToSend(null);
                return;
            }

            if (!response.data.success) {
                throw new Error(response.data.details || response.data.error || 'Failed to send email');
            }

            await base44.entities.VisitorFollowUp.create({
                visitor_id: visitor.id,
                message_type: 'email',
                sequence_step: step,
                date_sent: new Date().toISOString(),
                status: 'sent'
            });

            const statusMap = {
                1: 'contacted_1',
                2: 'contacted_2',
                3: 'contacted_3',
                4: 'contacted_4',
                5: 'engaged'
            };

            await base44.entities.Visitor.update(visitor.id, { 
                follow_up_status: statusMap[step] || 'engaged',
                last_contact_date: new Date().toISOString().split('T')[0],
                next_follow_up_date: addDays(new Date(), 7).toISOString().split('T')[0],
                total_follow_ups: (visitor.total_follow_ups || 0) + 1
            });

            await loadData();
            
            alert('✅ Follow-up email sent successfully!');
            
        } catch (error) {
            console.error(`Failed to send follow-up ${step}:`, error);
            alert(`❌ Failed to send email: ${error.message}\n\nPlease check your email settings and try again.`);
        } finally {
            setSendingFollowUp(null);
            setEmailToSend(null);
        }
    };

    const getNextFollowUpStep = (visitor) => {
        const visitorFollowUps = followUps.filter(f => f.visitor_id === visitor.id);
        const completedSteps = visitorFollowUps.map(f => f.sequence_step);
        
        for (let step = 1; step <= 5; step++) {
            if (!completedSteps.includes(step)) {
                return step;
            }
        }
        return null;
    };

    const convertToMember = async (visitor) => {
        if (!confirm(`Convert ${visitor.name} to a church member? This will create a member record.`)) {
            return;
        }

        try {
            const nameParts = visitor.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || nameParts[0];

            const memberData = {
                first_name: firstName,
                last_name: lastName,
                email: visitor.email,
                phone: visitor.phone || '',
                address: visitor.address || '',
                member_status: 'member',
                join_date: new Date().toISOString().split('T')[0],
                visitor_id: visitor.id,
                total_visits: visitor.total_visits || 1,
                conversion_date: new Date().toISOString().split('T')[0],
                notes: `Converted from visitor on ${new Date().toLocaleDateString()}. Original visit date: ${format(new Date(visitor.visit_date), 'MMM d, yyyy')}`
            };

            await base44.entities.Member.create(memberData);

            await base44.entities.Visitor.update(visitor.id, {
                follow_up_status: 'member',
                converted_to_member: true,
                conversion_date: new Date().toISOString().split('T')[0]
            });

            const activeExecutions = await base44.entities.VisitorWorkflowExecution.filter({
                visitor_id: visitor.id,
                status: 'active'
            });
            
            for (const execution of activeExecutions) {
                await base44.entities.VisitorWorkflowExecution.update(execution.id, {
                    status: 'stopped',
                    stopped_reason: 'Visitor became member'
                });
            }

            alert(`${visitor.name} has been successfully converted to a member!`);
            await loadData();

        } catch (error) {
            console.error("Failed to convert to member:", error);
            alert("Failed to convert to member. Please try again.");
        }
    };

    const handleUpdateName = async (visitor) => {
        const newName = prompt(`Update name for visitor with phone ${visitor.phone}:`, visitor.name);
        
        if (newName && newName.trim() && newName !== visitor.name) {
            try {
                await base44.entities.Visitor.update(visitor.id, {
                    name: newName.trim(),
                    email: visitor.email.includes('@temp.') || visitor.email.includes('@visitor.temp')
                        ? `${newName.trim().replace(/\s+/g, '.').toLowerCase()}@sms-visitor.temp`
                        : visitor.email
                });
                await loadData();
                alert('Visitor name updated!');
            } catch (error) {
                console.error('Error updating visitor name:', error);
                alert('Failed to update name');
            }
        }
    };

    const handleRequestName = async (visitor) => {
        if (!visitor.phone) {
            alert('No phone number on file for this visitor');
            return;
        }

        if (!confirm(`Send SMS to ${visitor.phone} asking for their name?`)) return;

        try {
            const { sendSinchSMS } = await import("@/functions/sendSinchSMS");
            
            const message = `Hi! This is ${currentUser?.full_name || 'the church'}. We'd love to personalize your experience with us. Could you please reply with your first and last name? Thank you! 🙏`;

            const response = await sendSinchSMS({
                to: visitor.phone,
                message: message
            });

            if (response.data.success) {
                alert('SMS sent! When they reply, their name will be updated automatically.');
            } else {
                alert('Failed to send SMS: ' + (response.data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending name request:', error);
            alert('Failed to send SMS');
        }
    };

    const statusColors = {
        new: "bg-blue-100 text-blue-800",
        contacted_1: "bg-yellow-100 text-yellow-800",
        contacted_2: "bg-orange-100 text-orange-800",
        contacted_3: "bg-purple-100 text-purple-800",
        contacted_4: "bg-pink-100 text-pink-800",
        engaged: "bg-green-100 text-green-800",
        member: "bg-emerald-100 text-emerald-800",
        archived: "bg-gray-100 text-gray-800"
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Visitor Management</h1>
                        <p className="text-slate-600 mt-1">Track and engage with church visitors</p>
                    </div>
                    <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Add Visitor
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Visitors</p>
                                    <p className="text-2xl font-bold text-slate-900">{visitors.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">New This Month</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {visitors.filter(v => {
                                            const visitDate = new Date(v.visit_date);
                                            const now = new Date();
                                            return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
                                        }).length}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Converted</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {visitors.filter(v => v.follow_up_status === 'member').length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Visitor Directory ({visitors.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>First Visit</TableHead>
                                        <TableHead>Total Visits</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Follow-ups</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : visitors.length > 0 ? (
                                        visitors.map(visitor => {
                                            const nextStep = getNextFollowUpStep(visitor);
                                            const daysSinceVisit = Math.floor((new Date() - new Date(visitor.visit_date)) / (1000 * 60 * 60 * 24));
                                            const visits = visitorVisits.filter(v => v.visitor_id === visitor.id);
                                            const hasValidEmail = visitor.email && !visitor.email.includes('@temp.') && !visitor.email.startsWith('sms_');
                                            const isSMSVisitor = visitor.name === 'SMS Visitor' || visitor.email.includes('@visitor.temp') || visitor.email.includes('@temp.');

                                            return (
                                                <TableRow key={visitor.id} className={isSMSVisitor ? 'bg-amber-50' : ''}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {visitor.name}
                                                            {isSMSVisitor && (
                                                                <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs">
                                                                    📱 SMS Only
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-slate-600">
                                                            {hasValidEmail ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-3 h-3"/>{visitor.email}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-amber-600">
                                                                    <Mail className="w-3 h-3"/>
                                                                    <span className="text-xs">Email N/A (SMS Only)</span>
                                                                </div>
                                                            )}
                                                            {visitor.phone && (
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare className="w-3 h-3"/>{visitor.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {format(new Date(visitor.visit_date), 'MMM d, yyyy')}
                                                            <div className="text-xs text-slate-500">{daysSinceVisit} days ago</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="relative">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowVisitHistory(showVisitHistory === visitor.id ? null : visitor.id)}
                                                            className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                                                        >
                                                            {visits.length || 1} visit{(visits.length || 1) !== 1 ? 's' : ''}
                                                        </Button>
                                                        {showVisitHistory === visitor.id && (
                                                            <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-xl border border-slate-200 w-80 left-0">
                                                                <h3 className="font-semibold mb-2 text-slate-800">Visit History</h3>
                                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                                    {visits.length > 0 ? (
                                                                        visits.map((visit, idx) => (
                                                                            <div key={idx} className="pb-2 last:pb-0 border-b last:border-b-0 border-slate-100">
                                                                                <p className="font-medium text-sm text-slate-800">{format(new Date(visit.visit_date), 'MMM d, yyyy')}</p>
                                                                                <p className="text-slate-600 text-xs">{visit.service_type || 'Sunday Service'}</p>
                                                                                {visit.event_title && <p className="text-xs text-slate-500 italic">{visit.event_title}</p>}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-slate-500">No additional visits recorded.</p>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setShowVisitHistory(null)}
                                                                    className="w-full mt-2"
                                                                >
                                                                    Close
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[visitor.follow_up_status]}>
                                                            {visitor.follow_up_status.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">
                                                            {visitor.total_follow_ups || 0} sent
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-2 justify-end flex-wrap">
                                                            {isSMSVisitor && (
                                                                <>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        onClick={() => handleUpdateName(visitor)}
                                                                        className="bg-amber-50 hover:bg-amber-100 border-amber-200"
                                                                    >
                                                                        ✏️ Update Name
                                                                    </Button>
                                                                    {visitor.phone && (
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm"
                                                                            onClick={() => handleRequestName(visitor)}
                                                                            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                                                                        >
                                                                            📱 Request Name
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                            <Button variant="outline" size="sm" onClick={() => handleEdit(visitor)}>
                                                                Edit
                                                            </Button>
                                                            {nextStep && nextStep <= 5 ? (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => triggerFollowUp(visitor, nextStep)}
                                                                    disabled={sendingFollowUp === visitor.id || !hasValidEmail}
                                                                    className="bg-blue-50 hover:bg-blue-100"
                                                                    title={!hasValidEmail ? 'Valid email required for follow-up' : ''}
                                                                >
                                                                    {sendingFollowUp === visitor.id ? (
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <Mail className="w-4 h-4 mr-2" />
                                                                    )}
                                                                    Follow-up #{nextStep}
                                                                </Button>
                                                            ) : visitor.follow_up_status !== 'member' && visitor.follow_up_status !== 'archived' ? (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => convertToMember(visitor)}
                                                                    className="bg-green-50 hover:bg-green-100"
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Convert to Member
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p className="text-slate-500">No visitors recorded yet</p>
                                                <p className="text-sm text-slate-400">Add your first visitor to begin the engagement process.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isFormOpen && (
                <VisitorForm
                    isOpen={isFormOpen}
                    setIsOpen={setIsFormOpen}
                    onSubmit={handleFormSubmit}
                    visitor={selectedVisitor}
                />
            )}
            
            <ComposeEmailModal
                emailData={emailToSend}
                isOpen={!!emailToSend}
                onOpenChange={() => setEmailToSend(null)}
                onSend={handleMarkAsSent}
            />
        </div>
    );
}