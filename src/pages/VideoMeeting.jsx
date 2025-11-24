
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Meeting } from "@/entities/Meeting";
import { BreakoutRoom } from "@/entities/BreakoutRoom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Video, 
    VideoOff, 
    Mic, 
    MicOff, 
    Monitor, 
    Users, 
    Settings, 
    Phone,
    MessageSquare,
    UserPlus,
    Crown
} from "lucide-react";
import { createBreakoutRoom } from "@/functions/createBreakoutRoom";

export default function VideoMeetingPage() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const meetingId = searchParams.get('meetingId');
    
    const [meeting, setMeeting] = useState(null);
    const [breakoutRooms, setBreakoutRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [controls, setControls] = useState({
        video: true,
        audio: true,
        screenshare: false
    });

    // Daily.co iframe ref
    const iframeRef = useRef(null);

    const loadMeetingData = useCallback(async () => {
        setIsLoading(true);
        try {
            const meetings = await Meeting.list();
            const foundMeeting = meetings.find(m => m.id === meetingId);
            
            if (foundMeeting) {
                setMeeting(foundMeeting);
                
                // Check if current user is host (you'd implement proper auth check)
                // setIsHost(currentUser.email === foundMeeting.host_email);
                
                // Load breakout rooms
                const rooms = await BreakoutRoom.filter({ meeting_id: meetingId });
                setBreakoutRooms(rooms);
            }
        } catch (error) {
            console.error("Failed to load meeting:", error);
        }
        setIsLoading(false);
    }, [meetingId]); // meetingId is a dependency for loadMeetingData

    useEffect(() => {
        if (meetingId) {
            loadMeetingData();
        }
    }, [meetingId, loadMeetingData]); // loadMeetingData is now a dependency

    const createBreakout = async () => {
        try {
            const response = await createBreakoutRoom({
                meeting_id: meetingId,
                room_name: `Breakout Room ${breakoutRooms.length + 1}`,
                max_participants: 8,
                assigned_participants: []
            });
            
            await loadMeetingData(); // Reload to get updated breakout rooms
            alert("Breakout room created!");
        } catch (error) {
            console.error("Failed to create breakout room:", error);
            alert("Failed to create breakout room");
        }
    };

    const joinBreakoutRoom = (room) => {
        if (room.room_url) {
            window.open(room.room_url, '_blank');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading meeting...</p>
                </div>
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-center">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Meeting Not Found</h1>
                    <p>The meeting you're looking for could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Meeting Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="text-white">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {meeting.title}
                            {isHost && (
                                <Badge className="bg-yellow-600">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Host
                                </Badge>
                            )}
                        </h1>
                        <p className="text-slate-300 text-sm">
                            Meeting ID: {meeting.meeting_id} • {meeting.meeting_type?.replace('_', ' ')}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {meeting.enable_breakout_rooms && isHost && (
                            <Button onClick={createBreakout} variant="outline" size="sm">
                                <UserPlus className="w-4 h-4 mr-1" />
                                Create Breakout
                            </Button>
                        )}
                        <Button 
                            onClick={() => window.close()} 
                            variant="destructive" 
                            size="sm"
                        >
                            <Phone className="w-4 h-4 mr-1" />
                            Leave
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Main Video Area */}
                <div className="flex-1 relative">
                    {meeting.room_url ? (
                        <iframe
                            ref={iframeRef}
                            src={meeting.room_url}
                            className="w-full h-full border-0"
                            allow="camera; microphone; fullscreen; speaker; display-capture"
                            title={meeting.title}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white">
                            <div className="text-center">
                                <Video className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <p>Video room is loading...</p>
                            </div>
                        </div>
                    )}

                    {/* Meeting Controls */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-full p-3 ${controls.audio ? 'bg-slate-700 text-white' : 'bg-red-600 text-white'}`}
                                onClick={() => setControls(prev => ({ ...prev, audio: !prev.audio }))}
                            >
                                {controls.audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-full p-3 ${controls.video ? 'bg-slate-700 text-white' : 'bg-red-600 text-white'}`}
                                onClick={() => setControls(prev => ({ ...prev, video: !prev.video }))}
                            >
                                {controls.video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </Button>
                            {meeting.enable_screen_share && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-full p-3 ${controls.screenshare ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}
                                    onClick={() => setControls(prev => ({ ...prev, screenshare: !prev.screenshare }))}
                                >
                                    <Monitor className="w-5 h-5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full p-3 bg-slate-700 text-white"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full p-3 bg-slate-700 text-white"
                            >
                                <Settings className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar for Breakout Rooms */}
                {meeting.enable_breakout_rooms && breakoutRooms.length > 0 && (
                    <div className="w-80 bg-slate-800 border-l border-slate-700">
                        <div className="p-4">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Breakout Rooms
                            </h3>
                            <div className="space-y-3">
                                {breakoutRooms.map((room) => (
                                    <div key={room.id} className="bg-slate-700 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-white font-medium text-sm">
                                                {room.room_name}
                                            </h4>
                                            <Badge variant="outline" className="text-xs">
                                                {room.current_participants?.length || 0}/{room.max_participants}
                                            </Badge>
                                        </div>
                                        <Button
                                            onClick={() => joinBreakoutRoom(room)}
                                            size="sm"
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            Join Room
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
