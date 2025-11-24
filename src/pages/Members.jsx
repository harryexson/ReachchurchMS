
import React, { useState, useEffect, useMemo } from "react";
import { Member } from "@/entities/Member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, User, Mail, Phone, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MemberForm from "../components/members/MemberForm";
import ReportExportModal from "../components/reports/ReportExportModal";

export default function MembersPage() {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setIsLoading(true);
        const memberList = await Member.list("-created_date");
        setMembers(memberList);
        setIsLoading(false);
    };

    const handleFormSubmit = async (data) => {
        if (selectedMember) {
            await Member.update(selectedMember.id, data);
        } else {
            await Member.create(data);
        }
        await loadMembers();
        setIsFormOpen(false);
        setSelectedMember(null);
    };

    const handleEdit = (member) => {
        setSelectedMember(member);
        setIsFormOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedMember(null);
        setIsFormOpen(true);
    };

    const filteredMembers = useMemo(() => {
        if (!searchTerm) return members;
        return members.filter(member =>
            `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, searchTerm]);
    
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

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>All Members ({filteredMembers.length})</CardTitle>
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    placeholder="Search by name or email..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
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
                                                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        filteredMembers.map(member => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-slate-600" />
                                                        </div>
                                                        <span className="font-medium">{member.first_name} {member.last_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-slate-600">
                                                        <div className="flex items-center gap-2"><Mail className="w-3 h-3"/>{member.email}</div>
                                                        <div className="flex items-center gap-2"><Phone className="w-3 h-3"/>{member.phone}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[member.member_status]}>
                                                        {member.member_status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                                                        Edit
                                                    </Button>
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
                    />
                )}

                {isExportModalOpen && (
                    <ReportExportModal
                        isOpen={isExportModalOpen}
                        setIsOpen={setIsExportModalOpen}
                        reportType="members"
                    />
                )}
            </div>
        </div>
    );
}
