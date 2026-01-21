import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AddSongModal({ editingSong, onClose, onSuccess }) {
  const [formData, setFormData] = useState(editingSong || {
    title: "",
    artist: "",
    default_key: "",
    tempo: "",
    default_duration_minutes: 5,
    lyrics_url: "",
    sheet_music_url: "",
    audio_url: "",
    video_url: "",
    ccli_number: "",
    tags: [],
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSong) {
        await base44.entities.SongLibrary.update(editingSong.id, formData);
        toast.success("Song updated");
      } else {
        await base44.entities.SongLibrary.create(formData);
        toast.success("Song added");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save song");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingSong ? "Edit Song" : "Add Song"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Song Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Artist / Composer</Label>
              <Input
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Default Key</Label>
              <Input
                value={formData.default_key}
                onChange={(e) => setFormData({ ...formData, default_key: e.target.value })}
                placeholder="e.g., G, D, Am"
              />
            </div>
            <div>
              <Label>Tempo</Label>
              <select
                value={formData.tempo}
                onChange={(e) => setFormData({ ...formData, tempo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select</option>
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
                <option value="ballad">Ballad</option>
              </select>
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={formData.default_duration_minutes}
                onChange={(e) => setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lyrics URL</Label>
              <Input
                value={formData.lyrics_url}
                onChange={(e) => setFormData({ ...formData, lyrics_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Sheet Music URL</Label>
              <Input
                value={formData.sheet_music_url}
                onChange={(e) => setFormData({ ...formData, sheet_music_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Audio URL</Label>
              <Input
                value={formData.audio_url}
                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Video URL</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="YouTube, Vimeo, etc."
              />
            </div>
          </div>

          <div>
            <Label>CCLI Number</Label>
            <Input
              value={formData.ccli_number}
              onChange={(e) => setFormData({ ...formData, ccli_number: e.target.value })}
              placeholder="CCLI license number"
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag (worship, praise, etc.)"
              />
              <Button type="button" onClick={addTag} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-purple-900">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes / Arrangements</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Special arrangements, key changes, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Saving..." : (editingSong ? "Update Song" : "Add Song")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}