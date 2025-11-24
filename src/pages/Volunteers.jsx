import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    PlusCircle, Search, UserCheck, Users, Shield, Calendar, 
    Clock, CheckCircle, XCircle, AlertCircle, Bell, UserPlus, Award, TrendingUp, Mail, Phone, Send 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import VolunteerForm from "../components/volunteers/VolunteerForm";
import VolunteerRoleForm from "../components/volunteers/VolunteerRoleForm";
import HoursLogForm from "../components/volunteers/HoursLogForm";
import OpportunityForm from "../components/volunteers/OpportunityForm";
import { sendVolunteerInvite } from "@/functions/sendVolunteerInvite";
import { sendVolunteerReminders } from "@/functions/sendVolunteerReminders";

export default function VolunteersPage() {
    const [volunteers, setVolunteers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [hours, setHours] = useState([]);
    const [applications, setApplications] = useState([]);
    const [events, setEvents] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
    const [isHoursFormOpen, setIsHoursFormOpen] = useState(false);
    const [isOpportunityFormOpen, setIsOpportunityFormOpen] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [sendingInvites, setSendingInvites] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const [volunteerList, shiftsList, invitationsList, rolesList, hoursList, applicationsList, eventsList] = await Promise.all([
                base44.entities.Volunteer.list("-created_date"),
                base44.entities.VolunteerShift.list("-shift_date"),
                base44.entities.VolunteerInvitation.list("-invited_date", 200),
                base44.entities.VolunteerRole.list("-created_date"),
                base44.entities.VolunteerHours.list("-date"),
                base44.entities.VolunteerApplication.list("-created_date"),
                base44.entities.Event.list("-start_datetime")
            ]);

            setVolunteers(volunteerList);
            setShifts(shiftsList);
            setInvitations(invitationsList);
            setRoles(rolesList);
            setHours(hoursList);
            setApplications(applicationsList);
            setEvents(eventsList);
        } catch (error) {
            if (error.message && error.message.includes('aborted')) {
                console.log('Volunteer load aborted (navigation/unmount)');
                return;
            }
            console.error("Error loading volunteers:", error);
        }
        setIsLoading(false);
    };

    const handleFormSubmit = async (data) => {
        if (selectedVolunteer) {
            await base44.entities.Volunteer.update(selectedVolunteer.id, data);
        } else {
            await base44.entities.Volunteer.create(data);
        }
        await loadData();
        setIsFormOpen(false);
        setSelectedVolunteer(null);
    };

    const handleRoleSubmit = async (data) => {
        if (selectedRole) {
            await base44.entities.VolunteerRole.update(selectedRole.id, data);
        } else {
            await base44.entities.VolunteerRole.create(data);
        }
        await loadData();
        setIsRoleFormOpen(false);
        setSelectedRole(null);
    };

    const handleHoursSubmit = async (data) => {
        await base44.entities.VolunteerHours.create(data);
        await loadData();
        setIsHoursFormOpen(false);
    };

    const handleOpportunitySubmit = async (data) => {
        if (selectedOpportunity) {
            await base44.entities.VolunteerShift.update(selectedOpportunity.id, data);
        } else {
            await base44.entities.VolunteerShift.create(data);
        }
        await loadData();
        setIsOpportunityFormOpen(false);
        setSelectedOpportunity(null);
    };

    const handleAddOpportunity = () => {
        setSelectedOpportunity(null);
        setIsOpportunityFormOpen(true);
    };

    const handleEditOpportunity = (opportunity) => {
        setSelectedOpportunity(opportunity);
        setIsOpportunityFormOpen(true);
    };

    const handleEdit = (volunteer) => {
        setSelectedVolunteer(volunteer);
        setIsFormOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedVolunteer(null);
        setIsFormOpen(true);
    };

    const handleAddRole = () => {
        setSelectedRole(null);
        setIsRoleFormOpen(true);
    };

    const handleEditRole = (role) => {
        setSelectedRole(role);
        setIsRoleFormOpen(true);
    };

    const handleSendInvites = async (shiftId, ministry) => {
        setSendingInvites(true);
        try {
            const response = await sendVolunteerInvite({
                shift_id: shiftId,
                ministry_filter: ministry,
                send_method: 'both'
            });

            if (response.data.success) {
                alert(`Invitations sent to ${response.data.results.invited} volunteers!`);
                await loadData();
            }
        } catch (error) {
            console.error('Failed to send invites:', error);
            alert('Failed to send invitations');
        }
        setSendingInvites(false);
    };

    const handleSendReminders = async (shiftId) => {
        try {
            const response = await sendVolunteerReminders({
                shift_id: shiftId,
                hours_before: 24,
                send_method: 'both'
            });

            if (response.data.success) {
                alert(`Reminders sent to ${response.data.results.sent} volunteers!`);
                await loadData();
            }
        } catch (error) {
            console.error('Failed to send reminders:', error);
            alert('Failed to send reminders');
        }
    };

    const handleApproveApplication = async (application) => {
        try {
            // Update application
            await base44.entities.VolunteerApplication.update(application.id, {
                application_status: 'approved',
                approved_by: currentUser.email,
                approval_date: new Date().toISOString().split('T')[0]
            });

            // Create volunteer record
            await base44.entities.Volunteer.create({
                member_name: application.applicant_name,
                email: application.applicant_email,
                phone: application.applicant_phone,
                ministry: application.ministry_areas[0] || 'general',
                role: application.roles_interested[0] || 'General Volunteer',
                availability: application.availability,
                skills: application.skills,
                status: 'active',
                background_check: application.background_check_completed
            });

            await loadData();
            alert('Application approved and volunteer record created!');
        } catch (error) {
            console.error('Error approving application:', error);
            alert('Failed to approve application');
        }
    };

    const handleVerifyHours = async (hoursRecord) => {
        try {
            await base44.entities.VolunteerHours.update(hoursRecord.id, {
                verified: true,
                verified_by: currentUser.email,
                verified_date: new Date().toISOString().split('T')[0]
            });
            await loadData();
            alert('Hours verified!');
        } catch (error) {
            console.error('Error verifying hours:', error);
            alert('Failed to verify hours');
        }
    };

    const getShiftInvitations = (shiftId) => {
        return invitations.filter(inv => inv.shift_id === shiftId);
    };

    const getConfirmedCount = (shiftId) => {
        return invitations.filter(inv => inv.shift_id === shiftId && inv.response === 'confirmed').length;
    };

    const getPendingCount = (shiftId) => {
        return invitations.filter(inv => inv.shift_id === shiftId && inv.response === 'pending').length;
    };

    const filteredVolunteers = volunteers.filter(volunteer =>
        volunteer.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.ministry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
    const backgroundChecked = volunteers.filter(v => v.background_check).length;
    const upcomingShifts = shifts.filter(s => new Date(s.shift_date) > new Date() && s.status === 'open').length;
    const totalHours = hours.reduce((sum, h) => sum + (h.hours || 0), 0);
    const pendingApplications = applications.filter(a => a.application_status === 'pending').length;

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Volunteer Management</h1>
                        <p className="text-slate-600 mt-1">Recruit, schedule, and track your volunteer teams.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAddOpportunity} variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Create Opportunity
                        </Button>
                        <Button onClick={handleAddRole} variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Add Role
                        </Button>
                        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Add Volunteer
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Active Volunteers</p>
                                    <p className="text-2xl font-bold text-slate-900">{activeVolunteers}</p>
                                </div>
                                <UserCheck className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Volunteers</p>
                                    <p className="text-2xl font-bold text-slate-900">{volunteers.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Upcoming Shifts</p>
                                    <p className="text-2xl font-bold text-slate-900">{upcomingShifts}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Hours</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(0)}</p>
                                </div>
                                <Clock className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Applications</p>
                                    <p className="text-2xl font-bold text-slate-900">{pendingApplications}</p>
                                </div>
                                <UserPlus className="w-8 h-8 text-pink-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="shifts" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="shifts">Shifts & Invitations</TabsTrigger>
                        <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
                        <TabsTrigger value="directory">Volunteer Directory</TabsTrigger>
                        <TabsTrigger value="hours">Hours Tracking</TabsTrigger>
                        <TabsTrigger value="applications">Applications ({pendingApplications})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="shifts">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Upcoming Volunteer Shifts ({upcomingShifts})</CardTitle>
                                <Button onClick={handleAddOpportunity} size="sm" className="bg-green-600 hover:bg-green-700">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Create Opportunity
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {shifts.filter(s => new Date(s.shift_date) > new Date()).map(shift => {
                                        const shiftInvitations = getShiftInvitations(shift.id);
                                        const confirmedCount = getConfirmedCount(shift.id);
                                        const pendingCount = getPendingCount(shift.id);
                                        const spotsNeeded = shift.spots_needed || 1;
                                        const isFull = confirmedCount >= spotsNeeded;

                                        return (
                                            <div key={shift.id} className="border rounded-lg p-6 hover:bg-slate-50 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">{shift.event_title}</h3>
                                                        <div className="flex gap-2 mt-2">
                                                            <Badge className="bg-blue-100 text-blue-800">{shift.role}</Badge>
                                                            <Badge variant="outline">{shift.ministry.replace('_', ' ')}</Badge>
                                                            {isFull && <Badge className="bg-green-100 text-green-800">FULL</Badge>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-slate-600">
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <Calendar className="w-4 h-4" />
                                                                {new Date(shift.shift_date).toLocaleDateString()}
                                                            </div>
                                                            <div className="flex items-center gap-2 justify-end mt-1">
                                                                <Clock className="w-4 h-4" />
                                                                {shift.shift_start_time} - {shift.shift_end_time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Overview */}
                                                <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50 p-4 rounded-lg">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
                                                        <div className="text-xs text-slate-600">Confirmed</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                                                        <div className="text-xs text-slate-600">Pending</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-slate-600">{spotsNeeded - confirmedCount}</div>
                                                        <div className="text-xs text-slate-600">Still Needed</div>
                                                    </div>
                                                </div>

                                                {/* Confirmed Volunteers List */}
                                                {shiftInvitations.filter(i => i.response === 'confirmed').length > 0 && (
                                                    <div className="mb-4">
                                                        <p className="text-sm font-semibold text-slate-700 mb-2">✅ Confirmed Volunteers:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {shiftInvitations.filter(i => i.response === 'confirmed').map(inv => (
                                                                <Badge key={inv.id} className="bg-green-50 text-green-800 border border-green-200">
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                    {inv.volunteer_name}
                                                                    {inv.reminder_sent && <Bell className="w-3 h-3 ml-1" />}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pending Invitations */}
                                                {shiftInvitations.filter(i => i.response === 'pending').length > 0 && (
                                                    <div className="mb-4">
                                                        <p className="text-sm font-semibold text-slate-700 mb-2">⏳ Waiting for Response:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {shiftInvitations.filter(i => i.response === 'pending').map(inv => (
                                                                <Badge key={inv.id} variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                                    {inv.volunteer_name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditOpportunity(shift)}
                                                        className="border-slate-300"
                                                    >
                                                        Edit Opportunity
                                                    </Button>
                                                    {!isFull && (
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleSendInvites(shift.id, shift.ministry)}
                                                            disabled={sendingInvites}
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            {sendingInvites ? (
                                                                <>
                                                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                                    Sending...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                    Send Invites ({volunteers.filter(v => v.ministry === shift.ministry && v.status === 'active').length} eligible)
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    {confirmedCount > 0 && (
                                                        <Button 
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleSendReminders(shift.id)}
                                                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                                        >
                                                            <Bell className="w-4 h-4 mr-2" />
                                                            Send Reminders
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {shifts.filter(s => new Date(s.shift_date) > new Date()).length === 0 && (
                                        <div className="text-center py-12 text-slate-500">
                                            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                            <p>No upcoming shifts scheduled</p>
                                            <p className="text-sm">Create volunteer shifts from the Events page</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="roles">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Volunteer Roles</CardTitle>
                                <Button onClick={handleAddRole} size="sm" className="bg-purple-600 hover:bg-purple-700">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Create Role
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {roles.map(role => (
                                        <div key={role.id} className="p-4 border rounded-lg hover:bg-slate-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{role.role_name}</h3>
                                                    <Badge className="mt-1">{role.ministry_area.replace('_', ' ')}</Badge>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                                                    Edit
                                                </Button>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{role.description}</p>
                                            
                                            {role.requirements && role.requirements.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-slate-700">Requirements:</p>
                                                    <ul className="text-xs text-slate-600 list-disc ml-4">
                                                        {role.requirements.map((req, i) => (
                                                            <li key={i}>{req}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                                <span className="text-sm text-slate-600">
                                                    {role.current_volunteers || 0}/{role.total_volunteers_needed} filled
                                                </span>
                                                {role.team_leader_name && (
                                                    <span className="text-xs text-slate-500">
                                                        Leader: {role.team_leader_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {roles.length === 0 && (
                                        <div className="text-center py-12 text-slate-500 col-span-full">
                                            <Award className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                            <p>No volunteer roles defined yet.</p>
                                            <p className="text-sm">Create roles to categorize and manage volunteer opportunities.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="directory">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Volunteer Directory ({filteredVolunteers.length})</CardTitle>
                                    <div className="relative w-full max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input 
                                            placeholder="Search volunteers..."
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Volunteer</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Ministry</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredVolunteers.length > 0 ? (
                                                filteredVolunteers.map((volunteer) => (
                                                    <TableRow key={volunteer.id}>
                                                        <TableCell className="font-medium">{volunteer.member_name}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3 text-slate-500" /> {volunteer.email}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-slate-500" /> {volunteer.phone}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{volunteer.ministry}</TableCell>
                                                        <TableCell>{volunteer.role}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={volunteer.status === 'active' ? 'default' : 'secondary'}>
                                                                {volunteer.status}
                                                            </Badge>
                                                            {volunteer.background_check && (
                                                                <Badge className="ml-2 bg-blue-100 text-blue-700">
                                                                    <Shield className="w-3 h-3 mr-1" />
                                                                    Checked
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(volunteer)}>
                                                                Edit
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                        <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                                        No volunteers found matching your search.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Volunteer Hours Tracking</CardTitle>
                                <Button onClick={() => setIsHoursFormOpen(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Log Hours
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {hours.length > 0 ? (
                                        hours.map(record => (
                                            <div key={record.id} className="p-4 border rounded-lg flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold">{record.volunteer_name}</h4>
                                                    <p className="text-sm text-slate-600">
                                                        {record.event_title || 'General Service'} • {record.role}
                                                    </p>
                                                    <p className="text-sm text-slate-600">
                                                        📅 {new Date(record.date).toLocaleDateString()} • {record.hours} hours
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {record.verified ? (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleVerifyHours(record)}
                                                            className="text-green-700 border-green-300 hover:bg-green-50"
                                                        >
                                                            Verify
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                            <p>No volunteer hours logged yet.</p>
                                            <p className="text-sm">Log hours for your volunteers to track their contributions.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="applications">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Volunteer Applications ({pendingApplications} pending)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {applications.filter(a => a.application_status === 'pending').length > 0 ? (
                                        applications.filter(a => a.application_status === 'pending').map(app => (
                                            <div key={app.id} className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">{app.applicant_name}</h3>
                                                        <p className="text-sm text-slate-600">{app.applicant_email} • {app.applicant_phone}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            {app.roles_interested.map((role, i) => (
                                                                <Badge key={i} variant="outline">{role}</Badge>
                                                            ))}
                                                        </div>
                                                        {app.why_volunteer && (
                                                            <p className="text-sm text-slate-700 mt-2">"{app.why_volunteer}"</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleApproveApplication(app)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline">
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <UserPlus className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                            <p>No pending volunteer applications.</p>
                                            <p className="text-sm">All applications have been reviewed.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {isFormOpen && (
                    <VolunteerForm
                        isOpen={isFormOpen}
                        setIsOpen={setIsFormOpen}
                        onSubmit={handleFormSubmit}
                        volunteer={selectedVolunteer}
                    />
                )}

                {isRoleFormOpen && (
                    <VolunteerRoleForm
                        isOpen={isRoleFormOpen}
                        setIsOpen={setIsRoleFormOpen}
                        onSubmit={handleRoleSubmit}
                        role={selectedRole}
                    />
                )}

                {isHoursFormOpen && (
                    <HoursLogForm
                        isOpen={isHoursFormOpen}
                        setIsOpen={setIsHoursFormOpen}
                        onSubmit={handleHoursSubmit}
                        volunteers={volunteers}
                        events={events}
                    />
                )}

                {isOpportunityFormOpen && (
                    <OpportunityForm
                        isOpen={isOpportunityFormOpen}
                        setIsOpen={setIsOpportunityFormOpen}
                        onSubmit={handleOpportunitySubmit}
                        opportunity={selectedOpportunity}
                        events={events}
                    />
                )}
            </div>
        </div>
    );
}