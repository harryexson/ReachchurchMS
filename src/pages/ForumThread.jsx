import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { 
    MessageSquare, ThumbsUp, Flag, CheckCircle, Shield,
    Trash2, Eye, ArrowLeft, Edit, Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function ForumThreadPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [thread, setThread] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadThread();
    }, []);

    const loadThread = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const urlParams = new URLSearchParams(window.location.search);
            const threadId = urlParams.get('id');

            if (!threadId) {
                window.location.href = createPageUrl('Forum');
                return;
            }

            const threadData = await base44.entities.ForumThread.filter({ id: threadId });
            if (threadData.length === 0) {
                toast.error('Thread not found');
                window.location.href = createPageUrl('Forum');
                return;
            }

            const currentThread = threadData[0];
            setThread(currentThread);

            // Increment view count
            await base44.entities.ForumThread.update(threadId, {
                view_count: (currentThread.view_count || 0) + 1
            });

            // Load posts
            const threadPosts = await base44.entities.ForumPost.filter({
                thread_id: threadId,
                status: 'active'
            }, 'created_date');

            setPosts(threadPosts);

        } catch (error) {
            console.error('Error loading thread:', error);
            toast.error('Failed to load thread');
        }
        setIsLoading(false);
    };

    const handleReply = async () => {
        if (!replyContent.trim()) {
            toast.error('Please enter a reply');
            return;
        }

        if (thread.is_locked && currentUser.role !== 'admin') {
            toast.error('This thread is locked');
            return;
        }

        setIsSending(true);
        try {
            await base44.entities.ForumPost.create({
                thread_id: thread.id,
                post_content: replyContent,
                author_email: currentUser.email,
                author_name: currentUser.full_name,
                author_role: currentUser.role,
                likes: []
            });

            // Update thread reply count
            await base44.entities.ForumThread.update(thread.id, {
                reply_count: (thread.reply_count || 0) + 1,
                last_reply_date: new Date().toISOString(),
                last_reply_author: currentUser.full_name
            });

            setReplyContent('');
            toast.success('Reply posted!');
            loadThread();

        } catch (error) {
            console.error('Error posting reply:', error);
            toast.error('Failed to post reply');
        }
        setIsSending(false);
    };

    const handleLikePost = async (post) => {
        try {
            const likes = post.likes || [];
            const hasLiked = likes.includes(currentUser.email);
            
            const updatedLikes = hasLiked
                ? likes.filter(email => email !== currentUser.email)
                : [...likes, currentUser.email];

            await base44.entities.ForumPost.update(post.id, {
                likes: updatedLikes
            });

            loadThread();
        } catch (error) {
            console.error('Error liking post:', error);
            toast.error('Failed to like post');
        }
    };

    const handleFlagPost = async (post) => {
        const reason = prompt('Why are you flagging this post?');
        if (!reason) return;

        try {
            await base44.entities.ForumPost.update(post.id, {
                is_flagged: true,
                flag_reason: reason
            });
            toast.success('Post flagged for moderation');
            loadThread();
        } catch (error) {
            console.error('Error flagging post:', error);
            toast.error('Failed to flag post');
        }
    };

    const handleDeletePost = async (post) => {
        if (currentUser.role !== 'admin' && post.author_email !== currentUser.email) return;
        
        const confirmed = confirm('Delete this post?');
        if (!confirmed) return;

        try {
            await base44.entities.ForumPost.update(post.id, {
                status: 'deleted'
            });
            toast.success('Post deleted');
            loadThread();
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
        }
    };

    const handleMarkSolution = async (post) => {
        if (thread.author_email !== currentUser.email && currentUser.role !== 'admin') return;

        try {
            await base44.entities.ForumPost.update(post.id, {
                is_solution: !post.is_solution
            });
            toast.success(post.is_solution ? 'Unmarked as solution' : 'Marked as solution');
            loadThread();
        } catch (error) {
            console.error('Error marking solution:', error);
            toast.error('Failed to update post');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!thread) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button 
                    variant="outline" 
                    onClick={() => window.location.href = createPageUrl('Forum')}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Forum
                </Button>

                {/* Thread Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    {thread.is_pinned && (
                                        <Badge className="bg-yellow-100 text-yellow-800">Pinned</Badge>
                                    )}
                                    {thread.is_locked && (
                                        <Badge className="bg-red-100 text-red-800">
                                            <Lock className="w-3 h-3 mr-1" />
                                            Locked
                                        </Badge>
                                    )}
                                    <Badge variant="outline">{thread.category.replace('_', ' ')}</Badge>
                                    <Badge variant="outline">
                                        <Eye className="w-3 h-3 mr-1" />
                                        {thread.view_count || 0} views
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl">{thread.title}</CardTitle>
                                <p className="text-slate-600 mt-3">{thread.description}</p>
                                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                                    <span>Started by <strong>{thread.author_name}</strong></span>
                                    <span>•</span>
                                    <span>{format(new Date(thread.created_date), 'MMM d, yyyy h:mm a')}</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Posts */}
                <div className="space-y-4">
                    {posts.map(post => (
                        <Card key={post.id} className={post.is_solution ? 'border-2 border-green-500' : ''}>
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold">
                                            {post.author_name[0].toUpperCase()}
                                        </span>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-slate-900">{post.author_name}</span>
                                            {post.author_role === 'admin' && (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Admin
                                                </Badge>
                                            )}
                                            {post.is_solution && (
                                                <Badge className="bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Solution
                                                </Badge>
                                            )}
                                            {post.is_flagged && currentUser?.role === 'admin' && (
                                                <Badge className="bg-red-100 text-red-800">
                                                    <Flag className="w-3 h-3 mr-1" />
                                                    Flagged
                                                </Badge>
                                            )}
                                            <span className="text-sm text-slate-500">
                                                {format(new Date(post.created_date), 'MMM d, yyyy h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 whitespace-pre-wrap">{post.post_content}</p>
                                        
                                        <div className="flex items-center gap-2 mt-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleLikePost(post)}
                                                className={post.likes?.includes(currentUser?.email) ? 'bg-blue-50' : ''}
                                            >
                                                <ThumbsUp className="w-3 h-3 mr-1" />
                                                {post.likes?.length || 0}
                                            </Button>
                                            
                                            {(thread.author_email === currentUser?.email || currentUser?.role === 'admin') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkSolution(post)}
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    {post.is_solution ? 'Unmark' : 'Mark'} Solution
                                                </Button>
                                            )}
                                            
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleFlagPost(post)}
                                            >
                                                <Flag className="w-3 h-3 mr-1" />
                                                Flag
                                            </Button>
                                            
                                            {(post.author_email === currentUser?.email || currentUser?.role === 'admin') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeletePost(post)}
                                                >
                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Reply Form */}
                {!thread.is_locked || currentUser?.role === 'admin' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Post a Reply</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Share your thoughts..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                rows={4}
                            />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleReply}
                                    disabled={isSending}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSending ? 'Posting...' : 'Post Reply'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Lock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-600">This thread is locked. No new replies can be added.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}