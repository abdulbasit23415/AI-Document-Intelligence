"use client";

import React, { useState, useEffect } from "react";
import { SystemStats, Workspace, api } from "@/lib/api";
import { 
  Settings2, Cpu, HardDrive, ShieldAlert, RefreshCw, 
  CheckCircle2, AlertTriangle, Database, Activity, FileText 
} from "lucide-react";

interface AdminSettingsProps {
  workspace: Workspace | null;
  onRefreshStats: () => void;
}

export function AdminSettingsView({ workspace, onRefreshStats }: AdminSettingsProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState("laptop");
  const [enableCloud, setEnableCloud] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [reindexStatus, setReindexStatus] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemStats();
      setStats(res);
      setSelectedProfile(res.model_profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try {
      await api.updateAdminSettings({
        model_profile: selectedProfile,
        enable_cloud_models: enableCloud,
        github_token: githubToken || undefined,
      });
      alert("Settings saved successfully.");
      loadStats();
      onRefreshStats();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTriggerReindex = async () => {
    if (!workspace) return;
    if (!confirm(`Trigger explicit reindexing of all documents in '${workspace.name}'?`)) return;
    setReindexing(true);
    setReindexStatus("Reindexing documents in progress...");
    try {
      const targetModel =
        selectedProfile === "quality" ? "BAAI/bge-m3" : "BAAI/bge-small-en-v1.5";
      const res: any = await api.triggerReindex(workspace.id, targetModel);
      setReindexStatus(`Reindexed ${res.reindexed} of ${res.total} documents for ${targetModel}.`);
      loadStats();
      onRefreshStats();
    } catch (err: any) {
      setReindexStatus(`Reindex error: ${err.message}`);
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          System Administration & Diagnostics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monitor host hardware allocations, local model profiles, and trigger controlled reindexing.
        </p>
      </div>

      {/* System Hardware Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Documents */}
        <div className="p-4 rounded border border-border bg-card">
          <div className="text-[11px] font-mono text-muted-foreground uppercase">Indexed Corpus</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{stats?.total_documents || 0}</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            {stats?.total_pages || 0} pages • {stats?.total_chunks || 0} chunks
          </div>
        </div>

        {/* Physical Host RAM */}
        <div className="p-4 rounded border border-border bg-card">
          <div className="text-[11px] font-mono text-muted-foreground uppercase">Host Memory (RAM)</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {stats?.system_memory_mb ? `${stats.system_memory_mb.percent_used}%` : "N/A"}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            {stats?.system_memory_mb
              ? `${stats.system_memory_mb.available_mb} MB free of ${stats.system_memory_mb.total_mb} MB`
              : "Checking memory..."}
          </div>
        </div>

        {/* Local Storage */}
        <div className="p-4 rounded border border-border bg-card">
          <div className="text-[11px] font-mono text-muted-foreground uppercase">Storage at Rest</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {stats?.total_storage_bytes
              ? `${(stats.total_storage_bytes / 1024).toFixed(1)} KB`
              : "0 KB"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Private filesystem backend</div>
        </div>

        {/* Tesseract OCR Health */}
        <div className="p-4 rounded border border-border bg-card">
          <div className="text-[11px] font-mono text-muted-foreground uppercase">Local OCR Engine</div>
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tesseract v5 Active</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Native C++ local binary</div>
        </div>
      </div>

      {/* Model Profile Configuration */}
      <div className="p-5 rounded border border-border bg-card space-y-5">
        <div>
          <h2 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span>Model Profiles & Local Embedding Selection</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure local inference parameters. Vector indexes remain strictly separated by dimension.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Laptop Profile */}
          <div
            onClick={() => setSelectedProfile("laptop")}
            className={`p-4 rounded border transition-colors duration-150 cursor-pointer ${
              selectedProfile === "laptop"
                ? "border-foreground bg-muted/30"
                : "border-border hover:bg-muted/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-foreground">Laptop Profile (Default)</span>
              <span className="px-2 py-0.2 rounded font-mono bg-muted text-[10px] font-semibold text-foreground border border-border">
                Low Memory
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Embeddings:</strong> BAAI/bge-small-en-v1.5 (384-dim)<br />
              <strong>LLM:</strong> Qwen2.5-3B-Instruct (4-bit CPU / quantized)<br />
              <strong>Reranker:</strong> Disabled (Conserves Host RAM)<br />
              <strong>Target Hardware:</strong> 8 - 12 GB RAM development laptop
            </p>
          </div>

          {/* Quality Profile */}
          <div
            onClick={() => setSelectedProfile("quality")}
            className={`p-4 rounded border transition-colors duration-150 cursor-pointer ${
              selectedProfile === "quality"
                ? "border-foreground bg-muted/30"
                : "border-border hover:bg-muted/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-foreground">Quality Profile</span>
              <span className="px-2 py-0.2 rounded font-mono bg-muted text-[10px] font-semibold text-foreground border border-border">
                High Precision
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Embeddings:</strong> BAAI/bge-m3 (1024-dim)<br />
              <strong>LLM:</strong> Qwen2.5-7B-Instruct / Qwen3-8B<br />
              <strong>Reranker:</strong> BAAI/bge-reranker-v2-m3<br />
              <strong>Target Hardware:</strong> 16 - 24 GB RAM / Dedicated GPU
            </p>
          </div>
        </div>

        {/* Optional GitHub Models Cloud Demonstration Adapter */}
        <div className="p-3.5 rounded border border-border bg-muted/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                GitHub Models Cloud Adapter (Optional Demonstration Only)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableCloud}
                onChange={(e) => setEnableCloud(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-3 after:w-3 after:transition-transform after:duration-150 peer-checked:bg-foreground"></div>
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>DATA EGRESS NOTICE:</strong> Enabling this cloud demo sends document prompts to GitHub Models API (e.g. gpt-4o-mini). Document content leaves the local machine. Keep disabled for complete private on-premise execution.
          </p>
          {enableCloud && (
            <input
              type="password"
              placeholder="Paste GITHUB_TOKEN (Personal Access Token)..."
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isUpdating}
            className="px-4 py-1.5 rounded border border-primary bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity duration-150"
          >
            {isUpdating ? "Saving..." : "Save System Settings"}
          </button>
        </div>
      </div>

      {/* Controlled Reindex Workflow */}
      <div className="p-5 rounded border border-border bg-card space-y-3.5">
        <div>
          <h2 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span>Controlled Reindexing Workflow</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Switching embedding models requires regenerating vector embeddings across documents.
          </p>
        </div>

        {reindexStatus && (
          <div className="p-2.5 rounded border border-border bg-muted/30 text-foreground font-mono text-xs">
            {reindexStatus}
          </div>
        )}

        <button
          type="button"
          onClick={handleTriggerReindex}
          disabled={reindexing}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors duration-150 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${reindexing ? "animate-spin" : ""}`} />
          <span>{reindexing ? "Reindexing Documents..." : "Trigger Reindex for Active Workspace"}</span>
        </button>
      </div>
    </div>
  );
}
