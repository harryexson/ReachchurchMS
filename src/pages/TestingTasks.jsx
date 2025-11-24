
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
    ClipboardCheck, AlertCircle, CheckCircle, Clock, Star,
    ExternalLink, Loader2, Shield, Search, Filter
} from "lucide-react";

export default function TestingTasksPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [hardwareItems, setHardwareItems] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkAccessAndLoadData();
    }, [navigate]);

    const checkAccessAndLoadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const isBackOffice = user.role === 'admin' && 
                               (user.email?.includes('@reachtech.dev') || 
                                user.email?.includes('@platformdev.com') ||
                                user.developer_access === true ||
                                user.email === 'david@base44.app');

            if (!isBackOffice) {
                alert("This page is restricted to back office team members only.");
                navigate(createPageUrl('Dashboard'));
                return;
            }

            await loadTasks();
        } catch (error) {
            console.error("Access check failed:", error);
            navigate(createPageUrl('Dashboard'));
        }
    };

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const [tasksList, hardwareList] = await Promise.all([
                base44.entities.TestingTask.list("-created_date"),
                base44.entities.HardwareRecommendation.list()
            ]);
            
            setTasks(tasksList);
            
            const hardwareMap = {};
            hardwareList.forEach(hw => {
                hardwareMap[hw.id] = hw;
            });
            setHardwareItems(hardwareMap);
        } catch (error) {
            console.error("Error loading tasks:", error);
        }
        setIsLoading(false);
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.hardware_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.model_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = selectedStatus === "all" || task.task_status === selectedStatus;
        
        return matchesSearch && matchesStatus;
    });

    const handleStartTesting = (task) => {
        setSelectedTask(task);
        setIsTestModalOpen(true);
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            await base44.entities.TestingTask.update(taskId, updates);
            await loadTasks();
        } catch (error) {
            console.error("Error updating task:", error);
            alert("Failed to update task");
        }
    };

    const handleCompleteTest = async () => {
        try {
            const updates = {
                task_status: 'testing_complete',
                test_completion_date: new Date().toISOString()
            };
            
            await base44.entities.TestingTask.update(selectedTask.id, updates);
            
            // Update the associated HardwareRecommendation based on testing results
            if (selectedTask.final_status && selectedTask.final_status !== 'pending') { // Only update if a final_status was selected
                await base44.entities.HardwareRecommendation.update(selectedTask.hardware_id, {
                    status: selectedTask.final_status,
                    is_verified: selectedTask.final_status === 'recommended',
                    customer_rating: selectedTask.overall_rating,
                    test_notes: selectedTask.test_results // Assuming test_results maps to test_notes
                });
            }
            
            setIsTestModalOpen(false);
            await loadTasks();
            alert("Test completed successfully!");
        } catch (error) {
            console.error("Error completing test:", error);
            alert("Failed to complete test");
        }
    };

    const TaskCard = ({ task }) => {
        const hardware = hardwareItems[task.hardware_id];
        
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            testing_complete: 'bg-green-100 text-green-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };

        const priorityColors = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        };

        return (
            <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <CardTitle className="text-lg">{task.hardware_name}</CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                {task.manufacturer} • {task.model_number}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <Badge className={statusColors[task.task_status]}>
                                    {task.task_status.replace('_', ' ')}
                                </Badge>
                                <Badge className={priorityColors[task.priority]}>
                                    {task.priority}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm">
                        <p className="text-slate-600 mb-2">Category: <span className="font-medium">{task.hardware_category.replace('_', ' ')}</span></p>
                        {hardware && hardware.approximate_price && (
                            <p className="text-slate-600">Price: <span className="font-medium text-green-600">${hardware.approximate_price}</span></p>
                        )}
                        {hardware && !hardware.approximate_price && hardware.price_range && (
                            <p className="text-slate-600">Price: <span className="font-medium text-green-600">{hardware.price_range}</span></p>
                        )}
                    </div>

                    {task.assigned_to_name && (
                        <div className="text-sm bg-blue-50 p-2 rounded">
                            <p className="text-blue-900">Assigned to: {task.assigned_to_name}</p>
                        </div>
                    )}

                    {task.overall_rating && (
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={`w-4 h-4 ${
                                            i < task.overall_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-slate-600">{task.overall_rating}/5</span>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                        <Button
                            size="sm"
                            onClick={() => handleStartTesting(task)}
                            className="flex-1"
                        >
                            {task.task_status === 'pending' ? 'Start Testing' : 'View/Edit'}
                        </Button>
                        {hardware && (
                            <a 
                                href={createPageUrl('HardwareRecommendations')} 
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button size="sm" variant="outline">
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                    <p className="text-slate-600">Loading testing tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <ClipboardCheck className="w-8 h-8 text-blue-600" />
                            Hardware Testing Tasks
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Test and verify hardware compatibility
                        </p>
                        <Badge className="mt-2 bg-red-100 text-red-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Support Team Only
                        </Badge>
                    </div>
                    <Button onClick={loadTasks} variant="outline">
                        Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Tasks</p>
                                    <p className="text-2xl font-bold">{tasks.length}</p>
                                </div>
                                <ClipboardCheck className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Pending</p>
                                    <p className="text-2xl font-bold">
                                        {tasks.filter(t => t.task_status === 'pending').length}
                                    </p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">In Progress</p>
                                    <p className="text-2xl font-bold">
                                        {tasks.filter(t => t.task_status === 'in_progress').length}
                                    </p>
                                </div>
                                <Loader2 className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Completed</p>
                                    <p className="text-2xl font-bold">
                                        {tasks.filter(t => t.task_status === 'testing_complete' || t.task_status === 'approved').length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="testing_complete">Testing Complete</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="p-12 text-center">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-600">No testing tasks found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </div>

                {/* Testing Modal */}
                {selectedTask && (
                    <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Test: {selectedTask.hardware_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                {/* Hardware Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Hardware Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <Label>Manufacturer</Label>
                                            <p className="font-medium">{selectedTask.manufacturer}</p>
                                        </div>
                                        <div>
                                            <Label>Model</Label>
                                            <p className="font-medium">{selectedTask.model_number}</p>
                                        </div>
                                        <div>
                                            <Label>Category</Label>
                                            <p className="font-medium capitalize">{selectedTask.hardware_category.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <Label>Priority</Label>
                                            <Badge className="capitalize">{selectedTask.priority}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedTask.task_status === 'pending' && (
                                        <Button
                                            onClick={() => handleUpdateTask(selectedTask.id, {
                                                task_status: 'in_progress',
                                                test_start_date: new Date().toISOString(),
                                                assigned_to: currentUser.email,
                                                assigned_to_name: currentUser.full_name
                                            })}
                                            className="w-full"
                                        >
                                            Start Testing
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleCompleteTest}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Mark Complete
                                    </Button>
                                </div>

                                {/* Test Results Form */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Test Results</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>Overall Rating</Label>
                                            <Select
                                                value={String(selectedTask.overall_rating || '')}
                                                onValueChange={(value) => {
                                                    setSelectedTask({...selectedTask, overall_rating: Number(value)});
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select rating" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent (5/5)</SelectItem>
                                                    <SelectItem value="4">⭐⭐⭐⭐ Good (4/5)</SelectItem>
                                                    <SelectItem value="3">⭐⭐⭐ Fair (3/5)</SelectItem>
                                                    <SelectItem value="2">⭐⭐ Poor (2/5)</SelectItem>
                                                    <SelectItem value="1">⭐ Very Poor (1/5)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Final Recommendation</Label>
                                            <Select
                                                value={selectedTask.final_status}
                                                onValueChange={(value) => {
                                                    setSelectedTask({...selectedTask, final_status: value});
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="recommended">✅ Recommended</SelectItem>
                                                    <SelectItem value="compatible">✓ Compatible</SelectItem>
                                                    <SelectItem value="needs_work">⚠️ Needs Work</SelectItem>
                                                    <SelectItem value="not_recommended">❌ Not Recommended</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Test Results</Label>
                                            <Textarea
                                                value={selectedTask.test_results || ''}
                                                onChange={(e) => setSelectedTask({...selectedTask, test_results: e.target.value})}
                                                rows={4}
                                                placeholder="Enter detailed test results..."
                                            />
                                        </div>

                                        <div>
                                            <Label>Tester Notes (Internal)</Label>
                                            <Textarea
                                                value={selectedTask.tester_notes || ''}
                                                onChange={(e) => setSelectedTask({...selectedTask, tester_notes: e.target.value})}
                                                rows={3}
                                                placeholder="Internal notes..."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsTestModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCompleteTest}>
                                    Save & Complete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
