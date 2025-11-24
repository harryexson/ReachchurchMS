import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Award, UserCheck, Heart, CheckCircle, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function VolunteerPortal() {
    const [currentUser, setCurrentUser] = useState(null);
    const [myVolunteerRecord, setMyVolunteerRecord] = useState(null);
    const [myShifts, setMyShifts] = useState([]);
    const [myInvitations, setMyInvitations] = useState([]);
    const [myHours, setMyHours] = useState([]);
    const [availableOpportunities, setAvailableOpportunities] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Load all data in parallel for better performance
            const [volunteers, invitations, allShifts, hours, rolesList] = await Promise.all([
                base44.entities.Volunteer.filter({ email: user.email }),
                base44.entities.VolunteerInvitation.filter({ volunteer_email: user.email }, '-invited_date'),
                base44.entities.VolunteerShift.filter({ status: 'open' }, '-shift_date', 50),
                base44.entities.VolunteerHours.filter({ volunteer_email: user.email }, '-date'),
                base44.entities.VolunteerRole.filter({ is_active: true })
            ]);

            const volunteerRecord = volunteers[0];
            setMyVolunteerRecord(volunteerRecord);
            setMyInvitations(invitations);
            setMyHours(hours);
            setRoles(rolesList);

            // Process shifts efficiently
            if (invitations.length > 0) {
                const confirmedShiftIds = invitations
                    .filter(inv => inv.response === 'confirmed')
                    .map(inv => inv.shift_id);
                
                const myConfirmedShifts = allShifts.filter(s => confirmedShiftIds.includes(s.id));
                setMyShifts(myConfirmedShifts);
            }

            // Filter future shifts
            const now = new Date();
            const futureShifts = allShifts.filter(shift => new Date(shift.shift_date) >= now);
            setAvailableOpportunities(futureShifts);

        } catch (error) {
            console.error("Error loading volunteer data:", error);
        }
        setIsLoading(false);
    };

    const handleRespondToInvite = async (invitation, response) => {
        try {
            await base44.entities.VolunteerInvitation.update(invitation.id, {
                response,
                response_date: new Date().toISOString()
            });

            // Update shift spots if confirmed
            if (response === 'confirmed') {
                const shift = await base44.entities.VolunteerShift.filter({ id: invitation.shift_id });
                if (shift[0]) {
                    await base44.entities.VolunteerShift.update(shift[0].id, {
                        spots_filled: (shift[0].spots_filled || 0) + 1
                    });
                }
            }

            await loadData();
            alert(`You ${response} the invitation!`);
        } catch (error) {
            console.error("Error responding to invitation:", error);
            alert("Failed to respond");
        }
    };

    const totalHours = myHours.reduce((sum, record) => sum + (record.hours || 0), 0);
    const verifiedHours = myHours.filter(h => h.verified).reduce((sum, record) => sum + (record.hours || 0), 0);
    const upcomingShifts = myShifts.filter(s => new Date(s.shift_date) >= new Date());
    const pendingInvites = myInvitations.filter(i => i.response === 'pending');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-12">Loading your volunteer dashboard...</div>
                </div>
            </div>
        );
    }

    if (!myVolunteerRecord) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>Welcome to Volunteer Portal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p>You're not registered as a volunteer yet. Would you like to apply?</p>
                            <Button 
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={() => window.location.href = createPageUrl('VolunteerRegistration')}
                            >
                                Apply to Volunteer
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Volunteer Dashboard</h1>
                    <p className="text-slate-600 mt-1">Welcome back, {currentUser?.full_name}!</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Hours</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
                                </div>
                                <Clock className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Upcoming Shifts</p>
                                    <p className="text-2xl font-bold text-slate-900">{upcomingShifts.length}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Pending Invites</p>
                                    <p className="text-2xl font-bold text-slate-900">{pendingInvites.length}</p>
                                </div>
                                <UserCheck className="w-8 h-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Verified Hours</p>
                                    <p className="text-2xl font-bold text-slate-900">{verifiedHours.toFixed(1)}</p>
                                </div>
                                <Award className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="shifts" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="shifts">My Shifts</TabsTrigger>
                        <TabsTrigger value="invitations">Invitations ({pendingInvites.length})</TabsTrigger>
                        <TabsTrigger value="opportunities">Available Opportunities</TabsTrigger>
                        <TabsTrigger value="hours">My Hours</TabsTrigger>
                        <TabsTrigger value="roles">Explore Roles</TabsTrigger>
                    </TabsList>

                    <TabsContent value="shifts">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>My Upcoming Shifts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {upcomingShifts.length > 0 ? (
                                        upcomingShifts.map(shift => (
                                            <div key={shift.id} className="p-4 border rounded-lg hover:bg-slate-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{shift.event_title}</h3>
                                                        <div className="flex gap-2 mt-2">
                                                            <Badge>{shift.role}</Badge>
                                                            <Badge variant="outline">{shift.ministry.replace('_', ' ')}</Badge>
                                                        </div>
                                                        <div className="mt-2 text-sm text-slate-600 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="w-4 h-4" />
                                                                {format(new Date(shift.shift_date), 'EEEE, MMMM d, yyyy')}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                {shift.shift_start_time} - {shift.shift_end_time}
                                                            </div>
                                                            {shift.location_room && (
                                                                <div>📍 {shift.location_room}</div>
                                                            )}
                                                            {shift.team_leader_name && (
                                                                <div>👤 Team Leader: {shift.team_leader_name}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No upcoming shifts</p>
                                            <p className="text-sm">Check "Available Opportunities" to sign up!</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invitations">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Pending Invitations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pendingInvites.length > 0 ? (
                                        pendingInvites.map(invite => (
                                            <div key={invite.id} className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">{invite.event_title}</h3>
                                                        <p className="text-sm text-slate-600 mt-1">Role: {invite.role}</p>
                                                        <p className="text-sm text-slate-600">
                                                            📅 {format(new Date(invite.shift_date), 'MMMM d, yyyy')} at {invite.shift_time}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            Invited {format(new Date(invite.invited_date), 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleRespondToInvite(invite, 'confirmed')}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRespondToInvite(invite, 'declined')}
                                                        >
                                                            Decline
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No pending invitations</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="opportunities">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Available Volunteer Opportunities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {availableOpportunities.length > 0 ? (
                                        availableOpportunities.map(opportunity => {
                                            const spotsLeft = (opportunity.spots_needed || 1) - (opportunity.spots_filled || 0);
                                            const isFull = spotsLeft <= 0;

                                            return (
                                                <div key={opportunity.id} className={`p-4 border rounded-lg ${isFull ? 'opacity-60' : 'hover:bg-slate-50'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-lg">{opportunity.event_title}</h3>
                                                                {isFull && <Badge variant="outline" className="bg-red-50 text-red-700">FULL</Badge>}
                                                            </div>
                                                            <div className="flex gap-2 mt-2">
                                                                <Badge className="bg-purple-100 text-purple-800">{opportunity.role}</Badge>
                                                                <Badge variant="outline">{opportunity.ministry.replace('_', ' ')}</Badge>
                                                            </div>
                                                            <div className="mt-2 text-sm text-slate-600">
                                                                <div>📅 {format(new Date(opportunity.shift_date), 'EEEE, MMMM d, yyyy')}</div>
                                                                <div>🕐 {opportunity.shift_start_time} - {opportunity.shift_end_time}</div>
                                                                <div className="mt-1">
                                                                    <span className="font-semibold">{spotsLeft}</span> spot{spotsLeft !== 1 ? 's' : ''} remaining
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            disabled={isFull}
                                                            size="sm"
                                                            className="bg-purple-600 hover:bg-purple-700"
                                                            onClick={() => {
                                                                // TODO: Implement sign-up logic
                                                                alert("Sign-up functionality coming soon!");
                                                            }}
                                                        >
                                                            <Heart className="w-4 h-4 mr-1" />
                                                            Sign Up
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No opportunities available right now</p>
                                            <p className="text-sm">Check back soon for new volunteer needs!</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Service Hours Log</span>
                                    <Badge className="bg-purple-600 text-white">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        {totalHours.toFixed(1)} total hours
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {myHours.length > 0 ? (
                                        myHours.map(record => (
                                            <div key={record.id} className="p-3 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold">{record.event_title || 'Service'}</h4>
                                                        <p className="text-sm text-slate-600">Role: {record.role}</p>
                                                        <p className="text-sm text-slate-600">
                                                            📅 {format(new Date(record.date), 'MMM d, yyyy')} • {record.hours} hours
                                                        </p>
                                                    </div>
                                                    <div>
                                                        {record.verified ? (
                                                            <Badge className="bg-green-100 text-green-800">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">Pending</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No service hours recorded yet</p>
                                            <p className="text-sm">Your hours will appear here after you serve</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="roles">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Volunteer Roles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {roles.map(role => (
                                        <div key={role.id} className="p-4 border rounded-lg hover:bg-slate-50">
                                            <h3 className="font-semibold text-lg">{role.role_name}</h3>
                                            <Badge className="mt-2">{role.ministry_area.replace('_', ' ')}</Badge>
                                            <p className="text-sm text-slate-600 mt-2">{role.description}</p>
                                            
                                            {role.requirements && role.requirements.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-semibold text-slate-700">Requirements:</p>
                                                    <ul className="text-xs text-slate-600 list-disc ml-4">
                                                        {role.requirements.map((req, i) => (
                                                            <li key={i}>{req}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="mt-3 flex justify-between items-center">
                                                <span className="text-xs text-slate-500">
                                                    {role.current_volunteers}/{role.total_volunteers_needed} volunteers
                                                </span>
                                                {role.team_leader_name && (
                                                    <span className="text-xs text-slate-500">
                                                        Leader: {role.team_leader_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}