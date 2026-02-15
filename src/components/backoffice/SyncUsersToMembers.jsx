import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";

export default function SyncUsersToMembers() {
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [syncStatus, setSyncStatus] = useState({});
    const [isScanning, setIsScanning] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);
    const [syncResults, setSyncResults] = useState(null);

    useEffect(() => {
        scanMissingMembers();
    }, []);

    const scanMissingMembers = async () => {
        setIsScanning(true);
        setError(null);
        try {
            const usersList = await base44.entities.User.list();
            const membersList = await base44.entities.Member.list();

            setUsers(usersList);
            setMembers(membersList);

            const memberEmails = new Set(membersList.map(m => m.email));
            const missingStatus = {};

            usersList.forEach(user => {
                missingStatus[user.id] = !memberEmails.has(user.email);
            });

            setSyncStatus(missingStatus);
        } catch (err) {
            setError(err.message || "Failed to scan users");
        } finally {
            setIsScanning(false);
        }
    };

    const syncUser = async (user) => {
        setIsSyncing(true);
        try {
            const response = await base44.functions.invoke('createMemberFromUser', {
                user_email: user.email,
                first_name: user.full_name?.split(' ')[0] || 'Member',
                last_name: user.full_name?.split(' ')[1] || user.email.split('@')[0],
                phone: user.phone
            });

            if (response.data?.success) {
                setSyncStatus(prev => ({ ...prev, [user.id]: false }));
                setSyncResults(prev => ({
                    ...prev,
                    [user.email]: 'success'
                }));
            } else {
                setSyncResults(prev => ({
                    ...prev,
                    [user.email]: `error: ${response.data?.error}`
                }));
            }
        } catch (err) {
            setSyncResults(prev => ({
                ...prev,
                [user.email]: `error: ${err.message}`
            }));
        } finally {
            setIsSyncing(false);
        }
    };

    const syncAllMissing = async () => {
        setIsSyncing(true);
        setSyncResults({});
        const usersToSync = users.filter(u => syncStatus[u.id]);

        for (const user of usersToSync) {
            try {
                const response = await base44.functions.invoke('createMemberFromUser', {
                    user_email: user.email,
                    first_name: user.full_name?.split(' ')[0] || 'Member',
                    last_name: user.full_name?.split(' ')[1] || user.email.split('@')[0],
                    phone: user.phone
                });

                if (response.data?.success) {
                    setSyncStatus(prev => ({ ...prev, [user.id]: false }));
                    setSyncResults(prev => ({
                        ...prev,
                        [user.email]: 'success'
                    }));
                } else {
                    setSyncResults(prev => ({
                        ...prev,
                        [user.email]: response.data?.error || 'Unknown error'
                    }));
                }
            } catch (err) {
                setSyncResults(prev => ({
                    ...prev,
                    [user.email]: err.message
                }));
            }
        }

        setIsSyncing(false);
    };

    const missingCount = Object.values(syncStatus).filter(v => v).length;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        Sync Users to Members
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            Users are system accounts while Members are church directory entries. 
                            Sync users without member records to create their directory profiles.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600">Total Users</p>
                            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600">With Members</p>
                            <p className="text-2xl font-bold text-green-900">{users.length - missingCount}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600">Missing Members</p>
                            <p className="text-2xl font-bold text-orange-900">{missingCount}</p>
                        </div>
                    </div>

                    {missingCount > 0 && (
                        <Button
                            onClick={syncAllMissing}
                            disabled={isSyncing || isScanning}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Syncing {missingCount} users...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Sync All Missing Members ({missingCount})
                                </>
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {missingCount > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Users Without Member Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isScanning ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users
                                            .filter(u => syncStatus[u.id])
                                            .map(user => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        {syncResults?.[user.email] === 'success' ? (
                                                            <Badge className="bg-green-100 text-green-800 flex w-fit items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Synced
                                                            </Badge>
                                                        ) : syncResults?.[user.email] ? (
                                                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {syncResults[user.email]}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">Pending</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {syncResults?.[user.email] !== 'success' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => syncUser(user)}
                                                                disabled={isSyncing}
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                Sync
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {missingCount === 0 && !isScanning && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-900">All users synced!</p>
                            <p className="text-sm text-green-700">Every user has a corresponding member record.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}