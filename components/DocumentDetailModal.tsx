"use client";

import React, { useState, useEffect } from "react";
import { DocumentDetail, DocumentItem, api } from "@/lib/api";
import { 
  X, FileText, Download, CheckCircle2, Hash, Layers, Shield
} from "lucide-react";

interface DocumentDetailModalProps {
  workspaceId: string;
  document: DocumentItem;
  onClose: () => void;
  targetPage?: number | null;
}

export function DocumentDetailModal({
  workspaceId,
  document,
  onClose,
  targetPage,
}: DocumentDetailModalProps) {
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "chunks" | "metadata">("preview");

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await api.getDocumentDetail(workspaceId, document.id);
        setDetail(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [workspaceId, document.id]);

  const downloadUrl = api.getDocumentDownloadUrl(workspaceId, document.id);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-lg w-full max-w-5xl h-[88vh] flex flex-col shadow-lg overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-8 w-8 rounded border border-border bg-muted flex items-center justify-center shrink-0 text-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-foreground truncate">{document.original_filename}</h2>
              <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>v{document.version}</span>
                <span>•</span>
                <span>{(document.file_size_bytes / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                  {document.status}
                </span>
                {targetPage && (
                  <span className="bg-muted text-foreground px-1.5 py-0.2 rounded text-[10px] border border-border">
                    Viewing Page {targetPage}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
              title="Download Original File"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
              title="Close Modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 border-b border-border flex items-center space-x-5 shrink-0 bg-muted/20 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`py-2.5 border-b-2 transition-colors duration-150 ${
              activeTab === "preview"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Document Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chunks")}
            className={`py-2.5 border-b-2 transition-colors duration-150 ${
              activeTab === "chunks"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Extracted Chunks ({detail?.chunks.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("metadata")}
            className={`py-2.5 border-b-2 transition-colors duration-150 ${
              activeTab === "metadata"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Provenance & Metadata
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-muted-foreground">
              Loading document data...
            </div>
          ) : activeTab === "preview" ? (
            <div className="h-full rounded border border-border overflow-hidden bg-muted/10 flex flex-col">
              {document.original_filename.endsWith(".pdf") ? (
                <iframe
                  src={`${downloadUrl}#page=${targetPage || 1}`}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="p-5 overflow-y-auto font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {detail?.chunks.map((c) => c.content).join("\n\n---\n\n") || "No text content available."}
                </div>
              )}
            </div>
          ) : activeTab === "chunks" ? (
            <div className="space-y-3">
              {detail?.chunks.map((ch) => {
                const isTarget = targetPage && ch.page_number === targetPage;
                return (
                  <div
                    key={ch.id}
                    className={`p-3.5 rounded border transition-colors duration-150 ${
                      isTarget
                        ? "border-foreground bg-muted/40"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2 pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground font-mono">Chunk #{ch.chunk_index}</span>
                        {ch.page_number && (
                          <span className="px-1.5 py-0.2 rounded font-mono bg-muted font-medium text-foreground border border-border">
                            Page {ch.page_number}
                          </span>
                        )}
                        {ch.section_heading && (
                          <span className="text-foreground font-medium truncate max-w-[200px]">
                            {ch.section_heading}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span>{ch.token_count} tokens</span>
                        {ch.bounding_boxes && ch.bounding_boxes.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-muted border border-border text-foreground font-semibold">
                            {ch.bounding_boxes.length} BBox Regions
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
                      {ch.content}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 max-w-xl text-xs">
              <div className="p-4 rounded border border-border bg-card space-y-2.5">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Original Filename</span>
                  <span className="font-semibold text-foreground">{document.original_filename}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">MIME Type</span>
                  <span className="font-mono text-foreground">{document.mime_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-mono text-foreground">{document.file_size_bytes} bytes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Document Version</span>
                  <span className="text-foreground">v{document.version}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Indexing Status</span>
                  <span className="uppercase text-emerald-600 dark:text-emerald-400 font-semibold font-mono">{document.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Ingested Timestamp</span>
                  <span className="text-foreground font-mono text-[11px]">{new Date(document.created_at).toUTCString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Workspace ID</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{document.workspace_id}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
