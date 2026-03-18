import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dailyApiKey = Deno.env.get("DAILY_API_KEY");
        console.log("Daily API Key status:", dailyApiKey ? "Present" : "Missing");
        
        if (!dailyApiKey || dailyApiKey.trim() === '') {
            return Response.json({ 
                error: 'Video conferencing not configured',
                details: 'DAILY_API_KEY environment variable is missing. Please add your Daily.co API key in the dashboard settings under Environment Variables.',
                setup_instructions: 'Get your API key from https://dashboard.daily.co/developers'
            }, { status: 500 });
        }

        const body = await req.json();
        const { 
            title, 
            description, 
            meeting_type, 
            scheduled_time, 
            duration_minutes,
            max_participants,
            enable_breakout_rooms,
            enable_recording,
            participants 
        } = body;

        // Generate unique meeting ID
        const meetingId = Math.random().toString(36).substr(2, 10).toUpperCase();
        const roomName = `church-${meetingId.toLowerCase()}`;

        // Create room in Daily.co
        const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${dailyApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: roomName,
                properties: {
                    max_participants: max_participants || 50,
                    enable_screenshare: true,
                    enable_recording: enable_recording ? 'cloud' : 'off',
                    enable_chat: true,
                    start_video_off: false,
                    start_audio_off: false,
                    owner_only_broadcast: false,
                    enable_knocking: true,
                    enable_prejoin_ui: true,
                    exp: Math.floor(Date.now() / 1000) + (duration_minutes || 60) * 60 + 3600 // Room expires 1 hour after scheduled end
                }
            })
        });

        if (!roomResponse.ok) {
            const errorText = await roomResponse.text();
            console.error('Daily.co API Error:', errorText);
            throw new Error(`Failed to create Daily.co room: ${roomResponse.status} - ${errorText}`);
        }

        const roomData = await roomResponse.json();

        // Create meeting record
        const meeting = await base44.entities.Meeting.create({
            title,
            description,
            meeting_type,
            host_name: user.full_name,
            host_email: user.email,
            scheduled_time,
            duration_minutes: duration_minutes || 60,
            room_url: roomData.url,
            meeting_id: meetingId,
            room_name: roomName,
            max_participants: max_participants || 50,
            enable_breakout_rooms: enable_breakout_rooms || false,
            enable_recording: enable_recording || false,
            status: 'scheduled',
            notes: ''
        });

        // Add participants
        if (participants && participants.length > 0) {
            for (const participant of participants) {
                await base44.entities.MeetingParticipant.create({
                    meeting_id: meeting.id,
                    participant_name: participant.name,
                    participant_email: participant.email,
                    role: participant.role || 'participant',
                    registration_status: 'invited'
                });
            }
        }

        // Send invitations (simplified version)
        // In production, you'd want to send proper calendar invites
        
        return Response.json({
            meeting_id: meeting.id,
            meeting_code: meetingId,
            room_url: roomData.url,
            join_url: `${req.url.replace('/functions/createVideoMeeting', '')}/VideoMeeting?meetingId=${meeting.id}`,
            daily_room_name: roomName
        });

    } catch (error) {
        console.error('Create meeting error:', error);
        return Response.json({ 
            error: 'Failed to create meeting',
            details: error.message 
        }, { status: 500 });
    }
});