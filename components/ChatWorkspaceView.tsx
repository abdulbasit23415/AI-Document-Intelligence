"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChatConversation, ChatMessage, CitationItem, DocumentItem, Workspace, api 
} from "@/lib/api";
import { 
  Plus, MessageSquare, Send, FileText, ExternalLink, 
  Sparkles, CheckCircle2, ChevronRight, Filter, Info, Shield, Clock,
  X, BookOpen, Layers
} from "lucide-react";

interface ChatWorkspaceProps {
  workspace: Workspace | null;
  documents: DocumentItem[];
  onOpenDocumentModal: (docId: string, pageNumber?: number | null) => void;
}

export function ChatWorkspaceView({
  workspace,
  documents,
  onOpenDocumentModal,
}: ChatWorkspaceProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Document filtering scope
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);

  // Active highlighted citation in right panel
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);

  // Mobile drawer states
  const [showMobileSessions, setShowMobileSessions] = useState(false);
  const [showMobileCitation, setShowMobileCitation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspace) return;
    loadConversations();
  }, [workspace]);

  const loadConversations = async () => {
    if (!workspace) return;
    try {
      const convs = await api.listConversations(workspace.id);
      setConversations(convs);
      if (convs.length > 0 && !activeConv) {
        selectConversation(convs[0]);
      } else if (convs.length === 0) {
        handleNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = async (conv: ChatConversation) => {
    if (!workspace) return;
    setActiveConv(conv);
    setSelectedDocIds(conv.selected_document_ids || []);
    setShowMobileSessions(false);
    try {
      const msgs = await api.getConversationMessages(workspace.id, conv.id);
      setMessages(msgs);
      // Auto-select latest citation if available
      const lastAsst = [...msgs].reverse().find((m) => m.role === "assistant" && m.citations?.length > 0);
      if (lastAsst && lastAsst.citations[0]) {
        setActiveCitation(lastAsst.citations[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewConversation = async () => {
    if (!workspace) return;
    try {
      const newConv = await api.createConversation(workspace.id, "Research Session", selectedDocIds);
      setConversations([newConv, ...conversations]);
      setActiveConv(newConv);
      setMessages([]);
      setActiveCitation(null);
      setShowMobileSessions(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || !workspace || !activeConv || isStreaming) return;

    const userText = inputPrompt.trim();
    setInputPrompt("");

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      conversation_id: activeConv.id,
      role: "user",
      content: userText,
      citations: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsStreaming(true);
    setStreamingContent("");

    let accumulatedContent = "";
    try {
      await api.sendMessageStream(
        workspace.id,
        activeConv.id,
        userText,
        selectedDocIds.length > 0 ? selectedDocIds : undefined,
        (token) => {
          accumulatedContent += token;
          setStreamingContent((prev) => prev + token);
        },
        (citations, timings) => {
          setIsStreaming(false);
          const asstMsg: ChatMessage = {
            id: "asst-" + Date.now(),
            conversation_id: activeConv.id,
            role: "assistant",
            content: accumulatedContent,
            citations,
            retrieval_timings: timings,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, asstMsg]);
          setStreamingContent("");
          if (citations && citations.length > 0) {
            setActiveCitation(citations[0]);
          }
        },
        (err) => {
          setIsStreaming(false);
          setStreamingContent("");
          console.error("Stream failed:", err);
          setMessages((prev) => [
            ...prev,
            {
              id: "err-" + Date.now(),
              conversation_id: activeConv.id,
              role: "assistant",
              content: `Error: ${err}`,
              citations: [],
              created_at: new Date().toISOString(),
            },
          ]);
        }
      );
    } catch (err: any) {
      setIsStreaming(false);
      setStreamingContent("");
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Render markdown-like text with interactive [1], [2] citation tags
  const renderFormattedMessage = (content: string, citations: CitationItem[] = []) => {
    const parts = content.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citeNum = parseInt(match[1]);
        const matchedItem = citations.find((c) => c.citation_id === citeNum);
        const isSelected = activeCitation && activeCitation.citation_id === citeNum;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (matchedItem) {
                setActiveCitation(matchedItem);
                setShowMobileCitation(true);
              }
            }}
            className={`inline-flex items-center mx-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold border transition-colors duration-150 cursor-pointer ${
              isSelected
                ? "bg-foreground text-background border-foreground"
                : "bg-muted text-foreground border-border hover:bg-muted-foreground/20"
            }`}
            title={matchedItem ? `Source: ${matchedItem.document_name} (Page ${matchedItem.page_number || 'N/A'})` : "Citation"}
          >
            [{citeNum}]
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Shared Left Sessions Content
  const sessionsPanelContent = (
    <div className="flex flex-col h-full">
      <div className="p-3.5 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Conversations
        </span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleNewConversation}
            className="p-1.5 rounded border border-border bg-card hover:bg-muted text-foreground transition-colors duration-150 cursor-pointer"
            title="New Conversation"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowMobileSessions(false)}
            className="lg:hidden p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Close sessions"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scope selector */}
      <div className="p-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => setShowDocSelector(!showDocSelector)}
          className="w-full flex items-center justify-between p-2 rounded border border-border bg-card text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <div className="flex items-center space-x-2 truncate">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {selectedDocIds.length === 0
                ? "All Workspace Docs"
                : `${selectedDocIds.length} Selected`}
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>

        {showDocSelector && (
          <div className="mt-2 p-1.5 rounded border border-border bg-popover text-xs space-y-0.5 max-h-40 overflow-y-auto shadow-md">
            <button
              type="button"
              onClick={() => setSelectedDocIds([])}
              className="w-full p-1.5 rounded hover:bg-muted cursor-pointer flex items-center justify-between text-left transition-colors duration-150"
            >
              <span>All Documents</span>
              {selectedDocIds.length === 0 && <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />}
            </button>
            {documents.map((d) => {
              const isSelected = selectedDocIds.includes(d.id);
              return (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedDocIds(selectedDocIds.filter((id) => id !== d.id));
                    } else {
                      setSelectedDocIds([...selectedDocIds, d.id]);
                    }
                  }}
                  className="w-full p-1.5 rounded hover:bg-muted cursor-pointer flex items-center justify-between truncate text-left transition-colors duration-150"
                >
                  <span className="truncate">{d.original_filename}</span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((c) => {
          const isActive = activeConv?.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectConversation(c)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs text-left transition-colors duration-150 truncate cursor-pointer ${
                isActive
                  ? "bg-muted text-foreground border border-border font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{c.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Shared Right Citation Content
  const citationPanelContent = (
    <div className="flex flex-col h-full">
      <div className="p-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Source Citation
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          {activeCitation && (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-border bg-card text-foreground">
              [{activeCitation.citation_id}]
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowMobileCitation(false)}
            className="lg:hidden p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Close citation proof"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeCitation ? (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Document Identity Card */}
            <div className="p-3.5 rounded border border-border bg-card space-y-1.5">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Origin Document
              </div>
              <div className="text-xs font-semibold text-foreground break-all">
                {activeCitation.document_name}
              </div>
              <div className="flex items-center flex-wrap gap-2 text-[10px] text-muted-foreground pt-1">
                {activeCitation.page_number ? (
                  <span className="px-1.5 py-0.5 rounded font-mono bg-muted font-medium text-foreground">
                    Page {activeCitation.page_number}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded font-mono bg-muted font-medium text-foreground">
                    Document Chunk
                  </span>
                )}
                {activeCitation.section && (
                  <span className="truncate max-w-[140px] text-foreground font-mono">
                    {activeCitation.section}
                  </span>
                )}
              </div>
            </div>

            {/* Verifiable Excerpt */}
            <div className="p-3.5 rounded border border-border bg-card space-y-2">
              <div className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Grounding Proof</span>
              </div>
              <blockquote className="text-xs text-foreground/90 leading-relaxed font-sans border-l-2 border-foreground/30 pl-3 py-0.5">
                "{activeCitation.text_excerpt}"
              </blockquote>
            </div>

            {/* Bounding Box Information */}
            {activeCitation.bounding_boxes && activeCitation.bounding_boxes.length > 0 && (
              <div className="p-3 rounded border border-border bg-muted/40 text-[10px] font-mono text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">Spatial Coordinates:</div>
                <div className="text-[9px] break-all">
                  L: {activeCitation.bounding_boxes[0].left} | T: {activeCitation.bounding_boxes[0].top} | R: {activeCitation.bounding_boxes[0].right} | B: {activeCitation.bounding_boxes[0].bottom}
                </div>
              </div>
            )}

            {/* Action Button: Jump to Document Viewer */}
            <button
              type="button"
              onClick={() => {
                onOpenDocumentModal(activeCitation.document_id, activeCitation.page_number);
                setShowMobileCitation(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity duration-150 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Document at Page</span>
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Info className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-semibold text-foreground">No Citation Selected</p>
            <p className="text-[11px] mt-1 leading-relaxed text-muted-foreground">
              Click any citation tag like [1] or [2] inside an assistant response to inspect its exact source excerpt and location.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-5.5rem)] md:h-[calc(100vh-7rem)] flex rounded-lg border border-border bg-card overflow-hidden shadow-xs relative">
      {/* PANEL 1: Desktop Left Navigation / Session History */}
      <div className="hidden lg:flex w-60 xl:w-64 border-r border-border bg-muted/20 flex-col shrink-0">
        {sessionsPanelContent}
      </div>

      {/* Mobile / Tablet Drawer for Sessions */}
      {showMobileSessions && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-150">
          <div
            onClick={() => setShowMobileSessions(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sessionsPanelContent}
          </div>
        </div>
      )}

      {/* PANEL 2: Center Conversation Stream */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Chat Header */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-border flex items-center justify-between bg-card gap-2">
          <div className="min-w-0 flex items-center gap-2">
            {/* Mobile Sessions Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileSessions(true)}
              className="lg:hidden p-1.5 rounded border border-border bg-muted/40 hover:bg-muted text-foreground text-xs flex items-center gap-1 shrink-0"
              title="View Sessions"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium hidden xs:inline">Sessions</span>
            </button>

            <div className="truncate">
              <h2 className="text-xs font-semibold text-foreground truncate">
                {activeConv?.title || "Research Session"}
              </h2>
              <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                <span>Grounded RRF</span>
                <span>•</span>
                <span className="hidden sm:inline">Evidence Mandatory</span>
                <span className="sm:hidden">Verifiable</span>
              </div>
            </div>
          </div>

          {/* Mobile Citation Proof Toggle */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowMobileCitation(true)}
              className={`lg:hidden px-2 py-1.5 rounded border text-xs flex items-center gap-1.5 transition-colors ${
                activeCitation
                  ? "border-foreground bg-foreground text-background font-medium"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[11px]">
                {activeCitation ? `Proof [${activeCitation.citation_id}]` : "Proof"}
              </span>
            </button>
          </div>
        </div>

        {/* Message stream body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5">
          {messages.length === 0 && !streamingContent && (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 text-muted-foreground max-w-md mx-auto">
              <div className="h-10 w-10 rounded border border-border bg-muted/40 text-muted-foreground flex items-center justify-center mb-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Grounded Document Q&A</p>
              <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
                Query contract terms, invoices, security policies, and technical reports.
                Every generated statement provides clickable source citations with exact page numbers.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center text-[11px]">
                <button
                  type="button"
                  onClick={() => setInputPrompt("What are the payment terms under the agreement?")}
                  className="px-2.5 py-1.5 rounded border border-border bg-card hover:bg-muted transition-colors duration-150 text-foreground cursor-pointer text-left"
                >
                  "What are the payment terms?"
                </button>
                <button
                  type="button"
                  onClick={() => setInputPrompt("What is the grand total and invoice number?")}
                  className="px-2.5 py-1.5 rounded border border-border bg-card hover:bg-muted transition-colors duration-150 text-foreground cursor-pointer text-left"
                >
                  "What is the invoice total?"
                </button>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="text-[10px] font-mono text-muted-foreground mb-1 px-1">
                {m.role === "user" ? "You" : "DocuMind Assistant"} •{" "}
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-lg p-3 sm:p-3.5 text-xs leading-relaxed shadow-xs ${
                  m.role === "user"
                    ? "bg-foreground text-background font-medium"
                    : "bg-card border border-border text-foreground/90 font-sans"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <div>{renderFormattedMessage(m.content, m.citations || [])}</div>
                )}
              </div>

              {/* Citations list footer under assistant response */}
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%] sm:max-w-[85%] px-1">
                  <span className="text-[10px] font-mono text-muted-foreground self-center mr-1">
                    Citations:
                  </span>
                  {m.citations.map((c) => {
                    const isSelected = activeCitation?.citation_id === c.citation_id;
                    return (
                      <button
                        key={c.citation_id}
                        type="button"
                        onClick={() => {
                          setActiveCitation(c);
                          setShowMobileCitation(true);
                        }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors duration-150 flex items-center space-x-1 cursor-pointer ${
                          isSelected
                            ? "bg-foreground text-background border-foreground font-semibold"
                            : "bg-muted/50 border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>[{c.citation_id}]</span>
                        <span className="max-w-[90px] sm:max-w-[140px] truncate">{c.document_name}</span>
                        {c.page_number && <span className="opacity-70">p.{c.page_number}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Active streaming buffer */}
          {isStreaming && (
            <div className="flex flex-col items-start">
              <div className="text-[10px] font-mono text-muted-foreground mb-1 px-1">
                DocuMind Assistant • Streaming...
              </div>
              <div className="max-w-[92%] sm:max-w-[85%] rounded-lg p-3 sm:p-3.5 text-xs leading-relaxed bg-card border border-border text-foreground/90 shadow-xs">
                {streamingContent ? (
                  <div>
                    {streamingContent}
                    <span className="inline-block w-1.5 h-3.5 bg-foreground ml-1 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-muted-foreground font-mono text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Searching hybrid index & verifying citations...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3.5 border-t border-border bg-card">
          <div className="flex items-center space-x-2 rounded border border-border bg-background px-2.5 sm:px-3 py-1.5 focus-within:border-foreground transition-colors duration-150">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Query documents (e.g. 'What is the liability cap?')..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isStreaming}
              className="p-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity duration-150 cursor-pointer shrink-0"
              title="Send Prompt"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* PANEL 3: Desktop Right Source Preview Panel */}
      <div className="hidden lg:flex w-72 xl:w-80 border-l border-border bg-muted/20 flex-col shrink-0">
        {citationPanelContent}
      </div>

      {/* Mobile / Tablet Drawer for Citation Proof */}
      {showMobileCitation && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-150">
          <div
            onClick={() => setShowMobileCitation(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
          />
          <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-card border-l border-border shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {citationPanelContent}
          </div>
        </div>
      )}
    </div>
  );
}
