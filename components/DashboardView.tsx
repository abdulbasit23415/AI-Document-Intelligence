"use client";

import React from "react";
import { DocumentItem, Workspace } from "@/lib/api";
import { 
  Files, HardDrive, CheckCircle2, Clock, 
  UploadCloud, FileText, ArrowUpRight, RefreshCw
} from "lucide-react";

interface DashboardViewProps {
  workspace: Workspace | null;
  documents: DocumentItem[];
  onNavigateToUpload: () => void;
  onSelectDocument: (doc: DocumentItem) => void;
  onRefresh: () => void;
}

export function DashboardView({
  workspace,
  documents,
  onNavigateToUpload,
  onSelectDocument,
  onRefresh,
}: DashboardViewProps) {
  const totalDocs = documents.length;
  const readyDocs = documents.filter((d) => d.status === "ready").length;
  const processingDocs = documents.filter((d) =>
    ["uploaded", "queued", "parsing", "ocr", "chunking", "embedding"].includes(d.status)
  ).length;
  const failedDocs = documents.filter((d) => d.status === "failed").length;

  const totalBytes = documents.reduce((acc, d) => acc + (d.file_size_bytes || 0), 0);
  const formattedStorage =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalBytes / 1024).toFixed(1)} KB`;

  const totalPages = documents.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const recentDocs = [...documents].slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            System Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ingestion status and corpus metrics for <span className="font-medium text-foreground">{workspace?.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onNavigateToUpload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-primary bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Documents</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Indexed Documents</span>
            <Files className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{totalDocs}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {totalPages} verified pages
          </div>
        </div>

        <div className="p-4 rounded border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Searchable & Grounded</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {readyDocs}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {totalDocs > 0 ? `${Math.round((readyDocs / totalDocs) * 100)}% of total corpus` : "No documents yet"}
          </div>
        </div>

        <div className="p-4 rounded border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Queue & Ingestion</span>
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {processingDocs}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {failedDocs > 0 ? `${failedDocs} requires attention` : "Queue operational"}
          </div>
        </div>

        <div className="p-4 rounded border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Storage Volume</span>
            <HardDrive className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{formattedStorage}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Private filesystem volume
          </div>
        </div>
      </div>

      {/* Ingestion Pipeline Stages */}
      <div className="p-4 rounded border border-border bg-card">
        <div className="text-xs font-semibold text-foreground mb-3 flex items-center justify-between">
          <span>Ingestion & OCR Lifecycle</span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            On-Premise Isolated
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
          {[
            { step: "Upload", desc: "SHA-256 Hash", num: "01" },
            { step: "Parse", desc: "Layout & Text", num: "02" },
            { step: "OCR", desc: "Tesseract v5", num: "03" },
            { step: "Chunk", desc: "Table Headers", num: "04" },
            { step: "Vectorize", desc: "BGE Embedding", num: "05" },
            { step: "Ready", desc: "Hybrid RRF Index", num: "06" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded border border-border/60 bg-muted/20 flex flex-col items-center justify-center space-y-0.5"
            >
              <span className="text-[10px] font-mono font-semibold text-muted-foreground">{item.num}</span>
              <span className="font-semibold text-foreground">{item.step}</span>
              <span className="text-[10px] text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="rounded border border-border bg-card overflow-hidden">
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Recent Documents
            </h2>
          </div>
          <button
            onClick={onNavigateToUpload}
            className="text-xs font-medium text-foreground hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {recentDocs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs">No documents uploaded yet in this workspace.</p>
            <button
              onClick={onNavigateToUpload}
              className="mt-2.5 px-3 py-1.5 rounded border border-primary bg-primary text-primary-foreground text-xs font-medium"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-7 w-7 rounded border border-border bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate hover:underline">
                      {doc.original_filename}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                      <span>{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{doc.page_count ? `${doc.page_count} pgs` : "Text"}</span>
                      <span>•</span>
                      <span>v{doc.version}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded border ${
                      doc.status === "ready"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : doc.status === "failed"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
