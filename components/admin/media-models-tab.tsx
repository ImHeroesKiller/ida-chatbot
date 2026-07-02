"use client";

import { ImageIcon, Music, Plus, Save, Trash2, Video, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MediaCategory, MediaModel } from "@/lib/admin/types";

const CATEGORIES: { value: MediaCategory; label: string; icon: LucideIcon }[] = [
  { value: "image", label: "Image Models", icon: ImageIcon },
  { value: "video", label: "Video Models", icon: Video },
  { value: "music", label: "Music Models", icon: Music },
];

export function MediaModelsTab() {
  const [category, setCategory] = useState<MediaCategory>("image");
  const [models, setModels] = useState<MediaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for add/edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<MediaModel | null>(null);
  const [form, setForm] = useState({
    name: "",
    provider: "replicate",
    model_id: "",
    api_endpoint: "",
    is_active: true,
    default_settings: "{}",
  });

  const loadModels = async (cat: MediaCategory) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media-models?category=${cat}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setModels(data.models || []);
    } catch {
      toast.error("Failed to load media models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadModels(category);
  }, [category]);

  const openForm = (model?: MediaModel) => {
    if (model) {
      setEditing(model);
      setForm({
        name: model.name,
        provider: model.provider,
        model_id: model.model_id,
        api_endpoint: model.api_endpoint || "",
        is_active: model.is_active,
        default_settings: JSON.stringify(model.default_settings || {}, null, 2),
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        provider: category === "image" ? "replicate" : "replicate",
        model_id: category === "image" ? "black-forest-labs/flux-schnell" : "",
        api_endpoint: "",
        is_active: true,
        default_settings: "{}",
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.model_id.trim()) {
      toast.error("Name and Model ID are required");
      return;
    }

    let parsedSettings: Record<string, unknown> = {};
    try {
      parsedSettings = form.default_settings ? JSON.parse(form.default_settings) : {};
    } catch {
      toast.error("Invalid JSON in default settings");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category,
        name: form.name.trim(),
        provider: form.provider.trim(),
        model_id: form.model_id.trim(),
        api_endpoint: form.api_endpoint.trim() || null,
        is_active: form.is_active,
        default_settings: parsedSettings,
      };

      const url = editing
        ? `/api/admin/media-models/${editing.id}`
        : `/api/admin/media-models`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      toast.success(editing ? "Model updated" : "Model created");
      closeForm();
      await loadModels(category);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (model: MediaModel) => {
    if (!confirm(`Delete model "${model.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/media-models/${model.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Model deleted");
      await loadModels(category);
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleActive = async (model: MediaModel) => {
    try {
      const res = await fetch(`/api/admin/media-models/${model.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !model.is_active }),
      });
      if (!res.ok) throw new Error();
      await loadModels(category);
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const Icon = CATEGORIES.find((c) => c.value === category)!.icon;

  return (
    <div className="space-y-6">
      <Card className="ida-glass admin-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="size-5" />
            Media Models Management
          </CardTitle>
          <CardDescription>
            Add, edit, and manage models for Image / Video / Music generation tools.
            Active models appear in the Right Tools Rail panels.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 border-b pb-2">
            {CATEGORIES.map((cat) => {
              const CIcon = cat.icon;
              return (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                  className="gap-2"
                >
                  <CIcon className="size-4" />
                  {cat.label}
                </Button>
              );
            })}
          </div>

          {/* Add button */}
          <div className="flex justify-end">
            <Button onClick={() => openForm()} className="gap-2">
              <Plus className="size-4" /> Add {category} Model
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading models...</p>
          ) : models.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
              No {category} models yet. Add one above.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Provider / Model</th>
                    <th className="text-left p-3 font-medium">Active</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.id} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-medium">{model.name}</td>
                      <td className="p-3">
                        <div className="font-mono text-xs">{model.provider} / {model.model_id}</div>
                        {model.api_endpoint && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{model.api_endpoint}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleActive(model)}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${model.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {model.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openForm(model)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(model)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Form (modal-like) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">
                {editing ? "Edit" : "Add"} {category} Model
              </CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={closeForm}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Flux Schnell Fast"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    placeholder="replicate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model ID</Label>
                  <Input
                    value={form.model_id}
                    onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                    placeholder="black-forest-labs/flux-schnell"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Endpoint (optional, for custom)</Label>
                <Input
                  value={form.api_endpoint}
                  onChange={(e) => setForm({ ...form, api_endpoint: e.target.value })}
                  placeholder="https://api.example.com/generate"
                />
              </div>

              <div className="space-y-2">
                <Label>Default Settings (JSON)</Label>
                <Textarea
                  value={form.default_settings}
                  onChange={(e) => setForm({ ...form, default_settings: e.target.value })}
                  className="font-mono text-xs h-24"
                  placeholder='{"steps": 4, "guidance_scale": 3.5}'
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  id="active"
                />
                <Label htmlFor="active" className="cursor-pointer">Active (available in panels)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeForm} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="size-4 mr-2" />
                  {saving ? "Saving..." : editing ? "Update Model" : "Create Model"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
