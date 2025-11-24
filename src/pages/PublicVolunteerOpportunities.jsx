import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Calendar, Clock, Users, MapPin, Search, Filter, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function PublicVolunteerOpportunities() {
    const [opportunities, setOpportunities] = useState([]);
    const [roles, setRoles] = useState([]);
    const [churchSettings, setChurchSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [ministryFilter, setMinistryFilter] = useState("all");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [signingUp, setSigningUp] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Check authentication
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
                setIsAuthenticated(true);
            } catch (error) {
                setIsAuthenticated(false);
            }

            // Load church settings
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                setChurchSettings(settings[0]);
            }

            // Load open volunteer shifts (opportunities)
            const shifts = await base44.entities.VolunteerShift.filter({
                status: 'open'
            }, '-shift_date', 100);

            // Filter to future shifts
            const futureShifts = shifts.filter(shift => 
                new Date(shift.shift_date) >= new Date()
            );
            setOpportunities(futureShifts);

            // Load volunteer roles
            const rolesList = await base44.entities.VolunteerRole.filter({ is_active: true });
            setRoles(rolesList);

        } catch (error) {
            console.error("Error loading opportunities:", error);
        }
        setIsLoading(false);
    };

    const handleSignUp = async (opportunity) => {
        if (!isAuthenticated) {
            alert("Please sign in to volunteer");
            base44.auth.redirectToLogin(window.location.pathname);
            return;
        }

        setSigningUp(opportunity.id);
        try {
            // Check if volunteer record exists
            const volunteers = await base44.entities.Volunteer.filter({ 
                email: currentUser.email 
            });

            let volunteerRecord = volunteers[0];

            // Create volunteer record if doesn't exist
            if (!volunteerRecord) {
                volunteerRecord = await base44.entities.Volunteer.create({
                    member_name: currentUser.full_name,
                    email: currentUser.email,
                    phone: currentUser.phone_number || '',
                    ministry: opportunity.ministry,
                    role: opportunity.role,
                    status: 'active'
                });
            }

            // Create volunteer invitation
            await base44.entities.VolunteerInvitation.create({
                shift_id: opportunity.id,
                volunteer_email: currentUser.email,
                volunteer_name: currentUser.full_name,
                event_title: opportunity.event_title,
                shift_date: opportunity.shift_date,
                shift_time: `${opportunity.shift_start_time} - ${opportunity.shift_end_time}`,
                role: opportunity.role,
                response: 'confirmed',
                response_date: new Date().toISOString(),
                invited_date: new Date().toISOString(),
                invitation_method: 'self_signup'
            });

            // Update shift spots
            await base44.entities.VolunteerShift.update(opportunity.id, {
                spots_filled: (opportunity.spots_filled || 0) + 1
            });

            alert("Successfully signed up! Check your email for details.");
            await loadData();
        } catch (error) {
            console.error("Error signing up:", error);
            alert("Failed to sign up. Please try again.");
        }
        setSigningUp(null);
    };

    const filteredOpportunities = opportunities.filter(opp => {
        const matchesSearch = opp.event_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            opp.role?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMinistry = ministryFilter === 'all' || opp.ministry === ministryFilter;
        return matchesSearch && matchesMinistry;
    });

    const ministries = [...new Set(opportunities.map(o => o.ministry))];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Heart className="w-10 h-10" />
                        <h1 className="text-4xl font-bold">Volunteer Opportunities</h1>
                    </div>
                    <p className="text-xl text-purple-100">
                        {churchSettings?.church_name || 'Our Church'} - Make a difference in your community
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Filters */}
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder="Search opportunities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={ministryFilter} onValueChange={setMinistryFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Ministries</SelectItem>
                                    {ministries.map(ministry => (
                                        <SelectItem key={ministry} value={ministry}>
                                            {ministry.replace('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Opportunities List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-purple-600" />
                        <p className="mt-4 text-slate-600">Loading opportunities...</p>
                    </div>
                ) : filteredOpportunities.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {filteredOpportunities.map(opportunity => {
                            const spotsLeft = (opportunity.spots_needed || 1) - (opportunity.spots_filled || 0);
                            const isFull = spotsLeft <= 0;
                            const isSigningUp = signingUp === opportunity.id;

                            return (
                                <Card key={opportunity.id} className={`shadow-lg hover:shadow-xl transition-all ${isFull ? 'opacity-60' : ''}`}>
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl">{opportunity.event_title}</CardTitle>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge className="bg-purple-100 text-purple-800">
                                                        {opportunity.role}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {opportunity.ministry.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {isFull && (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                    FULL
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Calendar className="w-5 h-5 text-purple-600" />
                                                <span>{format(new Date(opportunity.shift_date), 'EEEE, MMMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Clock className="w-5 h-5 text-purple-600" />
                                                <span>{opportunity.shift_start_time} - {opportunity.shift_end_time}</span>
                                            </div>
                                            {opportunity.location_room && (
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <MapPin className="w-5 h-5 text-purple-600" />
                                                    <span>{opportunity.location_room}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Users className="w-5 h-5 text-purple-600" />
                                                <span className="font-semibold">{spotsLeft}</span> 
                                                <span>spot{spotsLeft !== 1 ? 's' : ''} remaining</span>
                                            </div>
                                        </div>

                                        {opportunity.description && (
                                            <p className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-lg">
                                                {opportunity.description}
                                            </p>
                                        )}

                                        {opportunity.team_leader_name && (
                                            <p className="text-sm text-slate-600 mb-4">
                                                <strong>Team Leader:</strong> {opportunity.team_leader_name}
                                            </p>
                                        )}

                                        <Button
                                            onClick={() => handleSignUp(opportunity)}
                                            disabled={isFull || isSigningUp}
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                        >
                                            {isSigningUp ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Signing Up...
                                                </>
                                            ) : isFull ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Opportunity Full
                                                </>
                                            ) : (
                                                <>
                                                    <Heart className="w-4 h-4 mr-2" />
                                                    Sign Up to Volunteer
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="shadow-lg">
                        <CardContent className="text-center py-12">
                            <Heart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                No opportunities available right now
                            </h3>
                            <p className="text-slate-600 mb-6">
                                Check back soon for new volunteer needs, or apply to become a volunteer!
                            </p>
                            <Button
                                onClick={() => window.location.href = createPageUrl('VolunteerRegistration')}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Apply to Volunteer
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Explore Roles Section */}
                {roles.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore Volunteer Roles</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {roles.slice(0, 6).map(role => (
                                <Card key={role.id} className="shadow-lg hover:shadow-xl transition-all">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-lg mb-2">{role.role_name}</h3>
                                        <Badge className="mb-3">{role.ministry_area.replace('_', ' ')}</Badge>
                                        <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                                        
                                        {role.requirements && role.requirements.length > 0 && (
                                            <div className="text-xs text-slate-500">
                                                <strong>Requirements:</strong>
                                                <ul className="list-disc ml-4 mt-1">
                                                    {role.requirements.slice(0, 2).map((req, i) => (
                                                        <li key={i}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}