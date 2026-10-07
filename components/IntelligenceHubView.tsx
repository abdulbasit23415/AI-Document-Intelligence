"use client";

import React, { useState } from "react";
import { DocumentItem, Workspace, api } from "@/lib/api";
import { 
  FileText, Download, Split, FileCheck, Layers, 
  CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, Sparkles 
} from "lucide-react";

interface IntelligenceHubProps {
  workspace: Workspace | null;
  documents: DocumentItem[];
  onOpenDocument: (docId: string, page?: number | null) => void;
}

export function IntelligenceHubView({
  workspace,
  documents,
  onOpenDocument,
}: IntelligenceHubProps) {
  const [activeTab, setActiveTab] = useState<"contract" | "invoice" | "compare" | "summary">("contract");
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || "");
  const [selectedDocBId, setSelectedDocBId] = useState<string>(documents[1]?.id || documents[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const handleRunIntelligence = async () => {
    if (!workspace || !selectedDocId) return;
    setLoading(true);
    setResultData(null);

    try {
      if (activeTab === "contract") {
        const res = await api.extractContract(workspace.id, selectedDocId);
        setResultData(res);
      } else if (activeTab === "invoice") {
        const res = await api.extractInvoice(workspace.id, selectedDocId);
        setResultData(res);
      } else if (activeTab === "summary") {
        const res = await api.summarizeDocument(workspace.id, selectedDocId);
        setResultData(res);
      } else if (activeTab === "compare") {
        const res = await api.compareDocuments(workspace.id, selectedDocId, selectedDocBId);
        setResultData(res);
      }
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "json" | "csv") => {
    if (!resultData) return;
    if (format === "json") {
      const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `docmind_${activeTab}_export.json`;
      a.click();
    } else {
      // CSV format
      let csvLines = ["Field,Value"];
      for (const [k, v] of Object.entries(resultData)) {
        if (typeof v === "object") {
          csvLines.push(`"${k}","${JSON.stringify(v).replace(/"/g, '""')}"`);
        } else {
          csvLines.push(`"${k}","${String(v).replace(/"/g, '""')}"`);
        }
      }
      const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `docmind_${activeTab}_export.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Document Intelligence Engine
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Automated contract terms extraction, invoice line parsing, and multi-document comparison.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1.5 p-1 rounded border border-border bg-muted/30 text-xs font-medium w-full sm:w-fit overflow-x-auto pb-1 sm:pb-1 scrollbar-none">
        {[
          { id: "contract", label: "Contract Extraction", icon: FileCheck },
          { id: "invoice", label: "Invoice Processing", icon: FileText },
          { id: "compare", label: "Document Comparison", icon: Split },
          { id: "summary", label: "Executive Summary", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setResultData(null);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-colors duration-150 shrink-0 cursor-pointer ${
                isActive
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="p-3.5 sm:p-4 rounded border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              {activeTab === "compare" ? "Document A" : "Target Document"}
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 rounded border border-border bg-muted/30 text-xs text-foreground focus:outline-none"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "compare" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Document B</label>
              <select
                value={selectedDocBId}
                onChange={(e) => setSelectedDocBId(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 rounded border border-border bg-muted/30 text-xs text-foreground focus:outline-none"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_filename}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleRunIntelligence}
          disabled={loading || !selectedDocId}
          className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2 sm:py-1.5 rounded border border-primary bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity duration-150 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{loading ? "Analyzing Document..." : "Execute Intelligence Engine"}</span>
        </button>
      </div>

      {/* Results View */}
      {resultData && (
        <div className="p-5 rounded border border-border bg-card space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <div>
              <h2 className="text-xs font-semibold text-foreground">Validated Extraction Results</h2>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Schema: Pydantic Strict Validation • Grounded Citations Linked
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleExport("json")}
                className="flex items-center space-x-1 px-2.5 py-1 rounded border border-border hover:bg-muted text-[11px] font-medium text-foreground transition-colors duration-150"
              >
                <Download className="h-3 w-3 text-muted-foreground" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="flex items-center space-x-1 px-2.5 py-1 rounded border border-border hover:bg-muted text-[11px] font-medium text-foreground transition-colors duration-150"
              >
                <Download className="h-3 w-3 text-muted-foreground" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* CONTRACT EXTRACTION DISPLAY */}
          {activeTab === "contract" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded bg-muted/20 border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Contracting Parties</div>
                  <div className="font-semibold text-foreground">{resultData.parties?.join(" & ") || "N/A"}</div>
                </div>

                <div className="p-3.5 rounded bg-muted/20 border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Effective Date</div>
                  <div className="font-semibold text-foreground">{resultData.effective_date || "N/A"}</div>
                </div>

                <div className="p-3.5 rounded bg-muted/20 border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Payment Terms</div>
                  <div className="font-semibold text-foreground">{resultData.payment_terms || "N/A"}</div>
                </div>

                <div className="p-3.5 rounded bg-muted/20 border border-border space-y-1">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Governing Law</div>
                  <div className="font-semibold text-foreground">{resultData.governing_law || "N/A"}</div>
                </div>

                <div className="p-3.5 rounded bg-muted/20 border border-border space-y-1 md:col-span-2">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Termination Provisions</div>
                  <div className="text-foreground leading-relaxed">{resultData.termination_provisions || "N/A"}</div>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <div className="p-3 rounded border border-border bg-muted/30 text-muted-foreground text-[11px] flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{resultData.legal_disclaimer}</span>
              </div>
            </div>
          )}

          {/* INVOICE EXTRACTION DISPLAY */}
          {activeTab === "invoice" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Vendor / Supplier</div>
                  <div className="font-semibold text-foreground mt-1">{resultData.supplier_name || "N/A"}</div>
                </div>
                <div className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Invoice Number</div>
                  <div className="font-semibold font-mono text-foreground mt-1">{resultData.invoice_number || "N/A"}</div>
                </div>
                <div className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-muted-foreground text-[10px] font-mono uppercase">Due Date</div>
                  <div className="font-semibold text-foreground mt-1">{resultData.due_date || "N/A"}</div>
                </div>
                <div className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Total Amount Due</div>
                  <div className="font-bold text-lg text-foreground font-mono mt-0.5">
                    ${resultData.total_amount?.toLocaleString() || "0.00"} {resultData.currency}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              {resultData.line_items && (
                <div className="rounded border border-border overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-muted/40 text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-2 px-3.5">Line Description</th>
                        <th className="py-2 px-3.5">Qty</th>
                        <th className="py-2 px-3.5">Unit Price</th>
                        <th className="py-2 px-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {resultData.line_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors duration-150">
                          <td className="py-2 px-3.5 font-medium">{item.description}</td>
                          <td className="py-2 px-3.5 text-muted-foreground font-mono">{item.quantity}</td>
                          <td className="py-2 px-3.5 text-muted-foreground font-mono">${item.unit_price?.toFixed(2)}</td>
                          <td className="py-2 px-3.5 text-right font-mono font-semibold">${item.amount?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENT COMPARISON DISPLAY */}
          {activeTab === "compare" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded bg-muted/20 border border-border">
                <div className="font-medium text-foreground">{resultData.summary_of_comparison}</div>
              </div>

              <div className="rounded border border-border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted/40 text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2 px-3.5">Topic / Clause</th>
                      <th className="py-2 px-3.5">{resultData.document_a_name}</th>
                      <th className="py-2 px-3.5">{resultData.document_b_name}</th>
                      <th className="py-2 px-3.5 text-right">Alignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resultData.topics?.map((topic: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors duration-150">
                        <td className="py-2.5 px-3.5 font-semibold text-foreground">{topic.topic}</td>
                        <td className="py-2.5 px-3.5 text-muted-foreground">{topic.doc_a_position}</td>
                        <td className="py-2.5 px-3.5 text-muted-foreground">{topic.doc_b_position}</td>
                        <td className="py-2.5 px-3.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                              topic.status === "aligned"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {topic.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EXECUTIVE SUMMARY DISPLAY */}
          {activeTab === "summary" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded bg-muted/20 border border-border">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Executive Overview</div>
                <div className="text-foreground mt-1 leading-relaxed">
                  {resultData.executive_overview}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded bg-card border border-border space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Key Findings & Terms</span>
                  </div>
                  <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                    {resultData.key_findings?.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded bg-card border border-border space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Identified Risks & Surviving Obligations</span>
                  </div>
                  <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                    {resultData.identified_risks_or_obligations?.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
