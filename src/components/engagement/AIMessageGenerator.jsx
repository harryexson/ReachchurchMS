import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AIMessageGenerator({ contactId, contactType, onUseMessage }) {
    const [context, setContext] = useState("");
    const [purpose, setPurpose] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await base44.functions.invoke('generateAIFollowUpMessage', {
                contact_id: contactId,
                contact_type: contactType,
                workflow_context: context || 'Follow-up message',
                step_purpose: purpose || 'Encourage engagement'
            });

            setGeneratedMessage(response);
            toast.success('Message generated successfully!');
        } catch (error) {
            console.error('Error generating message:', error);
            toast.error('Failed to generate message');
        }
        setIsGenerating(false);
    };

    return (
        <Card className="border-2 border-purple-200 bg-purple-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Sparkles className="w-5 h-5" />
                    AI Message Generator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Workflow Context (Optional)</Label>
                    <Input
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="e.g., Welcome new members, Re-engage inactive member"
                    />
                </div>

                <div>
                    <Label>Step Purpose (Optional)</Label>
                    <Input
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g., Invite to small group, Check on wellbeing"
                    />
                </div>

                <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Personalized Message
                        </>
                    )}
                </Button>

                {generatedMessage && (
                    <div className="mt-4 space-y-3 p-4 bg-white border border-purple-200 rounded-lg">
                        <div>
                            <Label className="text-xs text-purple-600">Subject:</Label>
                            <p className="font-semibold text-slate-900">{generatedMessage.subject}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-purple-600">Message:</Label>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{generatedMessage.message_body}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedMessage.message_body);
                                    toast.success('Message copied!');
                                }}
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                            </Button>
                            {onUseMessage && (
                                <Button 
                                    size="sm"
                                    className="bg-purple-600"
                                    onClick={() => onUseMessage(generatedMessage)}
                                >
                                    Use This Message
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}