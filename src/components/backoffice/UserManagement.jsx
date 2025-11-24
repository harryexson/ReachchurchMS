import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, UserCheck, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function UserManagement({ users, isLoading, onRefresh }) {
    const roleColors = {
        admin: "bg-red-100 text-red-800",
        user: "bg-blue-100 text-blue-800"
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>User Management</span>
                    <Button onClick={onRefresh} variant="outline" size="sm">
                        Refresh Data
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                users.slice(0, 20).map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold text-xs">
                                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{user.full_name || 'Unknown User'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={roleColors[user.role]}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(user.created_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-800">
                                                Active
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline">
                                                    <UserCheck className="w-3 h-3" />
                                                </Button>
                                                {user.role !== 'admin' && (
                                                    <Button size="sm" variant="outline">
                                                        <Shield className="w-3 h-3" />
                                                    </Button>
                                                )}
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
    );
}