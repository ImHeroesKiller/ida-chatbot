"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Database,
  FileUp,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/client/debounce";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { LOCALES } from "@/lib/config";
import type {
  KbChunkListItem,
  KbDocumentListItem,
} from "@/lib/rag/kb-types";
import { cn } from "@/lib/utils";

interface KbStats {
  totalChunks: number;
  totalDocuments: number;
  byLocale: Record<string, number>;
  bySourceType: Record<string, number>;
}

interface ChunksResponse {
  chunks: KbChunkListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface DocumentsResponse {
  documents: KbDocumentListItem[];
  stats: KbStats;
}

interface ReembedPreview {
  content: string;
  length: number;
  wordCount: number;
  source: string;
  section: string;
  locale: string;
}

const SOURCE_TYPES = ["knowledge", "faq", "guide"] as const;
const PAGE_SIZE = 20;

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function ChunkEditModal({
  chunk,
  open,
  onClose,
  onSaved,
}: {
  chunk: KbChunkListItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<ReembedPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && chunk) {
      setContent(chunk.content);
      setPreview(null);
    }
  }, [open, chunk]);

  const handlePreview = async () => {
    if (!chunk) return;
    setPreviewing(true);

    try {
      const response = await fetch(`/api/admin/kb/chunks/${chunk.id}/reembed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, previewOnly: true }),
      });

      const data = (await response.json()) as {
        preview?: ReembedPreview;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Preview failed.");
      setPreview(data.preview ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!chunk) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/kb/chunks/${chunk.id}/reembed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Save failed.");

      toast.success("Chunk updated and re-embedded.");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!chunk) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="flex max-h-[90vh] flex-col shadow-2xl">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base">Edit chunk</CardTitle>
                <CardDescription>
                  {chunk.pageSlug} / {chunk.section} · {chunk.locale} · chunk{" "}
                  {chunk.metadata.chunkIndex ?? "?"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                <div className="min-h-0 flex-1 space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={content}
                    onChange={(event) => {
                      setContent(event.target.value);
                      setPreview(null);
                    }}
                    className="min-h-[200px] resize-y font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length} characters
                  </p>
                </div>

                {preview && (
                  <div className="shrink-0 rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs font-medium">Embedding preview</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {preview.wordCount} words · {preview.length} chars · will
                      embed as {preview.source}/{preview.section} ({preview.locale})
                    </p>
                    <ScrollArea className="mt-2 h-24">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {preview.content}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handlePreview()}
                    disabled={previewing || !content.trim()}
                  >
                    {previewing ? "Previewing..." : "Preview before re-embed"}
                  </Button>
                  <Button
                    onClick={() => void handleSave()}
                    disabled={saving || !content.trim()}
                  >
                    {saving ? "Saving..." : "Save & re-embed"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function KnowledgeTab() {
  const [stats, setStats] = useState<KbStats | null>(null);
  const [documents, setDocuments] = useState<KbDocumentListItem[]>([]);
  const [chunks, setChunks] = useState<KbChunkListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reindexingAll, setReindexingAll] = useState(false);
  const [reindexingDocId, setReindexingDocId] = useState<string | null>(null);
  const [deletingChunkId, setDeletingChunkId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [localeFilter, setLocaleFilter] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [pageSlugFilter, setPageSlugFilter] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadLocale, setUploadLocale] = useState<(typeof LOCALES)[number]>("id");
  const [uploadPageSlug, setUploadPageSlug] = useState("");
  const [uploadSection, setUploadSection] = useState("main");
  const [uploadSourceType, setUploadSourceType] =
    useState<(typeof SOURCE_TYPES)[number]>("knowledge");

  const [editingChunk, setEditingChunk] = useState<KbChunkListItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    const response = await fetch("/api/admin/kb/documents");
    if (!response.ok) throw new Error("Failed to load documents.");
    const data = (await response.json()) as DocumentsResponse;
    setDocuments(data.documents);
    setStats(data.stats);
  }, []);

  const loadChunks = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });

    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (localeFilter) params.set("locale", localeFilter);
    if (sourceTypeFilter) params.set("sourceType", sourceTypeFilter);
    if (pageSlugFilter.trim()) params.set("pageSlug", pageSlugFilter.trim());

    const response = await fetch(`/api/admin/kb/chunks?${params}`);
    if (!response.ok) throw new Error("Failed to load chunks.");

    const data = (await response.json()) as ChunksResponse;
    setChunks(data.chunks);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [debouncedSearch, localeFilter, page, pageSlugFilter, sourceTypeFilter]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadDocuments(), loadChunks()]);
    } catch {
      toast.error("Failed to load knowledge base.");
    } finally {
      setLoading(false);
    }
  }, [loadChunks, loadDocuments]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("locale", uploadLocale);
      formData.append("sourceType", uploadSourceType);
      if (uploadTitle.trim()) formData.append("title", uploadTitle.trim());
      if (uploadPageSlug.trim()) formData.append("pageSlug", uploadPageSlug.trim());
      if (uploadSection.trim()) formData.append("section", uploadSection.trim());

      const response = await fetch("/api/admin/kb/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        chunksIndexed?: number;
      };

      if (!response.ok) throw new Error(data.error ?? "Upload failed.");

      toast.success(`Uploaded and indexed ${data.chunksIndexed ?? 0} chunks.`);
      setUploadFile(null);
      setUploadTitle("");
      setUploadPageSlug("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleReindexAll = async () => {
    setReindexingAll(true);

    try {
      const response = await fetch("/api/admin/reindex", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Re-index failed.");
      toast.success("Seed knowledge base re-indexed.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Re-index failed.");
    } finally {
      setReindexingAll(false);
    }
  };

  const handleReindexDocument = async (id: string) => {
    if (reindexingDocId) return;

    setReindexingDocId(id);

    try {
      const response = await fetch(`/api/admin/kb/documents/${id}/reindex`, {
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
        chunksIndexed?: number;
      };

      if (!response.ok) throw new Error(data.error ?? "Re-index failed.");
      toast.success(`Re-indexed ${data.chunksIndexed ?? 0} chunks.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Re-index failed.");
    } finally {
      setReindexingDocId(null);
    }
  };

  const handleDeleteDocument = async (id: string, title: string) => {
    if (!window.confirm(`Delete document "${title}" and all its chunks?`)) return;

    try {
      const response = await fetch(`/api/admin/kb/documents/${id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Delete failed.");

      toast.success("Document deleted.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const handleDeleteChunk = async (chunk: KbChunkListItem) => {
    if (!window.confirm("Delete this chunk permanently?")) return;
    if (deletingChunkId) return;

    setDeletingChunkId(chunk.id);

    try {
      const response = await fetch(`/api/admin/kb/chunks/${chunk.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Delete failed.");

      toast.success("Chunk deleted.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingChunkId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Knowledge Base</h2>
          <p className="text-xs text-muted-foreground">
            {stats
              ? `${stats.totalChunks} chunks · ${stats.totalDocuments} uploaded documents`
              : "Manage RAG chunks and documents"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void handleReindexAll()}
          disabled={reindexingAll}
        >
          <RefreshCw className={cn("size-4", reindexingAll && "animate-spin")} />
          {reindexingAll ? "Re-indexing..." : "Re-index All (seed)"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="size-4" />
            Upload document
          </CardTitle>
          <CardDescription>
            PDF, TXT, MD, or DOCX — chunked and embedded via Gemini automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="kb-file">File</Label>
            <Input
              id="kb-file"
              type="file"
              accept=".pdf,.txt,.md,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) =>
                setUploadFile(event.target.files?.[0] ?? null)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-title">Title (optional)</Label>
            <Input
              id="kb-title"
              value={uploadTitle}
              onChange={(event) => setUploadTitle(event.target.value)}
              placeholder="Document title"
            />
          </div>
          <div className="space-y-2">
            <Label>Locale</Label>
            <select
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={uploadLocale}
              onChange={(event) =>
                setUploadLocale(event.target.value as (typeof LOCALES)[number])
              }
            >
              {LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {locale}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-slug">Page slug (optional)</Label>
            <Input
              id="kb-slug"
              value={uploadPageSlug}
              onChange={(event) => setUploadPageSlug(event.target.value)}
              placeholder="auto from filename"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-section">Section</Label>
            <Input
              id="kb-section"
              value={uploadSection}
              onChange={(event) => setUploadSection(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Source type</Label>
            <select
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={uploadSourceType}
              onChange={(event) =>
                setUploadSourceType(
                  event.target.value as (typeof SOURCE_TYPES)[number],
                )
              }
            >
              {SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button
              onClick={() => void handleUpload()}
              disabled={uploading || !uploadFile}
            >
              <FileUp className="size-4" />
              {uploading ? "Processing..." : "Upload & index"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4" />
            Uploaded documents
          </CardTitle>
          <CardDescription>
            Re-chunk and re-embed a specific document, or delete it with all chunks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No uploaded documents yet. Seed chunks from Re-index All still appear
              in the chunk list below.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pageSlug}/{doc.section} · {doc.locale} ·{" "}
                      {doc.chunkCount} chunks · {doc.fileType.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reindexingDocId === doc.id}
                      aria-label={`Re-chunk ${doc.title}`}
                      onClick={() => void handleReindexDocument(doc.id)}
                    >
                      <RefreshCw
                        className={cn(
                          "size-3.5",
                          reindexingDocId === doc.id && "animate-spin",
                        )}
                        aria-hidden
                      />
                      Re-chunk
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Delete document ${doc.title}`}
                      onClick={() => void handleDeleteDocument(doc.id, doc.title)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chunks</CardTitle>
          <CardDescription>
            Search and manage individual RAG chunks across all sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search chunk content..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="flex h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={localeFilter}
              onChange={(event) => {
                setLocaleFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All locales</option>
              {LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {locale}
                </option>
              ))}
            </select>
            <select
              className="flex h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={sourceTypeFilter}
              onChange={(event) => {
                setSourceTypeFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All types</option>
              {SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Input
              className="sm:col-span-2 lg:col-span-4"
              placeholder="Filter by page slug (e.g. faq, tentang-ida)"
              value={pageSlugFilter}
              onChange={(event) => {
                setPageSlugFilter(event.target.value);
                setPage(1);
              }}
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading chunks...</p>
          ) : chunks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chunks found.</p>
          ) : (
            <>
              <ScrollArea className="h-[min(55vh,480px)]">
                <div className="space-y-2 pr-3">
                  {chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{chunk.locale}</Badge>
                        <Badge>{chunk.sourceType}</Badge>
                        <span className="font-mono text-xs">
                          {chunk.pageSlug}/{chunk.section}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          chunk {chunk.metadata.chunkIndex ?? "?"}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDate(chunk.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {chunk.preview}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingChunk(chunk);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingChunkId === chunk.id}
                          aria-label={`Delete chunk ${chunk.id}`}
                          onClick={() => void handleDeleteChunk(chunk)}
                        >
                          <Trash2
                            className={cn(
                              "size-3.5",
                              deletingChunkId === chunk.id && "animate-pulse",
                            )}
                            aria-hidden
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  {total} chunks · page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ChunkEditModal
        chunk={editingChunk}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingChunk(null);
        }}
        onSaved={() => void refresh()}
      />
    </div>
  );
}