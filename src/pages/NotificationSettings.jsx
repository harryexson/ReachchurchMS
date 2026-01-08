import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Loader2, Save } from 'lucide-react';

export default function NotificationSettings() {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const prefs = await base44.entities.NotificationPreference.filter({
                user_email: user.email
            });

            if (prefs.length > 0) {
                setPreferences(prefs[0]);
            } else {
                setPreferences({
                    user_email: user.email,
                    event_notifications: true,
                    message_notifications: true,
                    subscription_notifications: true,
                    announcement_notifications: true,
                    donation_notifications: true,
                    system_notifications: true,
                    reminder_notifications: true,
                    email_notifications: false,
                    digest_frequency: 'realtime'
                });
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (preferences.id) {
                await base44.entities.NotificationPreference.update(preferences.id, preferences);
            } else {
                await base44.entities.NotificationPreference.create(preferences);
            }
            alert('Notification preferences saved successfully!');
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (field) => {
        setPreferences({ ...preferences, [field]: !preferences[field] });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const notificationTypes = [
        { key: 'event_notifications', label: 'Event Notifications', icon: '📅', description: 'Get notified about upcoming events and registrations' },
        { key: 'message_notifications', label: 'Message Notifications', icon: '✉️', description: 'Receive alerts for new messages and communications' },
        { key: 'subscription_notifications', label: 'Subscription Updates', icon: '💳', description: 'Stay informed about subscription renewals and billing' },
        { key: 'announcement_notifications', label: 'Announcements', icon: '📢', description: 'Receive important church announcements' },
        { key: 'donation_notifications', label: 'Donation Receipts', icon: '💝', description: 'Get notified about donation receipts and giving' },
        { key: 'system_notifications', label: 'System Notifications', icon: '⚙️', description: 'Technical updates and system maintenance alerts' },
        { key: 'reminder_notifications', label: 'Reminders', icon: '⏰', description: 'Event reminders and scheduled notifications' }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notification Settings</h1>
                    <p className="text-slate-600 mt-1">Manage how you receive notifications</p>
                </div>
            </div>

            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle>In-App Notifications</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {notificationTypes.map(type => (
                        <div key={type.key} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3 flex-1">
                                <span className="text-2xl">{type.icon}</span>
                                <div>
                                    <Label className="text-base font-semibold">{type.label}</Label>
                                    <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle(type.key)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                                    preferences[type.key] ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                                        preferences[type.key] ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div>
                            <Label className="text-base font-semibold">Email Notifications</Label>
                            <p className="text-sm text-slate-600 mt-1">
                                Also send notifications to your email address
                            </p>
                        </div>
                        <button
                            onClick={() => handleToggle('email_notifications')}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                                preferences.email_notifications ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-slate-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                                    preferences.email_notifications ? 'translate-x-7' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    <div>
                        <Label>Email Digest Frequency</Label>
                        <Select
                            value={preferences.digest_frequency}
                            onValueChange={(val) => setPreferences({ ...preferences, digest_frequency: val })}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="realtime">Real-time (as they happen)</SelectItem>
                                <SelectItem value="daily">Daily Digest</SelectItem>
                                <SelectItem value="weekly">Weekly Summary</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Preferences
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}