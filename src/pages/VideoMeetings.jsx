
import React, { useState, useEffect } from "react";
import { Meeting } from "@/entities/Meeting";
import { MeetingParticipant } from "@/entities/MeetingParticipant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Users, Calendar, Clock, Plus, Settings, Crown, Copy, Send, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { createVideoMeeting } from "@/functions/createVideoMeeting";
import MeetingForm from "../components/meetings/MeetingForm";
import MeetingInviteModal from "../components/meetings/MeetingInviteModal";
import FeatureGate from "../components/subscription/FeatureGate";
import { useSubscription } from "../components/subscription/useSubscription";

export default function VideoMeetingsPage() {
    const [meetings, setMeetings] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [meetingToInvite, setMeetingToInvite] = useState(null);

    const { canUseVideo, getFeatureLimit, hasFeature, loading: subscriptionLoading } = useSubscription();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [meetingsList, participantsList] = await Promise.all([
            Meeting.list("-scheduled_time"),
            MeetingParticipant.list()
        ]);
        setMeetings(meetingsList);
        setParticipants(participantsList);
        setIsLoading(false);
    };

    const handleCreateMeeting = async (meetingData) => {
        try {
            const response = await createVideoMeeting(meetingData);
            await loadData();
            setIsFormOpen(false);
            setSelectedMeeting(null);
            alert(`Meeting created! Meeting ID: ${response.data.meeting_code}`);
        } catch (error) {
            console.error("Failed to create meeting:", error);
            alert("Failed to create meeting. Please try again.");
        }
    };

    const handleJoinMeeting = (meeting) => {
        if (meeting.room_url) {
            window.open(meeting.room_url, '_blank');
        }
    };

    const copyMeetingLink = (meeting) => {
        const joinUrl = meeting.room_url;
        navigator.clipboard.writeText(joinUrl);
        alert("Meeting link copied to clipboard! Anyone with this link can join.");
    };

    const handleInviteParticipants = (meeting) => {
        setMeetingToInvite(meeting);
        setInviteModalOpen(true);
    };

    const handleCloneMeeting = (meetingToClone) => {
        if (!meetingToClone) return;
        
        // Remove fields that shouldn't be copied
        const { 
            id, 
            meeting_id, 
            room_name, 
            room_url, 
            recording_url,
            status,
            created_date,
            updated_date,
            created_by,
            ...restOfMeeting 
        } = meetingToClone;
        
        // Create new meeting data with copied fields
        const newMeetingData = {
            ...restOfMeeting,
            title: `${meetingToClone.title} (Copy)`,
            scheduled_time: "", // User will set new date/time
            status: "scheduled",
            notes: meetingToClone.notes || ""
        };
        
        setSelectedMeeting(newMeetingData);
        setIsFormOpen(true);
    };

    const now = new Date();
    const upcomingMeetings = meetings.filter(m => 
        m.scheduled_time && isAfter(new Date(m.scheduled_time), now) && m.status === 'scheduled'
    );
    const activeMeetings = meetings.filter(m => m.status === 'active');
    const pastMeetings = meetings.filter(m => 
        m.scheduled_time && isBefore(new Date(m.scheduled_time), now) && m.status !== 'active'
    );

    const meetingTypeColors = {
        bible_study: "bg-blue-100 text-blue-800",
        planning: "bg-purple-100 text-purple-800",
        vision_casting: "bg-orange-100 text-orange-800",
        leadership: "bg-red-100 text-red-800",
        prayer: "bg-green-100 text-green-800",
        ministry_team: "bg-indigo-100 text-indigo-800",
        board_meeting: "bg-gray-100 text-gray-800",
        other: "bg-pink-100 text-pink-800"
    };

    const maxParticipants = getFeatureLimit('video_max_participants');

    return (
        <FeatureGate 
            feature="video_enabled"
            featureName="Video Meetings"
            requiredPlan="Growth"
        >
            <div className="p-6 bg-gradient-to-br from-slate-50 to-purple-50/30 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                <Video className="w-8 h-8 text-purple-600" />
                                Video Meetings
                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                </Badge>
                            </h1>
                            <p className="text-slate-600 mt-1">Host professional video conferences with your teams and groups.</p>
                            {!subscriptionLoading && maxParticipants > 0 && (
                                <div className="mt-2">
                                    <Badge className="bg-purple-100 text-purple-800">
                                        Up to {maxParticipants} participants per meeting
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <Button onClick={() => setIsFormOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-lg">
                            <Plus className="w-5 h-5 mr-2" />
                            Schedule Meeting
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Active Meetings</p>
                                        <p className="text-2xl font-bold text-slate-900">{activeMeetings.length}</p>
                                    </div>
                                    <Video className="w-8 h-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Upcoming</p>
                                        <p className="text-2xl font-bold text-slate-900">{upcomingMeetings.length}</p>
                                    </div>
                                    <Calendar className="w-8 h-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Total Participants</p>
                                        <p className="text-2xl font-bold text-slate-900">{participants.length}</p>
                                    </div>
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="upcoming" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
                            <TabsTrigger value="active">Active ({activeMeetings.length})</TabsTrigger>
                            <TabsTrigger value="past">Past Meetings</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="upcoming">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Upcoming Meetings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="p-4 rounded-lg border border-slate-100">
                                                    <div className="h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                                                    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2 mb-1"></div>
                                                    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/4"></div>
                                                </div>
                                            ))
                                        ) : upcomingMeetings.length > 0 ? (
                                            upcomingMeetings.map((meeting) => {
                                                const meetingParticipants = participants.filter(p => p.meeting_id === meeting.id);
                                                return (
                                                    <div key={meeting.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                                                    {meeting.title}
                                                                    <Badge className={meetingTypeColors[meeting.meeting_type]}>
                                                                        {meeting.meeting_type?.replace('_', ' ')}
                                                                    </Badge>
                                                                    {!meeting.require_registration && (
                                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                                            Open to All
                                                                        </Badge>
                                                                    )}
                                                                </h3>
                                                                <p className="text-slate-600 text-sm mt-1">{meeting.description}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button onClick={() => handleJoinMeeting(meeting)} className="bg-green-600 hover:bg-green-700">
                                                                    <Video className="w-4 h-4 mr-1" />
                                                                    Join
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>{format(new Date(meeting.scheduled_time), 'MMM d, yyyy')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{format(new Date(meeting.scheduled_time), 'h:mm a')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4" />
                                                                <span>{meetingParticipants.length} participants invited</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => copyMeetingLink(meeting)}
                                                            >
                                                                <Copy className="w-4 h-4 mr-1" />
                                                                Copy Join Link
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => handleInviteParticipants(meeting)}
                                                                className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                                            >
                                                                <Send className="w-4 h-4 mr-1" />
                                                                Invite People
                                                            </Button>
                                                        </div>
                                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                                            <p className="text-xs text-slate-500">
                                                                Meeting ID: <code className="bg-slate-100 px-2 py-1 rounded">{meeting.meeting_id}</code>
                                                                {meeting.meeting_password && (
                                                                    <span className="ml-4">Password: <code className="bg-slate-100 px-2 py-1 rounded">{meeting.meeting_password}</code></span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                📋 Anyone with the link can join this meeting
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p>No upcoming meetings</p>
                                                <p className="text-sm">Schedule your first meeting to get started</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="active">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        Active Meetings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {activeMeetings.map((meeting) => (
                                            <div key={meeting.id} className="p-4 rounded-lg border border-green-200 bg-green-50/50">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
                                                        <p className="text-sm text-slate-600">Host: {meeting.host_name}</p>
                                                    </div>
                                                    <Button onClick={() => handleJoinMeeting(meeting)} className="bg-green-600 hover:bg-green-700">
                                                        <Video className="w-4 h-4 mr-1" />
                                                        Join Now
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {activeMeetings.length === 0 && (
                                            <div className="text-center py-8 text-slate-500">
                                                <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p>No active meetings</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="past">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Past Meetings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {pastMeetings.slice(0, 10).map((meeting) => (
                                            <div key={meeting.id} className="p-4 rounded-lg border border-slate-100 opacity-75 hover:opacity-100 transition-opacity">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                                                            {meeting.title}
                                                            <Badge className={meetingTypeColors[meeting.meeting_type]}>
                                                                {meeting.meeting_type?.replace('_', ' ')}
                                                            </Badge>
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mb-1">
                                                            {format(new Date(meeting.scheduled_time), 'MMM d, yyyy • h:mm a')}
                                                        </p>
                                                        <p className="text-sm text-slate-600">
                                                            Host: {meeting.host_name}
                                                        </p>
                                                        {meeting.description && (
                                                            <p className="text-sm text-slate-600 mt-2">{meeting.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 flex-col sm:flex-row">
                                                        {meeting.recording_url && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => window.open(meeting.recording_url, '_blank')}
                                                            >
                                                                View Recording
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleCloneMeeting(meeting)}
                                                            className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                                        >
                                                            <Copy className="w-4 h-4 mr-1" />
                                                            Clone Meeting
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-500">
                                                        {meeting.duration_minutes && (
                                                            <div>
                                                                Duration: {meeting.duration_minutes} minutes
                                                            </div>
                                                        )}
                                                        {meeting.max_participants && (
                                                            <div>
                                                                Max Participants: {meeting.max_participants}
                                                            </div>
                                                        )}
                                                        {meeting.enable_recording && (
                                                            <div className="flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                                Recording Enabled
                                                            </div>
                                                        )}
                                                        {meeting.enable_breakout_rooms && (
                                                            <div className="flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                                Breakout Rooms
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {pastMeetings.length === 0 && (
                                            <div className="text-center py-8 text-slate-500">
                                                <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p>No past meetings</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {isFormOpen && (
                        <MeetingForm
                            isOpen={isFormOpen}
                            setIsOpen={setIsFormOpen}
                            onSubmit={handleCreateMeeting}
                            meeting={selectedMeeting}
                        />
                    )}

                    {inviteModalOpen && (
                        <MeetingInviteModal
                            isOpen={inviteModalOpen}
                            setIsOpen={setInviteModalOpen}
                            meeting={meetingToInvite}
                            onInvitesSent={loadData}
                        />
                    )}
                </div>
            </div>
        </FeatureGate>
    );
}
