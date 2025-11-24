import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DollarSign, UserPlus, Contact } from "lucide-react";

const initialKeywordState = {
    keyword: "",
    description: "",
    auto_response: "",
    response_type: "simple",
    link_url: "",
    create_visitor_record: false,
    add_to_group: "",
    is_active: true
};

export default function KeywordForm({ isOpen, setIsOpen, onSubmit, keyword }) {
    const [formData, setFormData] = useState(initialKeywordState);

    // Quick link options with icons
    const quickLinks = [
        { 
            value: `${window.location.origin}/public/giving`, 
            label: "💰 Online Giving (No Sign-Up Required)",
            icon: DollarSign,
            description: "Accept donations instantly - no account needed",
            suggestedMessage: "Thank you for your generosity! Give securely here:",
            suggestedKeyword: "GIVE"
        },
        { 
            value: `${window.location.origin}/public/member-registration`, 
            label: "📝 Member Registration Form",
            icon: UserPlus,
            description: "New member application form",
            suggestedMessage: "Welcome! Complete your membership application here:",
            suggestedKeyword: "JOIN"
        },
        { 
            value: `${window.location.origin}/public/visitor-card`, 
            label: "👋 Visitor Connect Card",
            icon: Contact,
            description: "First-time visitor information form",
            suggestedMessage: "Thanks for visiting! We'd love to connect with you:",
            suggestedKeyword: "CONNECT"
        }
    ];

    useEffect(() => {
        if (keyword) {
            setFormData({
                keyword: keyword.keyword || "",
                description: keyword.description || "",
                auto_response: keyword.auto_response || "",
                response_type: keyword.response_type || "simple",
                link_url: keyword.link_url || "",
                create_visitor_record: keyword.create_visitor_record || false,
                add_to_group: keyword.add_to_group || "",
                is_active: keyword.is_active !== undefined ? keyword.is_active : true
            });
        } else {
            setFormData(initialKeywordState);
        }
    }, [keyword, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuickLinkSelect = (link) => {
        setFormData(prev => ({
            ...prev,
            response_type: 'link',
            link_url: link.value,
            auto_response: `${link.suggestedMessage} ${link.value}`,
            keyword: prev.keyword || link.suggestedKeyword,
            description: prev.description || link.description
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{keyword ? "Edit Keyword" : "Create New Keyword"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 py-4">
                        {/* Quick Setup Options */}
                        {!keyword && (
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Quick Setup (Recommended)</Label>
                                <p className="text-sm text-slate-600">
                                    Choose a pre-configured keyword to get started instantly:
                                </p>
                                <div className="grid gap-3">
                                    {quickLinks.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <button
                                                key={link.value}
                                                type="button"
                                                onClick={() => handleQuickLinkSelect(link)}
                                                className={`p-4 text-left rounded-lg border-2 transition-all hover:border-blue-400 hover:shadow-md ${
                                                    formData.link_url === link.value 
                                                        ? 'border-blue-500 bg-blue-50' 
                                                        : 'border-slate-200 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Icon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-semibold text-slate-900">{link.label}</span>
                                                            {formData.link_url === link.value && (
                                                                <Badge className="bg-blue-600">Selected</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-600 mb-2">{link.description}</p>
                                                        <div className="text-xs bg-slate-50 p-2 rounded border">
                                                            <span className="font-semibold">Keyword:</span> {link.suggestedKeyword}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-slate-500">Or configure manually</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="keyword">Keyword *</Label>
                            <Input 
                                id="keyword" 
                                name="keyword" 
                                value={formData.keyword} 
                                onChange={handleChange}
                                placeholder="GIVE, CONNECT, JOIN"
                                style={{textTransform: 'uppercase'}}
                                required 
                            />
                            <p className="text-xs text-slate-500">What people will text to your church number</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input 
                                id="description" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange}
                                placeholder="e.g., Instant online giving link"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="response_type">Response Type</Label>
                            <Select 
                                value={formData.response_type} 
                                onValueChange={(value) => handleSelectChange('response_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select response type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="simple">Simple Text Response</SelectItem>
                                    <SelectItem value="link">Send a Link</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.response_type === 'link' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="link_url">Link URL</Label>
                                    <Input
                                        id="link_url"
                                        name="link_url"
                                        value={formData.link_url}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        type="url"
                                        required={formData.response_type === 'link'}
                                    />
                                    <p className="text-xs text-slate-500">
                                        The link will be automatically included in the response message
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="auto_response">Auto Response Message *</Label>
                            <Textarea
                                id="auto_response"
                                name="auto_response"
                                value={formData.auto_response}
                                onChange={handleChange}
                                placeholder="Thank you for texting! Here's your link..."
                                rows={4}
                                required
                            />
                            <p className="text-xs text-slate-500">
                                This message will be sent automatically when someone texts this keyword
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="add_to_group">Add to Group (Optional)</Label>
                            <Input 
                                id="add_to_group" 
                                name="add_to_group" 
                                value={formData.add_to_group} 
                                onChange={handleChange}
                                placeholder="e.g., Donors, First Time Visitors"
                            />
                            <p className="text-xs text-slate-500">Group name for segmentation</p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="create_visitor_record"
                                checked={formData.create_visitor_record}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, create_visitor_record: checked }))}
                            />
                            <Label htmlFor="create_visitor_record" className="cursor-pointer">
                                Automatically create visitor record
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">
                                Keyword is active
                            </Label>
                        </div>

                        {formData.link_url === `${window.location.origin}/public/giving` && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <h4 className="font-semibold text-green-900 mb-2">💰 Instant Donations Enabled</h4>
                                <p className="text-sm text-green-800 mb-2">
                                    People who text this keyword will receive a link to give instantly without creating an account.
                                </p>
                                <ul className="text-xs text-green-700 space-y-1 list-disc ml-4">
                                    <li>No sign-up required - they can donate immediately</li>
                                    <li>Secure Stripe payment processing</li>
                                    <li>Automatic receipts sent via email</li>
                                    <li>Donations go directly to your connected bank account</li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Keyword</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}