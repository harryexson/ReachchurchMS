import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Download, FileText, Video, BookOpen, Users, 
    Calendar, Search, Plus, Edit, Trash2, Loader2,
    FileSpreadsheet, Image, Archive, Link as LinkIcon,
    Clock, User, Star, Filter, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import ResourceUploadModal from "../components/resources/ResourceUploadModal";
import WebinarModal from "../components/resources/WebinarModal";
import WebinarRegistrationModal from "../components/resources/WebinarRegistrationModal";

const categoryLabels = {
    templates: "Templates",
    guides: "Guides & eBooks",
    videos: "Video Tutorials",
    graphics: "Graphics & Media",
    training: "Training Materials",
    forms: "Forms & Documents",
    other: "Other"
};

const fileTypeIcons = {
    pdf: FileText,
    doc: FileText,
    xlsx: FileSpreadsheet,
    zip: Archive,
    image: Image,
    video: Video,
    canva: Image,
    link: LinkIcon
};

const fileTypeColors = {
    pdf: "bg-red-100 text-red-800",
    doc: "bg-blue-100 text-blue-800",
    xlsx: "bg-green-100 text-green-800",
    zip: "bg-orange-100 text-orange-800",
    image: "bg-pink-100 text-pink-800",
    video: "bg-purple-100 text-purple-800",
    canva: "bg-pink-100 text-pink-800",
    link: "bg-slate-100 text-slate-800"
};

