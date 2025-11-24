import React, { useState, useEffect, useCallback } from "react";
import { VolunteerInvitation } from "@/entities/VolunteerInvitation";
import { VolunteerShift } from "@/entities/VolunteerShift";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User } from "lucide-react";

export default function VolunteerConfirmPage() {
    const [invitation, setInvitation] = useState(null);
    const [shift, setShift] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [responseSubmitted, setResponseSubmitted] = useState(false);

    const handleResponse = useCallback(async (response, invitationData) => {
        try {
            await VolunteerInvitation.update(invitationData.id, {
                response: response,
                response_date: new Date().toISOString()
            });

            // Update shift spots filled count
            if (response === 'confirmed') {
                const shiftData = await VolunteerShift.get(invitationData.shift_id);
                await VolunteerShift.update(invitationData.shift_id, {
                    spots_filled: (shiftData.spots_filled || 0) + 1
                });
            }

            setResponseSubmitted(true);
            setInvitation({...invitationData, response: response});
        } catch (error) {
            console.error('Error submitting response:', error);
            alert('Failed to submit response. Please try again.');
        }
    }, []);

    const loadInvitation = useCallback(async () => {
        const params = new URLSearchParams(window.location.search);
        const invitationId = params.get('invitation');
        const autoResponse = params.get('response');

        if (!invitationId) {
            setIsLoading(false);
            return;
        }

        try {
            const inv = await VolunteerInvitation.get(invitationId);
            setInvitation(inv);

            const shiftData = await VolunteerShift.get(inv.shift_id);
            setShift(shiftData);

            // Auto-respond if response parameter is present
            if (autoResponse && inv.response === 'pending') {
                await handleResponse(autoResponse, inv);
            }
        } catch (error) {
            console.error('Error loading invitation:', error);
        }
        setIsLoading(false);
    }, [handleResponse]);

    useEffect(() => {
        loadInvitation();
    }, [loadInvitation]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <p className="text-slate-600">Loading...</p>
            </div>
        );
    }

    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-semibold mb-2">Invitation Not Found</h2>
                        <p className="text-slate-600">This invitation link is invalid or has expired.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (responseSubmitted || invitation.response !== 'pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        {invitation.response === 'confirmed' ? (
                            <>
                                <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
                                <h2 className="text-2xl font-semibold mb-2">You're All Set! 🎉</h2>
                                <p className="text-slate-600 mb-4">
                                    Thank you for confirming! We'll send you a reminder before the event.
                                </p>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-20 h-20 mx-auto mb-4 text-orange-500" />
                                <h2 className="text-2xl font-semibold mb-2">Got It!</h2>
                                <p className="text-slate-600 mb-4">
                                    Thanks for letting us know. We'll find someone else for this role.
                                </p>
                            </>
                        )}
                        <div className="bg-slate-50 p-4 rounded-lg text-left">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <span><strong>Role:</strong> {invitation.role}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <span><strong>Date:</strong> {new Date(invitation.shift_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    <span><strong>Time:</strong> {invitation.shift_time}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <Card className="max-w-2xl w-full shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <CardTitle className="text-2xl">🙋 Volunteer Invitation</CardTitle>
                    <p className="text-blue-100">We'd love your help!</p>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-4">Hi {invitation.volunteer_name}! 👋</h3>
                        <p className="text-slate-600 mb-4">
                            You've been invited to serve in an upcoming event. Here are the details:
                        </p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg mb-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600">Event</label>
                            <p className="text-lg font-semibold">{invitation.event_title}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Your Role
                                </label>
                                <p className="text-lg font-semibold">{invitation.role}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Date
                                </label>
                                <p className="text-lg font-semibold">
                                    {new Date(invitation.shift_date).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Time
                                </label>
                                <p className="text-lg font-semibold">{invitation.shift_time}</p>
                            </div>

                            {shift?.campus && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Location
                                    </label>
                                    <p className="text-lg font-semibold">{shift.campus}</p>
                                </div>
                            )}
                        </div>

                        {shift?.special_requirements && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                                <label className="text-sm font-medium text-yellow-800">⚠️ Special Requirements</label>
                                <p className="text-yellow-900">{shift.special_requirements}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                        <p className="text-sm text-blue-900">
                            💡 <strong>Quick Tip:</strong> Please arrive 15 minutes early for check-in and any last-minute instructions.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-center font-semibold text-slate-700">Can you make it?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                size="lg"
                                onClick={() => handleResponse('confirmed', invitation)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Yes, I'll Be There!
                            </Button>
                            <Button 
                                size="lg"
                                onClick={() => handleResponse('declined', invitation)}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                <XCircle className="w-5 h-5 mr-2" />
                                Can't Make It
                            </Button>
                        </div>
                    </div>

                    {shift?.team_leader && (
                        <div className="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
                            Questions? Contact {shift.team_leader_name || 'your team leader'} at {shift.team_leader}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}