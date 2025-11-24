import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WorkflowBuilder from "../components/visitors/WorkflowBuilder";
import { 
    Plus, Edit, Play, Pause, BarChart3, Users, Zap, 
    TrendingUp, CheckCircle, Clock, Target
} from "lucide-react";

export default function VisitorFollowUpPage() {
    const [workflows, setWorkflows] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [activeTab, setActiveTab] = useState("workflows");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [workflowList, executionList] = await Promise.all([
                base44.entities.VisitorWorkflow.list("-created_date"),
                base44.entities.VisitorWorkflowExecution.list("-enrolled_date")
            ]);
            setWorkflows(workflowList);
            setExecutions(executionList);
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsLoading(false);
    };

    const handleCreate = () => {
        setSelectedWorkflow(null);
        setShowBuilder(true);
    };

    const handleEdit = (workflow) => {
        setSelectedWorkflow(workflow);
        setShowBuilder(true);
    };

    const handleSave = async () => {
        setShowBuilder(false);
        await loadData();
    };

    const handleToggleActive = async (workflow) => {
        try {
            await base44.entities.VisitorWorkflow.update(workflow.id, {
                is_active: !workflow.is_active
            });
            await loadData();
        } catch (error) {
            console.error("Error toggling workflow:", error);
        }
    };

    const handleManualEnroll = async (workflowId) => {
        const visitorEmail = prompt("Enter visitor email to manually enroll:");
        if (!visitorEmail) return;

        try {
            const visitors = await base44.entities.Visitor.filter({ email: visitorEmail });
            if (visitors.length === 0) {
                alert("Visitor not found");
                return;
            }

            const visitor = visitors[0];
            const workflow = workflows.find(w => w.id === workflowId);

            // Check if already enrolled
            const existing = await base44.entities.VisitorWorkflowExecution.filter({
                workflow_id: workflowId,
                visitor_id: visitor.id,
                status: 'active'
            });

            if (existing.length > 0) {
                alert("Visitor is already enrolled in this workflow");
                return;
            }

            await base44.entities.VisitorWorkflowExecution.create({
                workflow_id: workflowId,
                workflow_name: workflow.workflow_name,
                visitor_id: visitor.id,
                visitor_name: visitor.name,
                visitor_email: visitor.email,
                visitor_phone: visitor.phone,
                status: 'active',
                current_step: 1,
                total_steps: workflow.total_steps,
                enrolled_date: new Date().toISOString(),
                next_action_date: new Date().toISOString()
            });

            alert("Visitor enrolled in workflow!");
            await loadData();
        } catch (error) {
            console.error("Error enrolling visitor:", error);
            alert("Failed to enroll visitor");
        }
    };

    const getWorkflowStats = (workflowId) => {
        const workflowExecutions = executions.filter(e => e.workflow_id === workflowId);
        const active = workflowExecutions.filter(e => e.status === 'active').length;
        const completed = workflowExecutions.filter(e => e.status === 'completed').length;
        return { active, completed, total: workflowExecutions.length };
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Visitor Engagement Workflows</h1>
                        <p className="text-slate-600 mt-1">Automate visitor follow-up with multi-step sequences</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Workflow
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Workflows</p>
                                    <p className="text-2xl font-bold text-slate-900">{workflows.length}</p>
                                </div>
                                <Zap className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Active</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {workflows.filter(w => w.is_active).length}
                                    </p>
                                </div>
                                <Target className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Visitors Enrolled</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {executions.filter(e => e.status === 'active').length}
                                    </p>
                                </div>
                                <Users className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Completed</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {executions.filter(e => e.status === 'completed').length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="workflows">Workflows</TabsTrigger>
                        <TabsTrigger value="active">Active Enrollments</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>

                    <TabsContent value="workflows">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Workflow Templates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {workflows.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Zap className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-600 mb-4">No workflows created yet</p>
                                        <Button onClick={handleCreate} className="bg-blue-600">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Your First Workflow
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {workflows.map(workflow => {
                                            const stats = getWorkflowStats(workflow.id);
                                            return (
                                                <div key={workflow.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-semibold">{workflow.workflow_name}</h3>
                                                                <Badge className={workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                                    {workflow.is_active ? 'Active' : 'Paused'}
                                                                </Badge>
                                                                <Badge variant="outline">{workflow.trigger_type.replace('_', ' ')}</Badge>
                                                            </div>
                                                            {workflow.description && (
                                                                <p className="text-sm text-slate-600 mb-2">{workflow.description}</p>
                                                            )}
                                                            <div className="flex gap-4 text-sm text-slate-500">
                                                                <span>📊 {workflow.total_steps} steps</span>
                                                                <span>👥 {stats.active} active</span>
                                                                <span>✅ {stats.completed} completed</span>
                                                                {stats.total > 0 && (
                                                                    <span>📈 {((stats.completed / stats.total) * 100).toFixed(0)}% completion</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleEdit(workflow)}>
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => handleToggleActive(workflow)}
                                                                className={workflow.is_active ? 'text-orange-600' : 'text-green-600'}
                                                            >
                                                                {workflow.is_active ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                                                                {workflow.is_active ? 'Pause' : 'Activate'}
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => handleManualEnroll(workflow.id)}
                                                                className="text-blue-600"
                                                            >
                                                                <Plus className="w-4 h-4 mr-1" />
                                                                Enroll
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="active">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Active Enrollments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Visitor</TableHead>
                                            <TableHead>Workflow</TableHead>
                                            <TableHead>Progress</TableHead>
                                            <TableHead>Next Action</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {executions.filter(e => e.status === 'active').map(execution => (
                                            <TableRow key={execution.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{execution.visitor_name}</p>
                                                        <p className="text-xs text-slate-500">{execution.visitor_email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{execution.workflow_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{width: `${(execution.current_step / execution.total_steps) * 100}%`}}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-slate-600">
                                                            {execution.current_step}/{execution.total_steps}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {execution.next_action_date && (
                                                        <div className="text-sm text-slate-600">
                                                            <Clock className="w-3 h-3 inline mr-1" />
                                                            {new Date(execution.next_action_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="completed">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Completed Workflows</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Visitor</TableHead>
                                            <TableHead>Workflow</TableHead>
                                            <TableHead>Enrolled</TableHead>
                                            <TableHead>Completed</TableHead>
                                            <TableHead>Engagement</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {executions.filter(e => e.status === 'completed').map(execution => (
                                            <TableRow key={execution.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{execution.visitor_name}</p>
                                                        <p className="text-xs text-slate-500">{execution.visitor_email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{execution.workflow_name}</TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    {new Date(execution.enrolled_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    {execution.completed_date ? new Date(execution.completed_date).toLocaleDateString() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-slate-600">
                                                        <div>📧 {execution.messages_sent} sent</div>
                                                        <div>👁️ {execution.messages_opened} opened</div>
                                                        {execution.response_received && <div>✅ Responded</div>}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {showBuilder && (
                    <WorkflowBuilder
                        workflow={selectedWorkflow}
                        onSave={handleSave}
                        onClose={() => setShowBuilder(false)}
                    />
                )}
            </div>
        </div>
    );
}