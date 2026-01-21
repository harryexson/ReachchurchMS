import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Music } from "lucide-react";
import { toast } from "sonner";

export default function AddServiceItemModal({ servicePlanId, editingItem, nextOrderIndex, onClose, onSuccess }) {
  const { data: songs = [] } = useQuery({
    queryKey: ['songLibrary'],
    queryFn: () => base44.entities.SongLibrary.list(),
  });
  const [formData, setFormData] = useState(editingItem || {
    service_plan_id: servicePlanId,
    item_type: "song",
    title: "",
    duration_minutes: 5,
    order_index: nextOrderIndex,
    notes: "",
    song_key: "",
    assigned_to: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSongSelect = (songId) => {
    const song = songs.find(s => s.id === songId);
    if (song) {
      setFormData({
        ...formData,
        title: song.title,
        song_key: song.default_key,
        song_tempo: song.tempo,
        duration_minutes: song.default_duration_minutes,
        resources_url: song.lyrics_url || song.sheet_music_url || ""
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        await base44.entities.ServiceItem.update(editingItem.id, formData);
        toast.success("Item updated");
      } else {
        await base44.entities.ServiceItem.create(formData);
        toast.success("Item added");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save item");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingItem ? "Edit Service Item" : "Add Service Item"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Item Type *</Label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="song">Song</option>
                <option value="prayer">Prayer</option>
                <option value="sermon">Sermon</option>
                <option value="offering">Offering</option>
                <option value="announcement">Announcement</option>
                <option value="scripture_reading">Scripture Reading</option>
                <option value="communion">Communion</option>
                <option value="baptism">Baptism</option>
                <option value="special_music">Special Music</option>
                <option value="video">Video</option>
                <option value="testimony">Testimony</option>
                <option value="children_dismissal">Children Dismissal</option>
                <option value="greeting">Greeting</option>
                <option value="benediction">Benediction</option>
              </select>
            </div>

            <div>
              <Label>Duration (minutes) *</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                min="1"
                max="120"
                required
              />
            </div>
          </div>

          {formData.item_type === 'song' && (
            <div>
              <Label>Quick Select from Song Library</Label>
              <select
                onChange={(e) => handleSongSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select a song...</option>
                {songs.map(song => (
                  <option key={song.id} value={song.id}>{song.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Amazing Grace, Opening Prayer, etc."
              required
            />
          </div>

          {formData.item_type === 'song' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Song Key</Label>
                <Input
                  value={formData.song_key}
                  onChange={(e) => setFormData({ ...formData, song_key: e.target.value })}
                  placeholder="e.g., G, D, Am"
                />
              </div>
              <div>
                <Label>Tempo</Label>
                <select
                  value={formData.song_tempo}
                  onChange={(e) => setFormData({ ...formData, song_tempo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select tempo</option>
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                  <option value="ballad">Ballad</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <Label>Assigned To</Label>
            <Input
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="Person responsible"
            />
          </div>

          <div>
            <Label>Notes / Instructions (Visible to assigned team members)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special instructions, cues, arrangements, or notes for team members"
              rows={4}
              className="bg-amber-50 border-amber-200"
            />
            <p className="text-xs text-slate-500 mt-1">
              These notes will be visible to all team members assigned to this service
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Saving..." : (editingItem ? "Update Item" : "Add Item")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}