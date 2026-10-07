"use client";

import React, { useState, useRef } from "react";
import { DocumentItem, Workspace, api } from "@/lib/api";
import { 
  UploadCloud, Search, FileText, Trash2, RotateCcw, 
  Eye, CheckCircle2, Clock, AlertCircle, X, Download
} from "lucide-react";

interface DocumentLibraryProps {
  workspace: Workspace | null;
  documents: DocumentItem[];
  onRefresh: () => void;
  onSelectDocument: (doc: DocumentItem) => void;
}

export function DocumentLibraryView({
  workspace,
  documents,
  onRefresh,
  onSelectDocument,
}: DocumentLibraryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.original_filename.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFiles = async (files: FileList | File[]) => {
    if (!workspace) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await api.uploadDocuments(workspace.id, fileArray);
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!workspace) return;
    if (!confirm(`Permanently remove '${doc.original_filename}' and its derived embeddings?`)) return;
    try {
      await api.deleteDocument(workspace.id, doc.id);
      onRefresh();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleRetry = async (doc: DocumentItem) => {
    if (!workspace) return;
    try {
      await api.retryDocument(workspace.id, doc.id);
      onRefresh();
    } catch (err: any) {
      alert(`Retry error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Document Repository
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage legal agreements, invoices, manuals, and scanned image records.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-primary bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>{isUploading ? "Processing Upload..." : "Upload Documents"}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 border border-dashed rounded transition-colors cursor-pointer text-center ${
          dragActive
            ? "border-foreground bg-muted/60"
            : "border-border bg-card hover:bg-muted/30"
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs font-medium text-foreground">
            Drop files here to ingest, or click to browse
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            PDF, DOCX, TXT, PNG, JPEG up to 50MB per file
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <span className="px-1.5 py-0.5 rounded border border-border bg-muted/40">SHA-256 Scope</span>
            <span className="px-1.5 py-0.5 rounded border border-border bg-muted/40">Tesseract OCR</span>
            <span className="px-1.5 py-0.5 rounded border border-border bg-muted/40">Token Chunks</span>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded border border-border bg-card">
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
          />
        </div>

        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
          {[
            { id: "all", label: "All" },
            { id: "ready", label: "Ready" },
            { id: "queued", label: "Queued" },
            { id: "parsing", label: "Parsing" },
            { id: "ocr", label: "OCR" },
            { id: "failed", label: "Failed" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                statusFilter === st.id
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Records Table */}
      <div className="rounded border border-border bg-card overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs">No documents match the current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 sm:px-4 font-medium">Document Name</th>
                  <th className="py-2.5 px-3 sm:px-4 font-medium hidden sm:table-cell">Size</th>
                  <th className="py-2.5 px-3 sm:px-4 font-medium hidden sm:table-cell">Pages</th>
                  <th className="py-2.5 px-3 sm:px-4 font-medium">Status</th>
                  <th className="py-2.5 px-3 sm:px-4 font-medium hidden md:table-cell">Version</th>
                  <th className="py-2.5 px-3 sm:px-4 font-medium hidden lg:table-cell">Uploaded</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-sans font-medium text-foreground">
                      <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <button
                          onClick={() => onSelectDocument(doc)}
                          className="hover:underline text-left truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs text-xs cursor-pointer"
                        >
                          {doc.original_filename}
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-muted-foreground hidden sm:table-cell">
                      {(doc.file_size_bytes / 1024).toFixed(1)} KB
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-muted-foreground font-sans hidden sm:table-cell">
                      {doc.page_count ? `${doc.page_count} pgs` : "Text"}
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-sans">
                      <span
                        className={`text-[10px] uppercase font-semibold px-1.5 sm:px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          doc.status === "ready"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : doc.status === "failed"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {doc.status === "ready" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                        {doc.status === "failed" && <AlertCircle className="h-3 w-3 shrink-0" />}
                        {["parsing", "ocr", "chunking", "embedding"].includes(doc.status) && (
                          <Clock className="h-3 w-3 shrink-0" />
                        )}
                        <span>{doc.status}</span>
                      </span>
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-muted-foreground hidden md:table-cell">
                      v{doc.version}
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-muted-foreground font-sans hidden lg:table-cell">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onSelectDocument(doc)}
                          className="p-1 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Inspect Document"
                          aria-label="Inspect Document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {doc.status === "failed" && (
                          <button
                            onClick={() => handleRetry(doc)}
                            className="p-1 rounded border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Retry Ingestion"
                            aria-label="Retry Ingestion"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                          title="Delete Document"
                          aria-label="Delete Document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
