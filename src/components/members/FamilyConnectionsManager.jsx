import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function FamilyConnectionsManager({ isOpen, onClose, member }) {
    const [familyMembers, setFamilyMembers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMember, setSelectedMember] = useState("");
    const [relationship, setRelationship] = useState("");

    useEffect(() => {
        if (isOpen && member) {
            loadFamilyData();
        }
    }, [isOpen, member]);

    const loadFamilyData = async () => {
        try {
            // Load current family connections
            setFamilyMembers(member.family_members || []);

            // Load all members to link
            const members = await base44.entities.Member.list();
            setAllMembers(members.filter(m => m.id !== member.id));
        } catch (error) {
            console.error('Failed to load family data:', error);
            toast.error('Failed to load family connections');
        }
    };

    const handleAddConnection = () => {
        if (!selectedMember || !relationship) {
            toast.error('Please select a member and relationship type');
            return;
        }

        const memberToAdd = allMembers.find(m => m.id === selectedMember);
        if (!memberToAdd) return;

        const newConnection = {
            name: `${memberToAdd.first_name} ${memberToAdd.last_name}`,
            relationship: relationship,
            member_id: memberToAdd.id,
            email: memberToAdd.email,
            phone: memberToAdd.phone
        };

        setFamilyMembers([...familyMembers, newConnection]);
        setSelectedMember("");
        setRelationship("");
    };

    const handleRemoveConnection = (index) => {
        setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            await base44.entities.Member.update(member.id, {
                family_members: familyMembers
            });
            toast.success('Family connections saved!');
            onClose();
        } catch (error) {
            console.error('Failed to save family connections:', error);
            toast.error('Failed to save connections');
        }
    };

    const filteredMembers = allMembers.filter(m => {
        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Manage Family Connections - {member?.first_name} {member?.last_name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Connections */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Current Family Connections</Label>
                        {familyMembers.length > 0 ? (
                            <div className="space-y-2">
                                {familyMembers.map((connection, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <LinkIcon className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <p className="font-medium text-slate-900">{connection.name}</p>
                                                <p className="text-sm text-slate-600 capitalize">{connection.relationship}</p>
                                                {connection.phone && (
                                                    <p className="text-xs text-slate-500">{connection.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveConnection(index)}
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed">
                                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No family connections yet</p>
                            </div>
                        )}
                    </div>

                    {/* Add New Connection */}
                    <Card className="bg-slate-50">
                        <CardHeader>
                            <CardTitle className="text-base">Add Family Connection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Search Member</Label>
                                <Input
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Select Family Member</Label>
                                <Select value={selectedMember} onValueChange={setSelectedMember}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a member..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredMembers.slice(0, 10).map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.first_name} {m.last_name} - {m.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Relationship</Label>
                                <Select value={relationship} onValueChange={setRelationship}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select relationship..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="spouse">Spouse</SelectItem>
                                        <SelectItem value="parent">Parent</SelectItem>
                                        <SelectItem value="child">Child</SelectItem>
                                        <SelectItem value="sibling">Sibling</SelectItem>
                                        <SelectItem value="grandparent">Grandparent</SelectItem>
                                        <SelectItem value="grandchild">Grandchild</SelectItem>
                                        <SelectItem value="other">Other Relative</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button 
                                onClick={handleAddConnection} 
                                variant="outline"
                                className="w-full"
                                disabled={!selectedMember || !relationship}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Connection
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600">
                        Save Connections
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}