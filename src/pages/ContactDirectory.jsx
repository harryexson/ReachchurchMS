
import React, { useState, useEffect } from "react";
import { ContactGroup } from "@/entities/ContactGroup";
import { Member } from "@/entities/Member";
import { Volunteer } from "@/entities/Volunteer";
import { Visitor } from "@/entities/Visitor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Users, Mail, Search, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContactGroupForm from "../components/contacts/ContactGroupForm";
import BulkEmailModal from "../components/contacts/BulkEmailModal";

export default function ContactDirectory() {
    const [groups, setGroups] = useState([]);
    const [members, setMembers] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState([]);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [groupsList, membersList, volunteersList, visitorsList] = await Promise.all([
            ContactGroup.list("-created_date"),
            Member.list(),
            Volunteer.list(),
            Visitor.list()
        ]);
        setGroups(groupsList);
        setMembers(membersList);
        setVolunteers(volunteersList);
        setVisitors(visitorsList);
        setIsLoading(false);
    };

    const handleGroupSubmit = async (data) => {
        if (selectedGroup) {
            await ContactGroup.update(selectedGroup.id, data);
        } else {
            await ContactGroup.create(data);
        }
        await loadData();
        setIsGroupFormOpen(false);
        setSelectedGroup(null);
    };

    const handleDeleteGroup = async (groupId) => {
        if (confirm("Are you sure you want to delete this group?")) {
            await ContactGroup.delete(groupId);
            await loadData();
        }
    };

    const handleEmailGroup = (group) => {
        setEmailRecipients(group.member_emails || []);
        setEmailSubject(`Message to ${group.group_name}`);
        setEmailBody(`Hello ${group.group_name} members,\n\n`);
        setIsEmailModalOpen(true);
    };

    const handleEmailAllMembers = () => {
        const allEmails = members.map(m => m.email).filter(Boolean);
        setEmailRecipients(allEmails);
        setEmailSubject("Important Message to All Church Members");
        setEmailBody("Dear Church Family,\n\n");
        setIsEmailModalOpen(true);
    };

    const handleEmailAllVolunteers = () => {
        const allEmails = volunteers.map(v => v.email).filter(Boolean);
        setEmailRecipients(allEmails);
        setEmailSubject("Message to Our Amazing Volunteers");
        setEmailBody("Dear Volunteers,\n\nThank you for your continued service! We wanted to reach out to share...\n\n");
        setIsEmailModalOpen(true);
    };

    const handleEmailAllVisitors = () => {
        const allEmails = visitors.map(v => v.email).filter(Boolean);
        setEmailRecipients(allEmails);
        setEmailSubject("Welcome from REACH Church! 👋");
        setEmailBody("Dear Friend,\n\nWe're so glad you visited REACH Church! We hope you felt welcomed and would love to stay connected with you.\n\n");
        setIsEmailModalOpen(true);
    };

    const filteredGroups = groups.filter(g => 
        g.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Contact Directory</h1>
                        <p className="text-slate-600 mt-1">Manage contact groups and send bulk communications.</p>
                    </div>
                    <Button onClick={() => { setSelectedGroup(null); setIsGroupFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Create Group
                    </Button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">All Members</p>
                                    <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={handleEmailAllMembers}>
                                <Mail className="w-4 h-4 mr-2" />
                                Email All Members
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">All Volunteers</p>
                                    <p className="text-2xl font-bold text-slate-900">{volunteers.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-green-500" />
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={handleEmailAllVolunteers}>
                                <Mail className="w-4 h-4 mr-2" />
                                Email All Volunteers
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">All Visitors</p>
                                    <p className="text-2xl font-bold text-slate-900">{visitors.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-purple-500" />
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={handleEmailAllVisitors}>
                                <Mail className="w-4 h-4 mr-2" />
                                Email All Visitors
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="groups" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="groups">Contact Groups ({filteredGroups.length})</TabsTrigger>
                        <TabsTrigger value="all-contacts">All Contacts ({members.length + volunteers.length + visitors.length})</TabsTrigger>
                        <TabsTrigger value="visitors">Visitors ({visitors.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="groups">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Contact Groups</CardTitle>
                                    <div className="relative w-full max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input 
                                            placeholder="Search groups..."
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
                                                <TableHead>Group Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Leader</TableHead>
                                                <TableHead>Members</TableHead>
                                                <TableHead>Access</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredGroups.map(group => (
                                                <TableRow key={group.id}>
                                                    <TableCell className="font-medium">{group.group_name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{group.group_type?.replace('_', ' ')}</Badge>
                                                    </TableCell>
                                                    <TableCell>{group.leader_name || 'N/A'}</TableCell>
                                                    <TableCell>{group.member_count || 0}</TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-slate-100 text-slate-800">
                                                            {group.access_level?.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleEmailGroup(group)}>
                                                                <Mail className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => { setSelectedGroup(group); setIsGroupFormOpen(true); }}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredGroups.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                        <p className="text-slate-500">No contact groups yet</p>
                                                        <p className="text-sm text-slate-400">Create your first contact group to organize communications</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="all-contacts">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>All Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {members.map(m => (
                                                <TableRow key={`member-${m.id}`}>
                                                    <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                                                    <TableCell>{m.email}</TableCell>
                                                    <TableCell>{m.phone || '-'}</TableCell>
                                                    <TableCell><Badge className="bg-blue-100 text-blue-800">Member</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            setEmailRecipients([m.email]);
                                                            setEmailSubject(`Personal Message for ${m.first_name}`);
                                                            setEmailBody(`Hi ${m.first_name},\n\n`);
                                                            setIsEmailModalOpen(true);
                                                        }}>
                                                            <Mail className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {volunteers.map(v => (
                                                <TableRow key={`volunteer-${v.id}`}>
                                                    <TableCell className="font-medium">{v.member_name}</TableCell>
                                                    <TableCell>{v.email}</TableCell>
                                                    <TableCell>{v.phone || '-'}</TableCell>
                                                    <TableCell><Badge className="bg-green-100 text-green-800">Volunteer</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            setEmailRecipients([v.email]);
                                                            setEmailSubject(`Thank you for volunteering, ${v.member_name.split(' ')[0]}!`);
                                                            setEmailBody(`Hi ${v.member_name.split(' ')[0]},\n\nWe wanted to personally thank you for your service in ${v.ministry}...\n\n`);
                                                            setIsEmailModalOpen(true);
                                                        }}>
                                                            <Mail className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {visitors.map(v => (
                                                <TableRow key={`visitor-${v.id}`}>
                                                    <TableCell className="font-medium">{v.name}</TableCell>
                                                    <TableCell>{v.email}</TableCell>
                                                    <TableCell>{v.phone || '-'}</TableCell>
                                                    <TableCell><Badge className="bg-purple-100 text-purple-800">Visitor</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            setEmailRecipients([v.email]);
                                                            setEmailSubject(`Welcome to REACH Church, ${v.name.split(' ')[0]}!`);
                                                            setEmailBody(`Hi ${v.name.split(' ')[0]},\n\nWe're so glad you visited us! We hope you felt welcomed...\n\n`);
                                                            setIsEmailModalOpen(true);
                                                        }}>
                                                            <Mail className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(members.length + volunteers.length + visitors.length) === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8">
                                                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                        <p className="text-slate-500">No contacts found</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="visitors">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Visitor Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Visit Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visitors.map(v => (
                                                <TableRow key={v.id}>
                                                    <TableCell className="font-medium">{v.name}</TableCell>
                                                    <TableCell>{v.email}</TableCell>
                                                    <TableCell>{v.phone || '-'}</TableCell>
                                                    <TableCell>{v.visit_date}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{v.follow_up_status?.replace('_', ' ')}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            setEmailRecipients([v.email]);
                                                            setEmailSubject(`Staying connected with you, ${v.name.split(' ')[0]}!`);
                                                            setEmailBody(`Hi ${v.name.split(' ')[0]},\n\nWe hope you've had a great week! We wanted to reach out and see how we can serve you...\n\n`);
                                                            setIsEmailModalOpen(true);
                                                        }}>
                                                            <Mail className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {visitors.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                        <p className="text-slate-500">No visitors yet</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {isGroupFormOpen && (
                    <ContactGroupForm
                        isOpen={isGroupFormOpen}
                        setIsOpen={setIsGroupFormOpen}
                        onSubmit={handleGroupSubmit}
                        group={selectedGroup}
                        members={members}
                        volunteers={volunteers}
                    />
                )}

                {isEmailModalOpen && (
                    <BulkEmailModal
                        isOpen={isEmailModalOpen}
                        setIsOpen={setIsEmailModalOpen}
                        recipients={emailRecipients}
                        defaultSubject={emailSubject}
                        defaultBody={emailBody}
                        onSent={loadData}
                    />
                )}
            </div>
        </div>
    );
}
