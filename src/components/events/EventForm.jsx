
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const initialEventState = {
    title: "",
    description: "",
    event_type: "sunday_service",
    start_datetime: "",
    end_datetime: "",
    location: "",
    pastor_speaker: "",
    planner_name: "",
    planner_email: "",
    expected_attendance: "",
    actual_attendance: "",
    require_volunteers: false,
    volunteers_needed: [],
    volunteers_assigned: [],
    status: "planned",
    registration_required: false,
    registration_limit: "",
    registration_deadline: "",
    registration_fee: "",
    is_recurring: false,
    recurrence_pattern: "none",
    recurrence_end_date: "",
    linked_sermon_id: "",
    linked_sermon_title: "",
    enable_discussion: false,
    discussion_topic: "",
    promotion_image_url: "",
    social_share_enabled: true,
    public_event: true,
    allow_feedback: true
};

export default function EventForm({ isOpen, setIsOpen, onSubmit, event, volunteers = [] }) {
    const [formData, setFormData] = useState(initialEventState);
    const [isLoading, setIsLoading] = useState(false);
    const [sermons, setSermons] = useState([]);

    useEffect(() => {
        loadSermons();
    }, []);

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || "",
                description: event.description || "",
                event_type: event.event_type || "sunday_service",
                start_datetime: event.start_datetime ? event.start_datetime.slice(0, 16) : "",
                end_datetime: event.end_datetime ? event.end_datetime.slice(0, 16) : "",
                location: event.location || "",
                pastor_speaker: event.pastor_speaker || "",
                planner_name: event.planner_name || "",
                planner_email: event.planner_email || "",
                expected_attendance: event.expected_attendance || "",
                actual_attendance: event.actual_attendance || "",
                require_volunteers: event.require_volunteers || false,
                volunteers_needed: event.volunteers_needed || [],
                volunteers_assigned: event.volunteers_assigned || [],
                status: event.status || "planned",
                registration_required: event.registration_required || false,
                registration_limit: event.registration_limit || "",
                registration_deadline: event.registration_deadline ? event.registration_deadline.split('T')[0] : "",
                registration_fee: event.registration_fee || "",
                is_recurring: event.is_recurring || false,
                recurrence_pattern: event.recurrence_pattern || "none",
                recurrence_end_date: event.recurrence_end_date ? event.recurrence_end_date.split('T')[0] : "",
                linked_sermon_id: event.linked_sermon_id || "",
                linked_sermon_title: event.linked_sermon_title || "",
                enable_discussion: event.enable_discussion || false,
                discussion_topic: event.discussion_topic || "",
                promotion_image_url: event.promotion_image_url || "",
                social_share_enabled: event.social_share_enabled !== undefined ? event.social_share_enabled : true,
                public_event: event.public_event !== undefined ? event.public_event : true,
                allow_feedback: event.allow_feedback !== undefined ? event.allow_feedback : true
            });
        } else {
            setFormData(initialEventState);
        }
    }, [event, isOpen]);

    const loadSermons = async () => {
        try {
            // Fetch the 50 most recent sermons, ordered by sermon_date descending
            const sermonList = await base44.entities.Sermon.list('-sermon_date', 50);
            setSermons(sermonList);
        } catch (error) {
            console.error("Error loading sermons:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // If sermon is selected, auto-fill title
        if (name === 'linked_sermon_id') {
            const selectedSermon = sermons.find(s => s.id === value);
            if (selectedSermon) {
                setFormData(prev => ({
                    ...prev,
                    linked_sermon_id: value, // Ensure ID is set
                    linked_sermon_title: selectedSermon.title
                }));
            } else if (value === null || value === "") { // If "No Sermon Linked" or cleared
                setFormData(prev => ({
                    ...prev,
                    linked_sermon_id: "",
                    linked_sermon_title: ""
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit({
                ...formData,
                expected_attendance: formData.expected_attendance ? parseInt(formData.expected_attendance) : null,
                actual_attendance: formData.actual_attendance ? parseInt(formData.actual_attendance) : null,
                registration_limit: formData.registration_limit ? parseInt(formData.registration_limit) : null,
                registration_fee: formData.registration_fee ? parseFloat(formData.registration_fee) : null,
                volunteers_needed: Array.isArray(formData.volunteers_needed)
                    ? formData.volunteers_needed
                    : (formData.volunteers_needed || '').split(',').map(s => s.trim()).filter(Boolean)
            });
            setIsOpen(false); // Close dialog on successful submission
        } catch (error) {
            console.error("Form submission error:", error);
        }
        setIsLoading(false);
    };

    const handleCancel = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{event ? "Edit Event" : "Schedule New Event"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="event_type">Event Type</Label>
                            <Select value={formData.event_type} onValueChange={(value) => handleSelectChange('event_type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sunday_service">Sunday Service</SelectItem>
                                    <SelectItem value="sunday_school">Sunday School</SelectItem>
                                    <SelectItem value="kids_zone">Kids Zone</SelectItem>
                                    <SelectItem value="bible_study">Bible Study</SelectItem>
                                    <SelectItem value="prayer_meeting">Prayer Meeting</SelectItem>
                                    <SelectItem value="fellowship">Fellowship</SelectItem>
                                    <SelectItem value="outreach">Outreach</SelectItem>
                                    <SelectItem value="special_event">Special Event</SelectItem>
                                    <SelectItem value="conference">Conference</SelectItem>
                                    <SelectItem value="small_group">Small Group</SelectItem>
                                    <SelectItem value="community_discussion">Community Discussion</SelectItem>
                                    <SelectItem value="wedding">Wedding</SelectItem>
                                    <SelectItem value="funeral">Funeral</SelectItem>
                                    <SelectItem value="baptism">Baptism</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="start_datetime">Start Date & Time</Label>
                            <Input id="start_datetime" name="start_datetime" type="datetime-local" value={formData.start_datetime} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_datetime">End Date & Time</Label>
                            <Input id="end_datetime" name="end_datetime" type="datetime-local" value={formData.end_datetime} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Main Sanctuary, Room A, etc." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pastor_speaker">Pastor/Speaker</Label>
                            <Input id="pastor_speaker" name="pastor_speaker" value={formData.pastor_speaker} onChange={handleChange} />
                        </div>

                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="planner_name">Event Planner Name</Label>
                                <Input id="planner_name" name="planner_name" value={formData.planner_name} onChange={handleChange} placeholder="e.g., Jane Doe" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="planner_email">Event Planner Email</Label>
                                <Input id="planner_email" name="planner_email" type="email" value={formData.planner_email} onChange={handleChange} placeholder="e.g., jane.doe@example.com" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expected_attendance">Expected Attendance</Label>
                            <Input id="expected_attendance" name="expected_attendance" type="number" min="0" value={formData.expected_attendance} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="actual_attendance">Actual Attendance</Label>
                            <Input id="actual_attendance" name="actual_attendance" type="number" min="0" value={formData.actual_attendance} onChange={handleChange} />
                        </div>

                        {/* NEW: Link to Sermon */}
                        <div className="col-span-1 md:col-span-2 space-y-2 p-4 bg-blue-50/20 rounded-lg border border-blue-100">
                            <Label htmlFor="linked_sermon_id">Link to Sermon (Optional)</Label>
                            <Select 
                                value={formData.linked_sermon_id} 
                                onValueChange={(value) => handleSelectChange('linked_sermon_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a sermon to link" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={""}>No Sermon Linked</SelectItem> {/* Changed null to empty string for consistency with formData */}
                                    {sermons.map(sermon => (
                                        <SelectItem key={sermon.id} value={sermon.id}>
                                            {sermon.title} {sermon.speaker ? ` - ${sermon.speaker}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">Link this event to a sermon for easy access from the sermon library.</p>
                        </div>

                        {/* NEW: Community Discussion */}
                        <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-purple-50/20 rounded-lg border border-purple-100">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="enable_discussion"
                                    checked={formData.enable_discussion}
                                    onCheckedChange={(checked) => handleSelectChange('enable_discussion', checked)}
                                />
                                <Label htmlFor="enable_discussion">Enable Community Discussion for this event</Label>
                            </div>

                            {formData.enable_discussion && (
                                <div className="space-y-2">
                                    <Label htmlFor="discussion_topic">Discussion Topic/Question</Label>
                                    <Textarea
                                        id="discussion_topic"
                                        name="discussion_topic"
                                        value={formData.discussion_topic}
                                        onChange={handleChange}
                                        placeholder="e.g., What did you learn from this week's message?"
                                        rows={2}
                                    />
                                    <p className="text-xs text-slate-500">This will be the main topic for discussion forums related to this event.</p>
                                </div>
                            )}
                        </div>

                        {/* NEW: Promotion & Sharing */}
                        <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-green-50/20 rounded-lg border border-green-100">
                            <Label className="text-base font-semibold">Promotion & Visibility</Label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="public_event"
                                        checked={formData.public_event}
                                        onCheckedChange={(checked) => handleSelectChange('public_event', checked)}
                                    />
                                    <Label htmlFor="public_event">Show on public calendar</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="social_share_enabled"
                                        checked={formData.social_share_enabled}
                                        onCheckedChange={(checked) => handleSelectChange('social_share_enabled', checked)}
                                    />
                                    <Label htmlFor="social_share_enabled">Allow social sharing</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allow_feedback"
                                        checked={formData.allow_feedback}
                                        onCheckedChange={(checked) => handleSelectChange('allow_feedback', checked)}
                                    />
                                    <Label htmlFor="allow_feedback">Collect feedback after event</Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="promotion_image_url">Promotional Image URL (Optional)</Label>
                                <Input
                                    id="promotion_image_url"
                                    name="promotion_image_url"
                                    value={formData.promotion_image_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/event-image.jpg"
                                />
                                <p className="text-xs text-slate-500">This image will be used when sharing the event on social media or for promotional purposes.</p>
                            </div>
                        </div>

                        {/* Volunteer Settings */}
                        <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="require_volunteers"
                                    name="require_volunteers"
                                    checked={formData.require_volunteers}
                                    onCheckedChange={(checked) => handleSelectChange('require_volunteers', checked)}
                                />
                                <Label htmlFor="require_volunteers">This event requires volunteer sign-ups</Label>
                            </div>

                            {formData.require_volunteers && (
                                <div className="space-y-2">
                                    <Label htmlFor="volunteers_needed">Volunteer Roles Needed</Label>
                                    <Input
                                        id="volunteers_needed"
                                        name="volunteers_needed"
                                        value={Array.isArray(formData.volunteers_needed) ? formData.volunteers_needed.join(', ') : formData.volunteers_needed}
                                        onChange={handleChange}
                                        placeholder="e.g., Greeter, Usher, Kids Ministry, Tech Booth"
                                    />
                                    <p className="text-xs text-slate-500">Enter roles separated by commas (e.g., Greeter, Usher).</p>
                                </div>
                            )}
                        </div>

                        {/* Registration Settings */}
                        <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="registration_required"
                                    checked={formData.registration_required}
                                    onCheckedChange={(checked) => handleSelectChange('registration_required', checked)}
                                />
                                <Label htmlFor="registration_required">Require Registration for this Event</Label>
                            </div>

                            {formData.registration_required && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="registration_limit">Registration Limit</Label>
                                        <Input
                                            id="registration_limit"
                                            name="registration_limit"
                                            type="number"
                                            min="1"
                                            value={formData.registration_limit}
                                            onChange={handleChange}
                                            placeholder="Leave empty for no limit"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="registration_deadline">Registration Deadline</Label>
                                        <Input
                                            id="registration_deadline"
                                            name="registration_deadline"
                                            type="date"
                                            value={formData.registration_deadline}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="registration_fee">Registration Fee ($)</Label>
                                        <Input
                                            id="registration_fee"
                                            name="registration_fee"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.registration_fee}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recurring Event Settings */}
                        <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_recurring"
                                    name="is_recurring"
                                    checked={formData.is_recurring}
                                    onCheckedChange={(checked) => handleSelectChange('is_recurring', checked)}
                                />
                                <Label htmlFor="is_recurring">Make this a recurring event</Label>
                            </div>

                            {formData.is_recurring && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                                        <Select value={formData.recurrence_pattern} onValueChange={(value) => handleSelectChange('recurrence_pattern', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select pattern" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Does not recur</SelectItem>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="recurrence_end_date">Recurrence End Date</Label>
                                        <Input
                                            id="recurrence_end_date"
                                            name="recurrence_end_date"
                                            type="date"
                                            value={formData.recurrence_end_date}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Event"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