export default function ResourcesPage() {
    const [resources, setResources] = useState([]);
    const [webinars, setWebinars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [fileTypeFilter, setFileTypeFilter] = useState("all");

    // Modals
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showWebinarModal, setShowWebinarModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [selectedWebinar, setSelectedWebinar] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [resourceList, webinarList] = await Promise.all([
                base44.entities.Resource.list("-created_date"),
                base44.entities.Webinar.list("-scheduled_date")
            ]);
            setResources(resourceList);
            setWebinars(webinarList);

            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
                setIsAdmin(user?.role === "admin");
            } catch {
                setCurrentUser(null);
                setIsAdmin(false);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setIsLoading(false);
    };

    const handleDownload = async (resource) => {
        // Increment download count
        await base44.entities.Resource.update(resource.id, {
            download_count: (resource.download_count || 0) + 1
        });
        
        if (resource.file_url) {
            window.open(resource.file_url, "_blank");
        }
    };

    const handleDeleteResource = async (id) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;
        await base44.entities.Resource.delete(id);
        loadData();
    };

    const handleDeleteWebinar = async (id) => {
        if (!confirm("Are you sure you want to delete this webinar?")) return;
        await base44.entities.Webinar.delete(id);
        loadData();
    };

    // Filter resources
    const filteredResources = resources.filter(r => {
        const matchesSearch = !searchQuery || 
            r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
        const matchesType = fileTypeFilter === "all" || r.file_type === fileTypeFilter;
        return matchesSearch && matchesCategory && matchesType;
    });

    // Group resources by category
    const groupedResources = filteredResources.reduce((acc, r) => {
        const cat = r.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    // Split webinars
    const upcomingWebinars = webinars.filter(w => w.status === "upcoming" || w.status === "live");
    const pastWebinars = webinars.filter(w => w.status === "completed");

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">Resource Center</h1>
                    <p className="text-xl text-blue-100 mb-8">
                        Templates, guides, tutorials, and tools to help your church thrive
                    </p>
                    
                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search resources, guides, templates..."
                            className="pl-12 py-6 text-lg bg-white text-slate-900 border-0 shadow-xl"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Admin Actions */}
                {isAdmin && (
                    <div className="flex gap-3 mb-8">
                        <Button onClick={() => { setSelectedResource(null); setShowResourceModal(true); }} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" /> Upload Resource
                        </Button>
                        <Button onClick={() => { setSelectedWebinar(null); setShowWebinarModal(true); }} variant="outline">
                            <Plus className="w-4 h-4 mr-2" /> Create Webinar
                        </Button>
                    </div>
                )}

                <Tabs defaultValue="resources" className="space-y-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                        <TabsTrigger value="webinars">Webinars</TabsTrigger>
                    </TabsList>

                    {/* Resources Tab */}
                    <TabsContent value="resources" className="space-y-8">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-600">Filter:</span>
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="File Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="doc">Word Doc</SelectItem>
                                    <SelectItem value="xlsx">Excel</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="zip">ZIP</SelectItem>
                                </SelectContent>
                            </Select>
                            {(searchQuery || categoryFilter !== "all" || fileTypeFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setFileTypeFilter("all"); }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                            <span className="text-sm text-slate-500 ml-auto">
                                {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Featured Resources */}
                        {filteredResources.some(r => r.is_featured) && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" /> Featured Resources
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredResources.filter(r => r.is_featured).map(resource => (
                                        <ResourceCard
                                            key={resource.id}
                                            resource={resource}
                                            isAdmin={isAdmin}
                                            onDownload={() => handleDownload(resource)}
                                            onEdit={() => { setSelectedResource(resource); setShowResourceModal(true); }}
                                            onDelete={() => handleDeleteResource(resource.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resources by Category */}
                        {Object.entries(groupedResources).map(([category, items]) => (
                            <div key={category}>
                                <h2 className="text-xl font-bold text-slate-900 mb-4">
                                    {categoryLabels[category] || category}
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {items.filter(r => !r.is_featured).map(resource => (
                                        <ResourceCard
                                            key={resource.id}
                                            resource={resource}
                                            isAdmin={isAdmin}
                                            onDownload={() => handleDownload(resource)}
                                            onEdit={() => { setSelectedResource(resource); setShowResourceModal(true); }}
                                            onDelete={() => handleDeleteResource(resource.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredResources.length === 0 && (
                            <div className="text-center py-16">
                                <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No resources found</h3>
                                <p className="text-slate-600">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Webinars Tab */}
                    <TabsContent value="webinars" className="space-y-8">
                        {/* Upcoming Webinars */}
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Webinars
                            </h2>
                            {upcomingWebinars.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingWebinars.map(webinar => (
                                        <WebinarCard
                                            key={webinar.id}
                                            webinar={webinar}
                                            isAdmin={isAdmin}
                                            onRegister={() => { setSelectedWebinar(webinar); setShowRegistrationModal(true); }}
                                            onEdit={() => { setSelectedWebinar(webinar); setShowWebinarModal(true); }}
                                            onDelete={() => handleDeleteWebinar(webinar.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Card className="border-0 shadow-lg">
                                    <CardContent className="py-12 text-center">
                                        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-600">No upcoming webinars scheduled</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Past Webinars */}
                        {pastWebinars.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-4">Past Webinars</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pastWebinars.map(webinar => (
                                        <WebinarCard
                                            key={webinar.id}
                                            webinar={webinar}
                                            isAdmin={isAdmin}
                                            isPast
                                            onEdit={() => { setSelectedWebinar(webinar); setShowWebinarModal(true); }}
                                            onDelete={() => handleDeleteWebinar(webinar.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* CTA */}
                <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-4">Need Custom Resources?</h2>
                    <p className="text-blue-100 mb-6">Our team can help create custom templates and training for your church</p>
                    <Link to={createPageUrl("Support")}>
                        <Button className="bg-white text-blue-600 hover:bg-blue-50">
                            Contact Us
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Modals */}
            {showResourceModal && (
                <ResourceUploadModal
                    isOpen={showResourceModal}
                    onClose={() => setShowResourceModal(false)}
                    onSuccess={loadData}
                    resource={selectedResource}
                />
            )}
            {showWebinarModal && (
                <WebinarModal
                    isOpen={showWebinarModal}
                    onClose={() => setShowWebinarModal(false)}
                    onSuccess={loadData}
                    webinar={selectedWebinar}
                />
            )}
            {showRegistrationModal && selectedWebinar && (
                <WebinarRegistrationModal
                    isOpen={showRegistrationModal}
                    onClose={() => setShowRegistrationModal(false)}
                    webinar={selectedWebinar}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
}

function ResourceCard({ resource, isAdmin, onDownload, onEdit, onDelete }) {
    const Icon = fileTypeIcons[resource.file_type] || FileText;
    
    return (
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <Icon className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 truncate">{resource.title}</h3>
                                {resource.is_featured && <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{resource.description}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className={fileTypeColors[resource.file_type] || "bg-slate-100 text-slate-800"}>
                                    {resource.file_type?.toUpperCase()}
                                </Badge>
                                {resource.duration && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {resource.duration}
                                    </span>
                                )}
                                {resource.download_count > 0 && (
                                    <span className="text-xs text-slate-500">
                                        {resource.download_count} downloads
                                    </span>
                                )}
                            </div>
                            {resource.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {resource.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                        <Button size="sm" variant="outline" onClick={onDownload}>
                            {resource.file_type === "link" ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        </Button>
                        {isAdmin && (
                            <>
                                <Button size="sm" variant="ghost" onClick={onEdit}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function WebinarCard({ webinar, isAdmin, isPast, onRegister, onEdit, onDelete }) {
    const isFull = webinar.max_attendees && webinar.registration_count >= webinar.max_attendees;
    
    return (
        <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${isPast ? "opacity-75" : ""}`}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <Badge className={
                        webinar.status === "live" ? "bg-red-500 text-white" :
                        webinar.status === "upcoming" ? "bg-blue-100 text-blue-800" :
                        "bg-slate-100 text-slate-800"
                    }>
                        {webinar.status === "live" ? "🔴 Live Now" : 
                         webinar.status === "upcoming" ? "Upcoming" : "Completed"}
                    </Badge>
                    {webinar.is_featured && <Star className="w-4 h-4 text-yellow-500" />}
                </div>
                
                <h3 className="font-semibold text-slate-900 mb-2">{webinar.title}</h3>
                
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(webinar.scheduled_date), "MMMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {webinar.scheduled_time} • {webinar.duration_minutes} min
                    </div>
                    {webinar.presenter && (
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {webinar.presenter}
                            {webinar.presenter_title && <span className="text-slate-400">• {webinar.presenter_title}</span>}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {webinar.registration_count || 0} registered
                        {webinar.max_attendees && ` / ${webinar.max_attendees}`}
                    </div>
                </div>

                {webinar.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {webinar.tags.map(tag => (
                            <span key={tag} className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    {!isPast && (
                        <Button 
                            size="sm" 
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={onRegister}
                            disabled={isFull}
                        >
                            {isFull ? "Full" : "Register Free"}
                        </Button>
                    )}
                    {isPast && webinar.recording_url && (
                        <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(webinar.recording_url, "_blank")}
                        >
                            <Video className="w-4 h-4 mr-2" /> Watch Recording
                        </Button>
                    )}
                    {isAdmin && (
                        <>
                            <Button size="sm" variant="ghost" onClick={onEdit}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}