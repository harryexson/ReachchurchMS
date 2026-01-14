import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    MessageSquare, Plus, Search, TrendingUp, Clock, Eye, 
    Pin, Lock, Flag, ThumbsUp, Users, Globe, Church as ChurchIcon,
    Shield, Trash2, Archive, MessageCircle, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function ForumPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedScope, setSelectedScope] = useState('my_church');
    const [showNewThread, setShowNewThread] = useState(false);
    const [newThread, setNewThread] = useState({
        title: '',
        description: '',
        category: 'general',
        scope: 'my_church',
        tags: []
    });

    useEffect(() => {
        loadData();
    }, [selectedScope]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            let allThreads = await base44.entities.ForumThread.filter({
                status: 'active'
            }, '-created_date');

            // Filter by scope
            if (selectedScope === 'my_church') {
                // Show only threads from user's church
                allThreads = allThreads.filter(t => 
                    t.scope === 'my_church' && t.created_by === user.email.split('@')[1]
                );
            } else {
                // Show community threads
                allThreads = allThreads.filter(t => t.scope === 'reach_community');
            }

            setThreads(allThreads);
        } catch (error) {
            console.error('Error loading forum:', error);
            toast.error('Failed to load forum');
        }
        setIsLoading(false);
    };

    const handleCreateThread = async () => {
        if (!newThread.title.trim() || !newThread.description.trim()) {
            toast.error('Please enter title and description');
            return;
        }

        try {
            await base44.entities.ForumThread.create({
                ...newThread,
                author_email: currentUser.email,
                author_name: currentUser.full_name,
                church_id: currentUser.email.split('@')[1],
                church_name: currentUser.church_name || 'My Church',
                view_count: 0,
                reply_count: 0
            });

            toast.success('Thread created!');
            setShowNewThread(false);
            setNewThread({
                title: '',
                description: '',
                category: 'general',
                scope: 'my_church',
                tags: []
            });
            loadData();
        } catch (error) {
            console.error('Error creating thread:', error);
            toast.error('Failed to create thread');
        }
    };

    const handlePinThread = async (thread) => {
        if (currentUser.role !== 'admin') return;
        
        try {
            await base44.entities.ForumThread.update(thread.id, {
                is_pinned: !thread.is_pinned
            });
            toast.success(thread.is_pinned ? 'Thread unpinned' : 'Thread pinned');
            loadData();
        } catch (error) {
            console.error('Error pinning thread:', error);
            toast.error('Failed to update thread');
        }
    };

    const handleLockThread = async (thread) => {
        if (currentUser.role !== 'admin') return;
        
        try {
            await base44.entities.ForumThread.update(thread.id, {
                is_locked: !thread.is_locked
            });
            toast.success(thread.is_locked ? 'Thread unlocked' : 'Thread locked');
            loadData();
        } catch (error) {
            console.error('Error locking thread:', error);
            toast.error('Failed to update thread');
        }
    };

    const handleDeleteThread = async (thread) => {
        if (currentUser.role !== 'admin' && thread.author_email !== currentUser.email) return;
        
        const confirmed = confirm('Delete this thread? This action cannot be undone.');
        if (!confirmed) return;
        
        try {
            await base44.entities.ForumThread.update(thread.id, {
                status: 'deleted'
            });
            toast.success('Thread deleted');
            loadData();
        } catch (error) {
            console.error('Error deleting thread:', error);
            toast.error('Failed to delete thread');
        }
    };

    const filteredThreads = threads.filter(thread => {
        const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            thread.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || thread.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
    });

    const categories = [
        { value: 'all', label: 'All Categories', icon: MessageSquare },
        { value: 'general', label: 'General Discussion', icon: MessageCircle },
        { value: 'prayer_requests', label: 'Prayer Requests', icon: MessageSquare },
        { value: 'bible_study', label: 'Bible Study', icon: MessageSquare },
        { value: 'events', label: 'Events', icon: MessageSquare },
        { value: 'volunteer', label: 'Volunteer', icon: Users },
        { value: 'youth', label: 'Youth', icon: Users },
        { value: 'family', label: 'Family', icon: Users },
        { value: 'worship', label: 'Worship', icon: MessageSquare },
        { value: 'community_outreach', label: 'Community Outreach', icon: Globe },
        { value: 'tech_support', label: 'Tech Support', icon: MessageSquare }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-slate-900">Community Forum</h1>
                    </div>
                    <Button onClick={() => setShowNewThread(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Thread
                    </Button>
                </div>

                {/* Scope Tabs */}
                <Tabs value={selectedScope} onValueChange={setSelectedScope}>
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="my_church">
                            <ChurchIcon className="w-4 h-4 mr-2" />
                            My Church
                        </TabsTrigger>
                        <TabsTrigger value="reach_community">
                            <Globe className="w-4 h-4 mr-2" />
                            REACH Community
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Search and Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search discussions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Threads List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading discussions...</p>
                            </CardContent>
                        </Card>
                    ) : filteredThreads.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No discussions yet</h3>
                                <p className="text-slate-600 mb-4">Be the first to start a conversation!</p>
                                <Button onClick={() => setShowNewThread(true)} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Thread
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredThreads.map(thread => (
                            <Card key={thread.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {thread.is_pinned && (
                                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                                <Pin className="w-3 h-3 mr-1" />
                                                                Pinned
                                                            </Badge>
                                                        )}
                                                        {thread.is_locked && (
                                                            <Badge className="bg-red-100 text-red-800">
                                                                <Lock className="w-3 h-3 mr-1" />
                                                                Locked
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline">{thread.category.replace('_', ' ')}</Badge>
                                                    </div>
                                                    <a 
                                                        href={createPageUrl('ForumThread') + '?id=' + thread.id}
                                                        className="text-xl font-semibold text-slate-900 hover:text-blue-600"
                                                    >
                                                        {thread.title}
                                                    </a>
                                                    <p className="text-slate-600 mt-2 line-clamp-2">{thread.description}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    {thread.view_count || 0} views
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MessageCircle className="w-4 h-4" />
                                                    {thread.reply_count || 0} replies
                                                </div>
                                                <span>by {thread.author_name}</span>
                                                <span>{format(new Date(thread.created_date), 'MMM d, yyyy')}</span>
                                            </div>

                                            {currentUser?.role === 'admin' && (
                                                <div className="flex gap-2 pt-2 border-t">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handlePinThread(thread)}
                                                    >
                                                        <Pin className="w-3 h-3 mr-1" />
                                                        {thread.is_pinned ? 'Unpin' : 'Pin'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleLockThread(thread)}
                                                    >
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        {thread.is_locked ? 'Unlock' : 'Lock'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeleteThread(thread)}
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* New Thread Dialog */}
                <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Start New Discussion</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Title</Label>
                                <Input
                                    placeholder="What's your discussion about?"
                                    value={newThread.title}
                                    onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Provide more details..."
                                    value={newThread.description}
                                    onChange={(e) => setNewThread({...newThread, description: e.target.value})}
                                    rows={6}
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Category</Label>
                                    <Select value={newThread.category} onValueChange={(val) => setNewThread({...newThread, category: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.filter(c => c.value !== 'all').map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Scope</Label>
                                    <Select value={newThread.scope} onValueChange={(val) => setNewThread({...newThread, scope: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="my_church">My Church Only</SelectItem>
                                            <SelectItem value="reach_community">REACH Community</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowNewThread(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateThread} className="bg-blue-600 hover:bg-blue-700">
                                    Create Thread
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}