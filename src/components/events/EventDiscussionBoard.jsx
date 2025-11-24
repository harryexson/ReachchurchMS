import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Pin, User, Send } from "lucide-react";
import { format } from "date-fns";

export default function EventDiscussionBoard({ event }) {
    const [discussions, setDiscussions] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState(null);

    useEffect(() => {
        loadDiscussions();
        loadUser();
    }, [event.id]);

    const loadUser = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
        } catch (error) {
            console.error("Error loading user:", error);
        }
    };

    const loadDiscussions = async () => {
        try {
            const comments = await base44.entities.EventDiscussion.filter({
                event_id: event.id
            }, '-posted_date');
            setDiscussions(comments);
        } catch (error) {
            console.error("Error loading discussions:", error);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !currentUser) return;

        setIsSubmitting(true);
        try {
            await base44.entities.EventDiscussion.create({
                event_id: event.id,
                event_title: event.title,
                author_name: currentUser.full_name,
                author_email: currentUser.email,
                comment_text: newComment,
                parent_comment_id: replyTo?.id || null,
                posted_date: new Date().toISOString(),
                likes_count: 0,
                is_staff_response: currentUser.role === 'admin',
                is_pinned: false
            });

            setNewComment("");
            setReplyTo(null);
            await loadDiscussions();
        } catch (error) {
            console.error("Error posting comment:", error);
            alert("Failed to post comment");
        }
        setIsSubmitting(false);
    };

    const handleLike = async (comment) => {
        try {
            await base44.entities.EventDiscussion.update(comment.id, {
                likes_count: (comment.likes_count || 0) + 1
            });
            await loadDiscussions();
        } catch (error) {
            console.error("Error liking comment:", error);
        }
    };

    const topLevelComments = discussions.filter(d => !d.parent_comment_id);
    const getReplies = (commentId) => discussions.filter(d => d.parent_comment_id === commentId);

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Community Discussion
                </CardTitle>
                {event.discussion_topic && (
                    <p className="text-sm text-slate-600 mt-2">{event.discussion_topic}</p>
                )}
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Post New Comment */}
                {currentUser && (
                    <div className="space-y-3">
                        {replyTo && (
                            <div className="bg-blue-50 p-2 rounded flex justify-between items-center">
                                <span className="text-sm">Replying to {replyTo.author_name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Cancel</Button>
                            </div>
                        )}
                        <Textarea
                            placeholder="Share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                        />
                        <Button
                            onClick={handlePostComment}
                            disabled={!newComment.trim() || isSubmitting}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                    </div>
                )}

                {/* Discussion Thread */}
                <div className="space-y-4">
                    {topLevelComments.length > 0 ? (
                        topLevelComments.map(comment => (
                            <div key={comment.id}>
                                {/* Main Comment */}
                                <div className={`p-4 rounded-lg border ${comment.is_pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm">{comment.author_name}</span>
                                                {comment.is_staff_response && (
                                                    <Badge variant="outline" className="text-xs">Staff</Badge>
                                                )}
                                                {comment.is_pinned && (
                                                    <Pin className="w-3 h-3 text-yellow-600" />
                                                )}
                                                <span className="text-xs text-slate-500">
                                                    {format(new Date(comment.posted_date), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 text-sm mb-2">{comment.comment_text}</p>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleLike(comment)}
                                                    className="text-xs"
                                                >
                                                    <Heart className="w-3 h-3 mr-1" />
                                                    {comment.likes_count || 0}
                                                </Button>
                                                {currentUser && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setReplyTo(comment)}
                                                        className="text-xs"
                                                    >
                                                        Reply
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Replies */}
                                {getReplies(comment.id).map(reply => (
                                    <div key={reply.id} className="ml-12 mt-2">
                                        <div className="p-3 rounded-lg border bg-white">
                                            <div className="flex items-start gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-xs">{reply.author_name}</span>
                                                        {reply.is_staff_response && (
                                                            <Badge variant="outline" className="text-xs">Staff</Badge>
                                                        )}
                                                        <span className="text-xs text-slate-500">
                                                            {format(new Date(reply.posted_date), 'MMM d, h:mm a')}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 text-xs">{reply.comment_text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}