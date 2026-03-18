import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dailyApiKey = Deno.env.get("DAILY_API_KEY");
        if (!dailyApiKey) {
            return Response.json({ error: 'Video conferencing not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { meeting_id, room_name, max_participants, assigned_participants } = body;

        // Get main meeting info
        const meetings = await base44.entities.Meeting.filter({ id: meeting_id });
        if (meetings.length === 0) {
            return Response.json({ error: 'Meeting not found' }, { status: 404 });
        }

        const meeting = meetings[0];

        // Generate unique room name for breakout
        const breakoutRoomName = `breakout-${meeting.room_name}-${Date.now()}`;

        // Create breakout room in Daily.co
        const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${dailyApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: breakoutRoomName,
                properties: {
                    max_participants: max_participants || 10,
                    enable_screenshare: true,
                    enable_recording: 'off',
                    enable_chat: true,
                    start_video_off: false,
                    start_audio_off: false,
                    exp: Math.floor(Date.now() / 1000) + 7200 // 2 hours
                }
            })
        });

        if (!roomResponse.ok) {
            throw new Error('Failed to create breakout room');
        }

        const roomData = await roomResponse.json();

        // Create breakout room record
        const breakoutRoom = await base44.entities.BreakoutRoom.create({
            meeting_id: meeting_id,
            room_name: room_name,
            room_url: roomData.url,
            daily_room_name: breakoutRoomName,
            max_participants: max_participants || 10,
            current_participants: assigned_participants || [],
            created_by: user.email,
            status: 'active',
            created_at: new Date().toISOString()
        });

        return Response.json({
            breakout_room_id: breakoutRoom.id,
            room_url: roomData.url,
            room_name: breakoutRoomName,
            participants: assigned_participants || []
        });

    } catch (error) {
        console.error('Create breakout room error:', error);
        return Response.json({ 
            error: 'Failed to create breakout room',
            details: error.message 
        }, { status: 500 });
    }
});