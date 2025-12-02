import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Users, Target, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function MessagePreview({ message, onClose }) {
    if (!message) return null;

    return (
        <Dialog open={!!message} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Message Preview
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Status & Channel */}
                    <div className="flex items-center gap-2">
                        <Badge className={
                            message.status === "sent" ? "bg-green-100 text-green-700" :
                            message.status === "draft" ? "bg-slate-100 text-slate-700" :
                            "bg-blue-100 text-blue-700"
                        }>
                            {message.status}
                        </Badge>
                        <Badge variant="outline">
                            {message.channel === "both" ? (
                                <>
                                    <Mail className="w-3 h-3 mr-1" />
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Email + SMS
                                </>
                            ) : message.channel === "email" ? (
                                <>
                                    <Mail className="w-3 h-3 mr-1" /> Email
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="w-3 h-3 mr-1" /> SMS
                                </>
                            )}
                        </Badge>
                    </div>

                    {/* Email Preview */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-3 border-b">
                            <p className="text-sm text-slate-600">Subject:</p>
                            <p className="font-semibold">{message.title}</p>
                        </div>
                        <div className="p-4 bg-white">
                            <p className="whitespace-pre-wrap">{message.message_body}</p>
                        </div>
                    </div>

                    {/* Target Info */}
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-600">Target:</span>
                            <span className="font-medium capitalize">
                                {message.target_type?.replace("_", " ")}
                            </span>
                        </p>
                        
                        {message.recipient_count > 0 && (
                            <p className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">Recipients:</span>
                                <span className="font-medium">{message.recipient_count}</span>
                            </p>
                        )}

                        {message.sent_count > 0 && (
                            <p className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-slate-600">Sent:</span>
                                <span className="font-medium text-green-700">{message.sent_count}</span>
                                {message.failed_count > 0 && (
                                    <span className="text-red-600">({message.failed_count} failed)</span>
                                )}
                            </p>
                        )}

                        {message.sent_date && (
                            <p className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">Sent on:</span>
                                <span className="font-medium">
                                    {format(new Date(message.sent_date), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Criteria Details */}
                    {message.target_criteria && Object.keys(message.target_criteria).some(k => 
                        Array.isArray(message.target_criteria[k]) && message.target_criteria[k].length > 0
                    ) && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 mb-2">Targeting Criteria:</p>
                            <div className="flex flex-wrap gap-1">
                                {message.target_criteria.ministry_areas?.map(area => (
                                    <Badge key={area} variant="outline" className="text-xs capitalize">
                                        {area.replace("_", " ")}
                                    </Badge>
                                ))}
                                {message.target_criteria.member_statuses?.map(status => (
                                    <Badge key={status} variant="outline" className="text-xs capitalize">
                                        {status.replace("_", " ")}
                                    </Badge>
                                ))}
                                {message.target_criteria.custom_emails?.map(email => (
                                    <Badge key={email} variant="outline" className="text-xs">
                                        {email}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}