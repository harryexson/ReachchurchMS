import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { youtube_channel_id, facebook_page_id } = body;
        
        const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
        let syncedVideos = [];

        // Sync YouTube videos
        if (youtube_channel_id && youtubeApiKey) {
            try {
                const youtubeResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${youtube_channel_id}&part=snippet&order=date&maxResults=10&type=video`
                );
                
                if (youtubeResponse.ok) {
                    const youtubeData = await youtubeResponse.json();
                    
                    if (youtubeData.items && Array.isArray(youtubeData.items)) {
                        for (const video of youtubeData.items) {
                            const videoId = video.id?.videoId;
                            if (!videoId) continue;

                            const title = video.snippet?.title || 'Untitled Video';
                            const description = video.snippet?.description || '';
                            const thumbnailUrl = video.snippet?.thumbnails?.medium?.url;
                            const publishedAt = video.snippet?.publishedAt;

                            // Check if sermon already exists
                            try {
                                const existingSermons = await base44.entities.Sermon.filter({
                                    video_url: `https://www.youtube.com/embed/${videoId}`
                                });

                                if (existingSermons.length === 0) {
                                    // Create new sermon record
                                    await base44.entities.Sermon.create({
                                        title: title,
                                        speaker: "Pastor", // Default - admin can edit later
                                        sermon_date: publishedAt ? new Date(publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                        description: description.length > 200 ? description.substring(0, 200) + "..." : description,
                                        video_url: `https://www.youtube.com/embed/${videoId}`,
                                        thumbnail_url: thumbnailUrl || '',
                                        series: "YouTube Import",
                                        view_count: 0
                                    });
                                    
                                    syncedVideos.push({
                                        platform: 'YouTube',
                                        title: title,
                                        date: publishedAt || new Date().toISOString()
                                    });
                                }
                            } catch (sermonError) {
                                console.error('Error creating sermon:', sermonError);
                            }
                        }
                    }
                } else {
                    console.error('YouTube API error:', await youtubeResponse.text());
                }
            } catch (error) {
                console.error('YouTube sync error:', error);
            }
        }

        // Facebook video sync would go here (requires Facebook Graph API)
        // For now, we'll focus on YouTube since it's more commonly used for sermons

        return Response.json({ 
            success: true,
            synced_videos: syncedVideos,
            total_synced: syncedVideos.length
        });

    } catch (error) {
        console.error('Social video sync error:', error);
        return Response.json({ 
            error: 'Failed to sync videos',
            details: error.message 
        }, { status: 500 });
    }
});