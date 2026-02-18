import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Search, User, Mail, Phone, Download, Trash2, Filter, MapPin, Users, Zap, Eye, Link as LinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MemberForm from "../components/members/MemberForm";
import MemberFilters from "../components/members/MemberFilters";
import MembershipStats from "../components/members/MembershipStats";
import MemberDetailView from "../components/members/MemberDetailView";
import FamilyConnectionsManager from "../components/members/FamilyConnectionsManager";
import ReportExportModal from "../components/reports/ReportExportModal";
import BulkActionsModal from "../components/members/BulkActionsModal";
import { useUserOrganization } from "@/components/hooks/useUserOrganization";

export default function MembersPage() {
    const { user, subscription, isLoading: orgLoading } = useUserOrganization();
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        gender: "all",
        ageGroup: "all",
        city: "all",
        state: "all",
        ministry: "all",
        region: "all",
        group: "all"
    });
    const [memberGroups, setMemberGroups] = useState([]);
    const [groupAssignments, setGroupAssignments] = useState([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
    const [customFields, setCustomFields] = useState([]);
    const [viewingMember, setViewingMember] = useState(null);
    const [familyManagerOpen, setFamilyManagerOpen] = useState(false);
    const [familyMember, setFamilyMember] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (!orgLoading && user) {
            loadMembers();
            loadMemberGroups();
            loadGroupAssignments();
            loadCustomFields();
            loadUsers();

            // Real-time subscription for instant updates - CRITICAL: strict church_admin_email filtering
            const unsubscribe = base44.entities.Member.subscribe((event) => {
                const belongsToChurch = event.data?.church_admin_email === user.email;
                
                if (event.type === 'create' && belongsToChurch) {
                    setMembers(prev => [event.data, ...prev]);
                } else if (event.type === 'update' && belongsToChurch) {
                    setMembers(prev => prev.map(m => m.id === event.id ? event.data : m));
                } else if (event.type === 'delete') {
                    setMembers(prev => prev.filter(m => m.id !== event.id));
                }
            });

            return unsubscribe;
        }
    }, [orgLoading, user]);

    const loadMembers = async () => {
        setIsLoading(true);
        try {
            // CRITICAL: Load only members for this church by church_admin_email for strict data isolation
            const memberList = await base44.entities.Member.filter({ 
                church_admin_email: user.email
            });
            
            // Merge with user profile pictures
            const membersWithPhotos = memberList.map(member => {
                const linkedUser = users.find(u => u.email === member.email);
                return {
                    ...member,
                    profile_picture_url: linkedUser?.profile_picture_url || member.profile_picture_url
                };
            });
            
            setMembers(membersWithPhotos);
        } catch (error) {
            console.error('Error loading members:', error);
            setMembers([]);
        }
        setIsLoading(false);
    };

    const loadUsers = async () => {
        try {
            const usersList = await base44.entities.User.list();
            setUsers(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadMemberGroups = async () => {
        try {
            const groups = await base44.entities.MemberGroup.filter({ is_active: true });
            setMemberGroups(groups);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const loadGroupAssignments = async () => {
        try {
            const assignments = await base44.entities.MemberGroupAssignment.filter({ is_active: true });
            setGroupAssignments(assignments);
        } catch (error) {
            console.error('Error loading group assignments:', error);
        }
    };

    const loadCustomFields = async () => {
        try {
            const fields = await base44.entities.CustomFieldDefinition.filter({ 
                is_active: true,
                entity_type: "member"
            });
            setCustomFields(fields);
        } catch (error) {
            console.error('Error loading custom fields:', error);
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            console.log('💾 Saving member:', data);
            if (selectedMember) {
                // Extract only editable fields - exclude built-in fields
                const { id, created_date, updated_date, created_by, ...editableData } = data;
                await base44.entities.Member.update(selectedMember.id, editableData);
                console.log('✅ Member updated successfully:', selectedMember.id);
            } else {
                const newMember = await base44.entities.Member.create(data);
                console.log('✅ Member created successfully:', newMember.id);
            }
            await loadMembers();
            setIsFormOpen(false);
            setSelectedMember(null);
        } catch (error) {
            console.error('❌ Failed to save member:', error);
            alert('Failed to save member: ' + (error.message || 'Unknown error'));
        }
    };

    const handleEdit = (member) => {
        setSelectedMember(member);
        setIsFormOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedMember(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (memberId) => {
        await base44.entities.Member.delete(memberId);
        setDeleteConfirm(null);
        await loadMembers();
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "all",
            gender: "all",
            ageGroup: "all",
            city: "all",
            state: "all",
            ministry: "all",
            region: "all",
            group: "all"
        });
    };

    const toggleMemberSelection = (memberId) => {
        setSelectedMemberIds(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedMemberIds.length === filteredMembers.length) {
            setSelectedMemberIds([]);
        } else {
            setSelectedMemberIds(filteredMembers.map(m => m.id));
        }
    };

    const getSelectedMembers = () => {
        return members.filter(m => selectedMemberIds.includes(m.id));
    };

    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            // Search filter - enhanced to include more fields
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch = 
                    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchLower) ||
                    member.email?.toLowerCase().includes(searchLower) ||
                    member.phone?.includes(filters.search) ||
                    member.address?.toLowerCase().includes(searchLower) ||
                    member.city?.toLowerCase().includes(searchLower) ||
                    member.notes?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (filters.status !== "all" && member.member_status !== filters.status) {
                return false;
            }

            // Gender filter
            if (filters.gender !== "all" && member.gender !== filters.gender) {
                return false;
            }

            // Age group filter
            if (filters.ageGroup !== "all" && member.age_group !== filters.ageGroup) {
                return false;
            }

            // City filter
            if (filters.city !== "all" && member.city !== filters.city) {
                return false;
            }

            // State filter
            if (filters.state !== "all" && member.state !== filters.state) {
                return false;
            }

            // Ministry filter
            if (filters.ministry !== "all") {
                const involvements = member.ministry_involvement || [];
                if (!involvements.includes(filters.ministry)) {
                    return false;
                }
            }

            // Region filter
            if (filters.region !== "all" && member.region !== filters.region) {
                return false;
            }

            // Group filter
            if (filters.group !== "all") {
                const memberInGroup = groupAssignments.some(
                    assignment => assignment.member_id === member.id && assignment.group_id === filters.group
                );
                if (!memberInGroup) return false;
            }

            return true;
        });
    }, [members, filters]);
    
    const statusColors = {
        member: "bg-green-100 text-green-800",
        visitor: "bg-blue-100 text-blue-800",
        regular_attendee: "bg-purple-100 text-purple-800",
        inactive: "bg-gray-100 text-gray-800",
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Member Directory</h1>
                        <p className="text-slate-600 mt-1">Manage and engage with your congregation.</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedMemberIds.length > 0 && (
                            <Button
                                onClick={() => setIsBulkActionsOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Bulk Actions ({selectedMemberIds.length})
                            </Button>
                        )}
                        <Button 
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? "bg-blue-50 border-blue-300" : ""}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </Button>
                        <Button 
                            onClick={() => setIsExportModalOpen(true)} 
                            variant="outline"
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Directory
                        </Button>
                        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Add New Member
                        </Button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <MembershipStats members={members} />

                {/* Filters Panel */}
                {showFilters && (
                    <MemberFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        members={members}
                        memberGroups={memberGroups}
                        onClearFilters={clearFilters}
                    />
                )}

                {/* Delete Confirmation */}
                {deleteConfirm && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertDescription className="flex items-center justify-between">
                            <span className="text-red-800">
                                Are you sure you want to remove <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong> from the member directory?
                            </span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>
                                    Cancel
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                >
                                    Remove Member
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <CardTitle>All Members ({filteredMembers.length})</CardTitle>
                                {filteredMembers.length !== members.length && (
                                    <Badge variant="outline" className="text-blue-600">
                                        Filtered from {members.length}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tags</TableHead>
                                        <TableHead>Ministry</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        filteredMembers.map(member => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedMemberIds.includes(member.id)}
                                                        onCheckedChange={() => toggleMemberSelection(member.id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {member.profile_picture_url ? (
                                                            <img
                                                                src={member.profile_picture_url}
                                                                alt={`${member.first_name} ${member.last_name}`}
                                                                className="w-8 h-8 rounded-full object-cover border-2 border-blue-100"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-slate-600" />
                                                            </div>
                                                        )}
                                                        <div>
                                                           <div className="flex items-center gap-2">
                                                               <span className="font-medium">{member.first_name} {member.last_name}</span>
                                                               {users.find(u => u.email === member.email) && (
                                                                   <LinkIcon className="w-3 h-3 text-green-600" title="Has user account" />
                                                               )}
                                                           </div>

                                                            {member.gender && (
                                                                <span className="text-xs text-slate-400 capitalize">
                                                                    {member.gender}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-slate-600">
                                                        <div className="flex items-center gap-2"><Mail className="w-3 h-3"/>{member.email || 'N/A'}</div>
                                                        <div className="flex items-center gap-2"><Phone className="w-3 h-3"/>{member.phone || 'N/A'}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {(member.city || member.state) ? (
                                                        <div className="text-sm text-slate-600 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {[member.city, member.state].filter(Boolean).join(", ")}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[member.member_status]}>
                                                        {member.member_status?.replace('_', ' ') || 'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {member.tags?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {member.tags.slice(0, 2).map(tag => (
                                                                <Badge key={tag} variant="outline" className="text-xs bg-purple-50">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                            {member.tags.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{member.tags.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {member.ministry_involvement?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {member.ministry_involvement.slice(0, 2).map(m => (
                                                                <Badge key={m} variant="outline" className="text-xs capitalize">
                                                                    {m.replace('_', ' ')}
                                                                </Badge>
                                                            ))}
                                                            {member.ministry_involvement.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{member.ministry_involvement.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => setViewingMember(member.id)}
                                                            title="View details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => {
                                                                setFamilyMember(member);
                                                                setFamilyManagerOpen(true);
                                                            }}
                                                            title="Manage family"
                                                        >
                                                            <Users className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                                                            Edit
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => setDeleteConfirm(member)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {isFormOpen && (
                    <MemberForm
                        isOpen={isFormOpen}
                        setIsOpen={setIsFormOpen}
                        onSubmit={handleFormSubmit}
                        member={selectedMember}
                        customFields={customFields}
                    />
                )}

                {isExportModalOpen && (
                    <ReportExportModal
                        isOpen={isExportModalOpen}
                        setIsOpen={setIsExportModalOpen}
                        reportType="members"
                    />
                )}

                {isBulkActionsOpen && (
                    <BulkActionsModal
                        isOpen={isBulkActionsOpen}
                        setIsOpen={setIsBulkActionsOpen}
                        selectedMembers={getSelectedMembers()}
                        onComplete={() => {
                            loadMembers();
                            setSelectedMemberIds([]);
                        }}
                    />
                )}

                {viewingMember && (
                    <MemberDetailView
                        isOpen={!!viewingMember}
                        onClose={() => setViewingMember(null)}
                        memberId={viewingMember}
                        onEdit={(member) => {
                            setViewingMember(null);
                            handleEdit(member);
                        }}
                    />
                )}

                {familyManagerOpen && familyMember && (
                    <FamilyConnectionsManager
                        isOpen={familyManagerOpen}
                        onClose={() => {
                            setFamilyManagerOpen(false);
                            setFamilyMember(null);
                            loadMembers();
                        }}
                        member={familyMember}
                    />
                )}
            </div>
        </div>
    );
}