import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Edit, Trash2, Calendar, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import VolunteerPreferenceModal from "@/components/scheduling/VolunteerPreferenceModal";

export default function VolunteerScheduling() {
    const [showModal, setShowModal] = useState(false);
    const [editingPreference, setEditingPreference] = useState(null);
    const queryClient = useQueryClient();

    const { data: preferences = [], isLoading } = useQuery({
        queryKey: ['volunteerPreferences'],
        queryFn: () => base44.entities.VolunteerSchedulingPreference.list('-created_date')
    });

    const { data: members = [] } = useQuery({
        queryKey: ['members'],
        queryFn: () => base44.entities.Member.list()
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.VolunteerSchedulingPreference.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['volunteerPreferences'] });
            toast.success('Volunteer preference deleted');
        }
    });

    const getMemberPhoto = (email) => {
        const member = members.find(m => m.email === email);
        return member?.profile_picture_url;
    };

    const getMemberInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const preferenceLabels = {
        'every_week': 'Every Week',
        '1st_week': '1st Week',
        '2nd_week': '2nd Week',
        '3rd_week': '3rd Week',
        '4th_week': '4th Week',
        'once_a_month': 'Once a Month',
        'twice_a_month': 'Twice a Month',
        'as_needed': 'As Needed'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Volunteer Scheduling</h1>
                        <p className="text-slate-600 mt-1">Manage volunteer availability and preferences</p>
                    </div>
                    <Button 
                        onClick={() => {
                            setEditingPreference(null);
                            setShowModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Volunteer
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Volunteers</p>
                                    <p className="text-2xl font-bold text-slate-900">{preferences.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Available Now</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {preferences.filter(p => p.is_available).length}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">On Break</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {preferences.filter(p => !p.is_available).length}
                                    </p>
                                </div>
                                <Clock className="w-8 h-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Volunteer Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Times</TableHead>
                                    <TableHead>Preferences</TableHead>
                                    <TableHead>Positions</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {preferences.map(pref => {
                                    const [firstName, ...lastNameParts] = pref.volunteer_name.split(' ');
                                    const lastName = lastNameParts.join(' ');
                                    
                                    return (
                                        <TableRow key={pref.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={getMemberPhoto(pref.volunteer_email)} />
                                                        <AvatarFallback className="bg-blue-100 text-blue-700">
                                                            {getMemberInitials(firstName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{firstName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{lastName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {pref.preferred_services?.map((time, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {time}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-green-100 text-green-800">
                                                    {preferenceLabels[pref.scheduling_preference]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {pref.position_roles?.slice(0, 2).map((role, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs capitalize">
                                                            {role.replace('_', ' ')}
                                                        </Badge>
                                                    ))}
                                                    {pref.position_roles?.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{pref.position_roles.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingPreference(pref);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            if (confirm(`Remove ${pref.volunteer_name} from volunteer scheduling?`)) {
                                                                deleteMutation.mutate(pref.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {preferences.length === 0 && !isLoading && (
                            <div className="text-center py-12 text-slate-500">
                                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-lg mb-2">No volunteers added yet</p>
                                <p className="text-sm">Add volunteers and set their scheduling preferences</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {showModal && (
                    <VolunteerPreferenceModal
                        isOpen={showModal}
                        onClose={() => {
                            setShowModal(false);
                            setEditingPreference(null);
                        }}
                        preference={editingPreference}
                        members={members}
                    />
                )}
            </div>
        </div>
    );
}