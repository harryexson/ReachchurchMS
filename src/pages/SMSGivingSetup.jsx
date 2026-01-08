import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Trash2, Phone, DollarSign, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function SMSGivingSetup() {
    const [keywords, setKeywords] = useState([]);
    const [smsGivingHistory, setSmsGivingHistory] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [newResponseMessage, setNewResponseMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSMSDonations: 0,
        totalAmount: 0,
        uniqueDonors: 0,
        avgAmount: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load phone number
            const settings = await base44.entities.ChurchSettings.list();
            if (settings[0]?.sinch_phone_number) {
                setPhoneNumber(settings[0].sinch_phone_number);
            }

            // Load text keywords for SMS giving
            const existingKeywords = await base44.entities.TextKeyword.filter({
                response_type: 'workflow'
            });
            setKeywords(existingKeywords);

            // Load SMS giving history
            const messages = await base44.entities.TextMessage.filter({
                message_type: 'sms_giving'
            });
            setSmsGivingHistory(messages.sort((a, b) => 
                new Date(b.created_date) - new Date(a.created_date)
            ).slice(0, 50));

            // Calculate stats
            const totalAmount = messages.reduce((sum, msg) => 
                sum + (msg.metadata?.amount || 0), 0);
            const uniquePhones = new Set(messages.map(m => m.from_number));
            
            setStats({
                totalSMSDonations: messages.length,
                totalAmount: totalAmount,
                uniqueDonors: uniquePhones.size,
                avgAmount: messages.length > 0 ? totalAmount / messages.length : 0
            });

        } catch (error) {
            console.error('Error loading data:', error);
        }
        setIsLoading(false);
    };

    const handleAddKeyword = async () => {
        if (!newKeyword.trim()) {
            alert('Please enter a keyword');
            return;
        }

        try {
            await base44.entities.TextKeyword.create({
                keyword: newKeyword.toUpperCase(),
                description: 'SMS Giving keyword',
                auto_response: newResponseMessage || `Thank you for giving! Reply with: ${newKeyword.toUpperCase()} [amount] to donate.`,
                response_type: 'workflow',
                workflow_steps: [
                    {
                        step_number: 1,
                        message: 'How much would you like to give?',
                        expected_response: 'number',
                        next_step_if_match: 2,
                        next_step_if_no_match: 1
                    },
                    {
                        step_number: 2,
                        message: 'Processing your donation...',
                        expected_response: 'any',
                        next_step_if_match: 3,
                        next_step_if_no_match: 3
                    }
                ],
                create_visitor_record: false,
                is_active: true
            });

            alert('SMS giving keyword added!');
            setNewKeyword('');
            setNewResponseMessage('');
            loadData();
        } catch (error) {
            console.error('Error adding keyword:', error);
            alert('Failed to add keyword');
        }
    };

    const handleDeleteKeyword = async (keywordId) => {
        if (!confirm('Delete this keyword?')) return;

        try {
            await base44.entities.TextKeyword.delete(keywordId);
            loadData();
        } catch (error) {
            console.error('Error deleting keyword:', error);
            alert('Failed to delete keyword');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-slate-900">SMS Giving</h1>
                </div>

                {/* Setup Instructions */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                        <p className="font-semibold mb-2">How SMS Giving Works:</p>
                        <ol className="text-sm space-y-1 ml-4 list-decimal">
                            <li>Donors text a keyword like "GIVE" to {phoneNumber || 'your church number'}</li>
                            <li>They include the amount: "GIVE 50" or "GIVE $100 tithe"</li>
                            <li>System sends them a secure payment link via SMS</li>
                            <li>They complete donation on mobile-optimized form</li>
                        </ol>
                    </AlertDescription>
                </Alert>

                {/* Stats Overview */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total SMS Donations</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.totalSMSDonations}</p>
                                </div>
                                <MessageSquare className="w-10 h-10 text-green-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Amount</p>
                                    <p className="text-3xl font-bold text-blue-600">${stats.totalAmount.toFixed(2)}</p>
                                </div>
                                <DollarSign className="w-10 h-10 text-blue-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Unique Donors</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.uniqueDonors}</p>
                                </div>
                                <Users className="w-10 h-10 text-purple-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-amber-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Avg. Amount</p>
                                    <p className="text-3xl font-bold text-orange-600">${stats.avgAmount.toFixed(2)}</p>
                                </div>
                                <TrendingUp className="w-10 h-10 text-orange-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Keyword Management */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>SMS Keywords</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add New Keyword */}
                            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                                <h3 className="font-semibold text-slate-900">Add New Keyword</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Keyword (e.g., GIVE, DONATE)</Label>
                                        <Input
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value.toUpperCase())}
                                            placeholder="GIVE"
                                            className="uppercase"
                                        />
                                    </div>
                                    <div>
                                        <Label>Auto-Response Message (Optional)</Label>
                                        <Input
                                            value={newResponseMessage}
                                            onChange={(e) => setNewResponseMessage(e.target.value)}
                                            placeholder="Thank you for giving!"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleAddKeyword}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Keyword
                                    </Button>
                                </div>
                            </div>

                            {/* Existing Keywords */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-900">Active Keywords</h3>
                                {keywords.length === 0 ? (
                                    <p className="text-sm text-slate-500">No keywords configured yet</p>
                                ) : (
                                    keywords.map(keyword => (
                                        <div key={keyword.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                            <div>
                                                <p className="font-semibold text-slate-900">{keyword.keyword}</p>
                                                <p className="text-sm text-slate-600">{keyword.auto_response}</p>
                                                <Badge className="mt-1">
                                                    {keyword.usage_count || 0} uses
                                                </Badge>
                                            </div>
                                            <Button
                                                onClick={() => handleDeleteKeyword(keyword.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent SMS Giving History */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Recent SMS Donations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {smsGivingHistory.length === 0 ? (
                                    <p className="text-sm text-slate-500">No SMS donations yet</p>
                                ) : (
                                    smsGivingHistory.map(msg => (
                                        <div key={msg.id} className="p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-slate-600" />
                                                        <p className="font-semibold text-slate-900">{msg.from_number}</p>
                                                        {msg.status === 'processed' ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 text-orange-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{msg.message_body}</p>
                                                    {msg.metadata?.amount && (
                                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                                            ${msg.metadata.amount} - {msg.metadata.donation_type}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {new Date(msg.created_date).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Usage Examples */}
                <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-900">Usage Examples</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-white rounded-lg">
                                <p className="font-semibold text-slate-900 mb-1">Simple Donation:</p>
                                <code className="text-green-700">GIVE 50</code>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <p className="font-semibold text-slate-900 mb-1">With Dollar Sign:</p>
                                <code className="text-green-700">GIVE $100</code>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <p className="font-semibold text-slate-900 mb-1">Specify Type:</p>
                                <code className="text-green-700">GIVE 75 tithe</code>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <p className="font-semibold text-slate-900 mb-1">Building Fund:</p>
                                <code className="text-green-700">DONATE 200 building</code>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}