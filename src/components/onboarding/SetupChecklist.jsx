import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SetupChecklist({ tasks, onTaskComplete }) {
    const completedCount = tasks.filter(t => t.completed).length;
    const progressPercentage = (completedCount / tasks.length) * 100;

    const tasksByCategory = tasks.reduce((acc, task) => {
        if (!acc[task.category]) {
            acc[task.category] = [];
        }
        acc[task.category].push(task);
        return acc;
    }, {});

    const categories = [
        { id: 'setup', label: '🏗️ Initial Setup', icon: '🏗️' },
        { id: 'giving', label: '💰 Giving & Finance', icon: '💰' },
        { id: 'comms', label: '📢 Communication', icon: '📢' },
        { id: 'people', label: '👥 People Management', icon: '👥' }
    ];

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-slate-900">Setup Progress</h3>
                    <span className="text-sm text-slate-600">{completedCount} of {tasks.length} complete</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-slate-500 mt-2">{Math.round(progressPercentage)}% complete</p>
            </div>

            <div className="space-y-4">
                {categories.map((category) => {
                    const categoryTasks = tasksByCategory[category.id] || [];
                    if (categoryTasks.length === 0) return null;

                    const categoryCompleted = categoryTasks.filter(t => t.completed).length;
                    const isFullyComplete = categoryCompleted === categoryTasks.length;

                    return (
                        <Card key={category.id} className={isFullyComplete ? 'border-green-200 bg-green-50/50' : ''}>
                            <CardContent className="p-4">
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                            <span>{category.label}</span>
                                            {isFullyComplete && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                        </h4>
                                        <span className="text-xs text-slate-600">{categoryCompleted}/{categoryTasks.length}</span>
                                    </div>
                                    <Progress 
                                        value={(categoryCompleted / categoryTasks.length) * 100} 
                                        className="h-1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    {categoryTasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => onTaskComplete(task.id)}
                                            className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                                        >
                                            {task.completed ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5 group-hover:border-slate-400" />
                                            )}
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                                                )}
                                            </div>
                                            {task.estimated && (
                                                <span className="text-xs text-slate-400 flex-shrink-0">
                                                    {task.estimated}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {completedCount === tasks.length && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-green-900">Setup Complete!</p>
                        <p className="text-sm text-green-700">You've completed all recommended setup tasks.</p>
                    </div>
                </div>
            )}
        </div>
    );
}