import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ResourceList from "@/components/resources/ResourceList";
import ResourceCalendar from "@/components/resources/ResourceCalendar";
import AddResourceModal from "@/components/resources/AddResourceModal";
import BookingModal from "@/components/resources/BookingModal";

export default function ResourceManagement() {
  const [activeTab, setActiveTab] = useState("list");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: resources = [], isLoading, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list('-created_date'),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['resourceBookings'],
    queryFn: () => base44.entities.ResourceBooking.list('-start_datetime'),
  });

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || resource.resource_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: resources.length,
    available: resources.filter(r => r.status === 'available').length,
    inUse: resources.filter(r => r.status === 'in_use').length,
    maintenance: resources.filter(r => r.status === 'maintenance').length,
    upcomingBookings: bookings.filter(b => 
      new Date(b.start_datetime) > new Date() && b.status !== 'cancelled'
    ).length
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Resource Management</h1>
            <p className="text-slate-600">Manage church resources and bookings</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowBookingModal(true)} variant="outline">
              <Calendar className="w-5 h-5 mr-2" />
              New Booking
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Add Resource
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Total Resources</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">In Use</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inUse}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-1">Upcoming Bookings</p>
              <p className="text-2xl font-bold text-purple-600">{stats.upcomingBookings}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="room">Rooms</option>
            <option value="equipment">Equipment</option>
            <option value="vehicle">Vehicles</option>
            <option value="instrument">Instruments</option>
            <option value="technology">Technology</option>
          </select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">
              <Package className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <ResourceList
              resources={filteredResources}
              bookings={bookings}
              onRefetch={refetch}
              onBook={(resource) => {
                setSelectedResource(resource);
                setShowBookingModal(true);
              }}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <ResourceCalendar resources={resources} bookings={bookings} />
          </TabsContent>
        </Tabs>
      </div>

      {showAddModal && (
        <AddResourceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refetch();
          }}
        />
      )}

      {showBookingModal && (
        <BookingModal
          resource={selectedResource}
          existingBookings={bookings}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedResource(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setSelectedResource(null);
          }}
        />
      )}
    </div>
  );
}