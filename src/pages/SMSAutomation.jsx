import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Calendar, Users, Play, Pause, Edit, Trash2, Plus, Clock, CheckCircle } from 'lucide-react';
import SMSWorkflowBuilder from '../components/sms/SMSWorkflowBuilder';
import ScheduledBroadcastForm from '../components/sms/ScheduledBroadcastForm';

export default function SMSAutomation() {
    const [workflows, setWorkflows] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [showWorkflowForm, setShowWorkflowForm] = useState(false);
    const [showBroadcastForm, setShowBroadcastForm] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [workflowsData, broadcastsData, executionsData] = await Promise.all([
                base44.entities.SMSWorkflow.list('-created_date'),
                base44.entities.ScheduledBroadcast.list('-created_date'),
                base44.entities.SMSWorkflowExecution.filter({ status: 'active' })
            ]);
            setWorkflows(workflowsData);
            setBroadcasts(broadcastsData);
            setExecutions(executionsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setIsLoading(false);
    };

    const handleSaveWorkflow = async (workflowData) => {
        try {
            if (editingWorkflow) {
                await base44.entities.SMSWorkflow.update(editingWorkflow.id, workflowData);
            } else {
                await base44.entities.SMSWorkflow.create(workflowData);
            }
            setShowWorkflowForm(false);
            setEditingWorkflow(null);
            loadData();
        } catch (error) {
            console.error('Error saving workflow:', error);
            alert('Failed to save workflow');
        }
    };

    const handleSaveBroadcast = async (broadcastData) => {
        try {
            await base44.entities.ScheduledBroadcast.create(broadcastData);
            setShowBroadcastForm(false);
            loadData();
        } catch (error) {
            console.error('Error scheduling broadcast:', error);
            alert('Failed to schedule broadcast');
        }
    };

    const toggleWorkflowStatus = async (workflow) => {
        try {
            await base44.entities.SMSWorkflow.update(workflow.id, {
                is_active: !workflow.is_active
            });
            loadData();
        } catch (error) {
            console.error('Error toggling workflow:', error);
        }
    };

    const deleteWorkflow = async (id) => {
        if (!confirm('Delete this workflow? Active executions will be stopped.')) return;
        
        try {
            await base44.entities.SMSWorkflow.delete(id);
            loadData();
        } catch (error) {
            console.error('Error deleting workflow:', error);
        }
    };

    const cancelBroadcast = async (id) => {
        if (!confirm('Cancel this scheduled broadcast?')) return;
        
        try {
            await base44.entities.ScheduledBroadcast.update(id, { status: 'cancelled' });
            loadData();
        } catch (error) {
            console.error('Error cancelling broadcast:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (showWorkflowForm) {
        return (
            <div className="p-6">
                <SMSWorkflowBuilder
                    workflow={editingWorkflow}
                    onSave={handleSaveWorkflow}
                    onCancel={() => {
                        setShowWorkflowForm(false);
                        setEditingWorkflow(null);
                    }}
                />
            </div>
        );
    }

    if (showBroadcastForm) {
        return (
            <div className="p-6">
                <ScheduledBroadcastForm
                    onSave={handleSaveBroadcast}
                    onCancel={() => setShowBroadcastForm(false)}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">SMS Automation</h1>
                    <p className="text-slate-600">Automated workflows and scheduled broadcasts</p>
                </div>
            </div>

            <Tabs defaultValue="workflows" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="workflows">
                        <Zap className="w-4 h-4 mr-2" />
                        Automated Workflows
                    </TabsTrigger>
                    <TabsTrigger value="broadcasts">
                        <Calendar className="w-4 h-4 mr-2" />
                        Scheduled Broadcasts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workflows" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Automated Follow-Up Workflows</h2>
                            <p className="text-sm text-slate-600">
                                Send multi-step message sequences based on triggers
                            </p>
                        </div>
                        <Button onClick={() => setShowWorkflowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Workflow
                        </Button>
                    </div>

                    {workflows.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Workflows Yet</h3>
                                <p className="text-slate-600 mb-4">
                                    Create your first automated workflow to send follow-up messages
                                </p>
                                <Button onClick={() => setShowWorkflowForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Workflow
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {workflows.map(workflow => {
                                const activeExecutions = executions.filter(e => e.workflow_id === workflow.id);
                                
                                return (
                                    <Card key={workflow.id}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold">{workflow.workflow_name}</h3>
                                                        <Badge variant={workflow.is_active ? 'default' : 'outline'}>
                                                            {workflow.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {workflow.trigger_type.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    
                                                    {workflow.trigger_keyword && (
                                                        <p className="text-sm text-slate-600 mb-2">
                                                            Trigger: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{workflow.trigger_keyword}</span>
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            {workflow.sequence_steps?.length || 0} steps
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            {activeExecutions.length} active
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4" />
                                                            {workflow.total_completed || 0} completed
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => toggleWorkflowStatus(workflow)}
                                                    >
                                                        {workflow.is_active ? (
                                                            <><Pause className="w-4 h-4 mr-2" />Pause</>
                                                        ) : (
                                                            <><Play className="w-4 h-4 mr-2" />Activate</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingWorkflow(workflow);
                                                            setShowWorkflowForm(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => deleteWorkflow(workflow.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="broadcasts" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Scheduled Broadcasts</h2>
                            <p className="text-sm text-slate-600">
                                Schedule messages to be sent at a specific time
                            </p>
                        </div>
                        <Button onClick={() => setShowBroadcastForm(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Schedule Broadcast
                        </Button>
                    </div>

                    {broadcasts.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Scheduled Broadcasts</h3>
                                <p className="text-slate-600 mb-4">
                                    Schedule your first broadcast to reach your audience at the perfect time
                                </p>
                                <Button onClick={() => setShowBroadcastForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Schedule Broadcast
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {broadcasts.map(broadcast => (
                                <Card key={broadcast.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{broadcast.campaign_name}</h3>
                                                    <Badge 
                                                        variant={
                                                            broadcast.status === 'sent' ? 'default' :
                                                            broadcast.status === 'cancelled' ? 'destructive' :
                                                            'outline'
                                                        }
                                                    >
                                                        {broadcast.status}
                                                    </Badge>
                                                </div>
                                                
                                                <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                                                    {broadcast.message_content}
                                                </p>

                                                <div className="flex items-center gap-6 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(broadcast.scheduled_date).toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        {broadcast.total_recipients} recipients
                                                    </div>
                                                    {broadcast.status === 'sent' && (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            {broadcast.messages_sent} sent
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {broadcast.status === 'scheduled' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => cancelBroadcast(broadcast.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}