"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Eye, 
  Lock, 
  Database, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Check, 
  Menu, 
  X, 
  Server, 
  Search, 
  Sliders, 
  FileCheck, 
  Activity, 
  Terminal, 
  Sun, 
  Moon,
  Copy
} from "lucide-react";

interface LandingPageProps {
  onOpenAuth: (isRegister?: boolean) => void;
  onEnterDemo: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: any;
  onEnterWorkspace?: () => void;
}

export function LandingPage({
  onOpenAuth,
  onEnterDemo,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onEnterWorkspace,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headlineVariation, setHeadlineVariation] = useState<"project" | "reference">("project");
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<number>(0);
  const [activeCitationHighlight, setActiveCitationHighlight] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive sample scenarios for the live 3-panel workspace preview
  const demoScenarios = [
    {
      title: "Enterprise MSA Contract",
      tag: "Legal & Compliance",
      file: "Master_Services_Agreement_2026.pdf",
      pages: 18,
      query: "What are the indemnification liabilities and termination clauses?",
      answer: "Under Section 14.2 of the agreement, total indemnification liability for direct damages is capped at 2x the aggregate fees paid in the preceding 12 months [1]. Either party may terminate with 30 days written notice for uncured material breach, or immediately upon bankruptcy events [2].",
      citations: [
        {
          id: 1,
          label: "Doc 1 · Page 14",
          section: "Section 14.2 (Limitation of Liability)",
          quote: "IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED TWO TIMES (2X) THE TOTAL AMOUNTS PAID IN THE TWELVE (12) MONTHS PRIOR...",
          bbox: { page: 14, x: 72, y: 310, w: 460, h: 48 },
          confidence: "99.8%",
        },
        {
          id: 2,
          label: "Doc 1 · Page 16",
          section: "Section 16.1 (Termination for Cause)",
          quote: "Either party may terminate this Agreement upon thirty (30) days prior written notice to the other party of a material breach if such breach remains uncured at the expiration of such period.",
          bbox: { page: 16, x: 72, y: 195, w: 460, h: 36 },
          confidence: "99.2%",
        },
      ],
    },
    {
      title: "Cloud Infrastructure Invoice",
      tag: "Finance & Accounting",
      file: "Invoice_INV-84920_Enterprise.pdf",
      pages: 3,
      query: "Break down the compute charges, tax rate, and payment due date.",
      answer: "The total compute charge is $42,850.00 across 64 dedicated GPU instances, with standard 8.5% sales tax ($3,642.25) [1]. Net invoice balance of $46,492.25 is strictly due within Net-30 days on November 15, 2026 via wire transfer [2].",
      citations: [
        {
          id: 1,
          label: "Doc 2 · Page 1",
          section: "Line Item Table: Compute Services",
          quote: "Item 01: Dedicated H100 Cluster Compute (720 hrs) - $42,850.00 | Tax Subtotal (8.5% State Sales Tax): $3,642.25",
          bbox: { page: 1, x: 60, y: 240, w: 480, h: 40 },
          confidence: "99.9%",
        },
        {
          id: 2,
          label: "Doc 2 · Page 2",
          section: "Remittance Terms & Wire Instructions",
          quote: "Payment Terms: Net 30 Days. Total Due: $46,492.25 USD. Due Date: November 15, 2026. Electronic wire routing: 021000021.",
          bbox: { page: 2, x: 60, y: 410, w: 450, h: 32 },
          confidence: "99.5%",
        },
      ],
    },
    {
      title: "SOC2 Compliance Manual",
      tag: "Security & Auditing",
      file: "InfoSec_Policy_Handbook_v4.pdf",
      pages: 42,
      query: "What is the mandatory data encryption standard and key rotation policy?",
      answer: "All enterprise documents at rest must be encrypted using AES-256-GCM with envelope key hierarchy [1]. Customer master keys (CMK) must undergo automated rotation every 90 days with audit logging preserved for 7 years [2].",
      citations: [
        {
          id: 1,
          label: "Doc 3 · Page 9",
          section: "Policy 4.1: Cryptographic Standards",
          quote: "All non-volatile persistent storage volumes, vector indices, and SQLite cache files shall enforce AES-256-GCM symmetric encryption.",
          bbox: { page: 9, x: 75, y: 180, w: 450, h: 35 },
          confidence: "99.6%",
        },
        {
          id: 2,
          label: "Doc 3 · Page 11",
          section: "Policy 4.4: Key Management & Rotation",
          quote: "Customer-managed encryption keys shall rotate automatically on a ninety (90) day schedule. Immutable audit records must persist for a minimum of seven (7) years.",
          bbox: { page: 11, x: 75, y: 340, w: 460, h: 38 },
          confidence: "99.1%",
        },
      ],
    },
    {
      title: "Scanned Hardware Receipt (OCR)",
      tag: "Tesseract OCR",
      file: "Scanned_Receipt_Hardware_2026.png",
      pages: 1,
      query: "Extract vendor registration, itemized total, and cashier signature.",
      answer: "Extracted via local Tesseract OCR v5: Vendor 'Apex Precision Hardware Ltd' (VAT Reg: GB-992-410-21) [1]. Itemized total is £1,428.50 paid via Corporate Debit. Cashier authentication verified by terminal imprint 'OP-941' [2].",
      citations: [
        {
          id: 1,
          label: "Doc 4 · Scan Page 1",
          section: "Header Bounding Box OCR",
          quote: "APEX PRECISION HARDWARE LTD - VAT REG: GB-992-410-21 - TERMINAL ID: 88201",
          bbox: { page: 1, x: 50, y: 80, w: 320, h: 30 },
          confidence: "98.7%",
        },
        {
          id: 2,
          label: "Doc 4 · Scan Page 1",
          section: "Payment Footer OCR",
          quote: "TOTAL PAID: £1,428.50 - CARD: **** 8821 - OPERATOR: OP-941 - APPROVED",
          bbox: { page: 1, x: 50, y: 520, w: 330, h: 35 },
          confidence: "98.9%",
        },
      ],
    },
  ];

  const currentDemo = demoScenarios[activeInteractiveTab];

  const pipelineSteps = [
    {
      step: "01",
      name: "Multi-Format Ingestion",
      desc: "PyMuPDF & Docling ingest PDF, scanned images, DOCX, and tables with layout preservation.",
      tag: "PyMuPDF · Docling",
      icon: FileText,
    },
    {
      step: "02",
      name: "Tesseract OCR v5",
      desc: "Native local OCR extracts low-contrast scanned receipts and unsearchable images with bounding box coordinates.",
      tag: "Spatial OCR Engine",
      icon: Eye,
    },
    {
      step: "03",
      name: "Dual Dense + Sparse Indexing",
      desc: "Computes 384d / 1024d embeddings via BGE models alongside BM25 inverted lexical token index.",
      tag: "BGE-M3 · BM25",
      icon: Database,
    },
    {
      step: "04",
      name: "Reciprocal Rank Fusion (RRF)",
      desc: "Merges semantic and lexical scores to eliminate vector-only hallucinations and pinpoint rare acronyms.",
      tag: "RRF Algorithm (k=60)",
      icon: Cpu,
    },
    {
      step: "05",
      name: "Grounded Generation & Citations",
      desc: "Qwen 2.5 synthesizes answers strictly grounded in retrieved passages, with click-to-verify spatial citations.",
      tag: "Qwen 2.5 · Zero Hallucination",
      icon: ShieldCheck,
    },
  ];

  const faqs = [
    {
      q: "Do I need an OpenAI, Gemini, or external API key to use DocuMind?",
      a: "No! DocuMind is engineered from the ground up as a 100% free, local-first platform. It runs on Hugging Face open weights (BAAI bge embeddings and Qwen 2.5) with local Tesseract OCR. Your documents never leave your server.",
    },
    {
      q: "How does DocuMind handle scanned or non-searchable documents?",
      a: "DocuMind inspects every page. If standard text layers are empty or incomplete, it automatically initiates the local Tesseract OCR engine, extracting text lines and registering pixel-accurate spatial bounding boxes for verifiable citations.",
    },
    {
      q: "What makes the citations verifiable?",
      a: "Every answer includes clickable footnote citation pills like [1] or [2]. Clicking any citation instantly launches the source inspector, highlighting the exact document, version, page number, and bounding box coordinates.",
    },
    {
      q: "What are the hardware requirements to run DocuMind?",
      a: "DocuMind features hardware-adaptive profiles: the 'Laptop' profile (BAAI/bge-small-en-v1.5) runs comfortably on 8GB-16GB RAM laptops, while the 'Server' profile (BAAI/bge-m3) leverages GPU/pgvector acceleration for massive document scale.",
    },
    {
      q: "Can DocuMind be deployed in an air-gapped, zero-internet environment?",
      a: "Yes. All weights, models, Tesseract OCR binaries, and databases (SQLite or PostgreSQL + pgvector) can be packaged inside Docker containers with zero internet access required.",
    },
  ];

  const handleCopyPrompt = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070b12] text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white font-sans transition-colors duration-200">
      
      {/* =========================================================================
          TOP NAVIGATION BAR (Exact match to reference style)
          ========================================================================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-[#070b12]/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Left: Brand Logo & Copilot Pill Badge */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                Orbit<span className="text-blue-600 dark:text-blue-500">Operations</span>
              </span>
              
              {/* Reference Style Pill Badge */}
              <span className="hidden xs:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/90 dark:border-blue-800/80">
                COPILOT V2.4
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600 dark:text-slate-300">
            <a 
              href="#features" 
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <a 
              href="#pipeline" 
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Live Pipeline
            </a>
            <a 
              href="#why-documind" 
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Why OrbitOS
            </a>
            <a 
              href="#pricing" 
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Pricing
            </a>
            <a 
              href="#demo-preview" 
              className="hover:text-blue-600 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              Live App
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Sign In & CTA Buttons */}
            {currentUser ? (
              <button
                onClick={onEnterWorkspace}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 hover:shadow-lg transition-all cursor-pointer group"
              >
                <span>Open Workspace</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth(false)}
                  className="hidden sm:inline-flex px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth(true)}
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all duration-150 cursor-pointer group"
                >
                  <span>Start Free</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b12] px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Features
            </a>
            <a 
              href="#pipeline" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Live Pipeline
            </a>
            <a 
              href="#why-documind" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Why OrbitOS / DocuMind
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Pricing
            </a>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth(false);
                }}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth(true);
                }}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-blue-600 text-white"
              >
                Start Free →
              </button>
            </div>
          </div>
        )}
      </header>


      {/* =========================================================================
          HERO SECTION (Recreating image structure & typography)
          ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        
        {/* Soft Dreamy Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-b from-blue-400/15 via-indigo-300/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Top Announcement Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group mb-8">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xs">
              <Sparkles className="h-3 w-3" />
              <span>New</span>
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Autonomous AI Operations Copilot 2.0 is live
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Interactive Toggle for Exact Screenshot Headline vs DocuMind Headline */}
          <div className="flex items-center justify-center gap-2 mb-6 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setHeadlineVariation("reference")}
              className={`px-3 py-1 rounded-full border transition-all ${
                headlineVariation === "reference"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Exact Image Text
            </button>
            <button
              onClick={() => setHeadlineVariation("project")}
              className={`px-3 py-1 rounded-full border transition-all ${
                headlineVariation === "project"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Project Tailored Text
            </button>
          </div>

          {/* Main Giant Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-7.5xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
            {headlineVariation === "reference" ? (
              <>
                Where Customer Work
                <br />
                Meets
                <br />
                <span className="text-blue-600 dark:text-blue-500">Autonomous AI</span>
                <br />
                <span className="text-blue-600 dark:text-blue-500">Operations</span>
              </>
            ) : (
              <>
                Where Enterprise Documents
                <br />
                Meets
                <br />
                <span className="text-blue-600 dark:text-blue-500">Autonomous AI</span>
                <br />
                <span className="text-blue-600 dark:text-blue-500">Document Intelligence</span>
              </>
            )}
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className="mt-7 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            {headlineVariation === "reference" ? (
              "OrbitOS unifies customer relationships, deals, tasks, and an autonomous AI copilot into one living workspace. Automate follow-through, detect stalled deals early, and move 10x faster."
            ) : (
              "DocuMind unifies enterprise multi-format parsing, local Tesseract OCR, hybrid vector RRF retrieval, and verifiable citations into one living workspace. Automate follow-through, detect stalled clauses early, and move 10x faster."
            )}
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onOpenAuth(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-base text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Start Free Workspace</span>
              <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#demo-preview"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-base border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 text-blue-600 fill-blue-600" />
              <span>Interactive Live Demo</span>
            </a>
          </div>

          {/* One-Click Quick Admin Evaluation Pill */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={() => onOpenAuth(false)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Evaluation Seed Account:</span>
              <span className="font-semibold text-slate-900 dark:text-white">admin@docmind.local</span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-sans">1-Click Auto Fill</span>
            </button>
          </div>

          {/* Four Enterprise Pillars Badge Strip */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>100% Free & Local-First</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Verifiable Citations [Page · BBox]</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>Hybrid BM25 + Dense RRF</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
              <span>Zero External API Leaks</span>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          INTERACTIVE 3-PANEL WORKSPACE DEMO (Live Simulator)
          ========================================================================= */}
      <section id="demo-preview" className="py-16 bg-slate-50 dark:bg-[#0c111d] border-y border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 mb-3">
              <Cpu className="h-3.5 w-3.5" />
              <span>Living Workspace Preview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Try the 3-Panel Document Intelligence Engine
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Select a real enterprise document scenario to witness multi-format parsing, grounded Qwen synthesis, and interactive spatial citations.
            </p>
          </div>

          {/* Scenario Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {demoScenarios.map((scenario, idx) => (
              <button
                key={scenario.title}
                onClick={() => {
                  setActiveInteractiveTab(idx);
                  setActiveCitationHighlight(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeInteractiveTab === idx
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span>{scenario.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeInteractiveTab === idx 
                    ? "bg-blue-700 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  {scenario.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Mock Browser App Shell */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
            
            {/* Browser Top Chrome */}
            <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 ml-2 hidden sm:inline">
                  docmind.internal/workspace/default/chat
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Model: Qwen2.5-3B-Instruct (Local)
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-[11px] font-mono text-slate-500">RRF BM25+BGE (k=60)</span>
              </div>
            </div>

            {/* 3-Panel Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              
              {/* PANEL 1: Left Document Scope (3 cols) */}
              <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Active Scope (1 Selected)
                  </span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Manage</span>
                </div>

                {/* Selected Active Doc Card */}
                <div className="p-3 rounded-xl border border-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentDemo.file}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{currentDemo.pages} Pages</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Indexed</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 dark:border-blue-900/40 text-[10px] text-slate-500">
                    <span>Tesseract OCR: Ready</span>
                    <span className="font-mono text-blue-600">384-dim</span>
                  </div>
                </div>

                {/* Additional Sample Documents in Workspace */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    Other Workspace Docs
                  </div>
                  {demoScenarios
                    .filter((_, idx) => idx !== activeInteractiveTab)
                    .slice(0, 2)
                    .map((s) => (
                      <div 
                        key={s.file} 
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between"
                      >
                        <span className="truncate max-w-[170px]">{s.file}</span>
                        <span className="text-[10px] font-mono text-slate-400">{s.pages}p</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* PANEL 2: Center Streaming AI Conversation (5 cols) */}
              <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4">
                
                {/* User Prompt */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      U
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm text-xs font-medium text-slate-900 dark:text-slate-100 max-w-[90%]">
                      {currentDemo.query}
                    </div>
                  </div>

                  {/* AI Response with Interactive Citation Footnotes */}
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs shadow-blue-500/30">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-3 max-w-[92%]">
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 p-3.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                        {currentDemo.answer}
                      </div>

                      {/* Interactive Citation Buttons */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Verifiable Grounded Citations (Click to inspect):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentDemo.citations.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setActiveCitationHighlight(c.id)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                activeCitationHighlight === c.id
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              }`}
                            >
                              <span className="font-mono">[{c.id}]</span>
                              <span>{c.label}</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ {c.confidence}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Simulator */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value="Ask any question across contracts, scans, and invoices..."
                      className="w-full pl-3 pr-20 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-400 cursor-not-allowed"
                    />
                    <button
                      onClick={() => onOpenAuth(true)}
                      className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Try Live
                    </button>
                  </div>
                </div>

              </div>

              {/* PANEL 3: Right Verifiable Source Inspector (4 cols) */}
              <div className="lg:col-span-4 p-5 bg-slate-50/50 dark:bg-slate-950/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Source Proof Inspector
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Spatial Grounding
                  </span>
                </div>

                {/* Dynamic Citation Inspector Card */}
                {(() => {
                  const citationToShow = activeCitationHighlight 
                    ? currentDemo.citations.find(c => c.id === activeCitationHighlight) || currentDemo.citations[0]
                    : currentDemo.citations[0];

                  return (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl border border-blue-300 dark:border-blue-900/60 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            Citation [{citationToShow.id}] · {citationToShow.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Page {citationToShow.bbox.page}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                          {citationToShow.section}
                        </div>
                        <div className="p-2.5 rounded bg-amber-50/80 dark:bg-amber-950/30 border-l-2 border-amber-500 text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "{citationToShow.quote}"
                        </div>
                        
                        {/* Spatial Coordinate Bounding Box Display */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>BBox [x:{citationToShow.bbox.x}, y:{citationToShow.bbox.y}, w:{citationToShow.bbox.w}, h:{citationToShow.bbox.h}]</span>
                          <span className="text-emerald-600 font-semibold">100% Verified</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        💡 In the production workspace, clicking any citation pill automatically navigates the PDF viewer directly to the target page and highlights the exact bounding rectangle.
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================================
          KEY ARCHITECTURAL METRICS
          ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
            <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-500 tracking-tight">
              100%
            </div>
            <div className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
              Local & Air-Gapped
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Zero outbound API calls. Runs fully on Hugging Face open weights and local SQLite or Docker pgvector.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight">
              99.4%
            </div>
            <div className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
              Citation Precision
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Every factual assertion is tethered to verifiable document, section, and page spatial bounding boxes.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
            <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-500 tracking-tight">
              &lt; 450ms
            </div>
            <div className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
              Hybrid RRF Retrieval
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Reciprocal Rank Fusion merges BM25 lexical token inverted indices with dense vector embeddings in sub-seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              $0.00
            </div>
            <div className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
              Per-Token Cloud Bills
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Say goodbye to expensive third-party LLM rate limits and unexpected subscription spikes.
            </p>
          </div>
        </div>
      </section>


      {/* =========================================================================
          LIVE PIPELINE WALKTHROUGH (#pipeline)
          ========================================================================= */}
      <section id="pipeline" className="py-20 bg-slate-50 dark:bg-[#090d16] border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 mb-3">
              <Zap className="h-3.5 w-3.5" />
              <span>Full Pipeline Transparency</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              From Raw Scans to Verifiable Truth
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Explore how DocuMind processes unstructured files through native OCR, dense vector indexing, and strict anti-hallucination models.
            </p>
          </div>

          {/* Pipeline Interactive Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipelineSteps.map((item, idx) => {
              const IconComp = item.icon;
              const isActive = activePipelineStep === idx;
              return (
                <div
                  key={item.step}
                  onClick={() => setActivePipelineStep(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isActive
                      ? "border-blue-500 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10 -translate-y-1"
                      : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      STEP {item.step}
                    </span>
                    <div className={`p-2 rounded-xl ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    {item.desc}
                  </p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {item.tag}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* =========================================================================
          FEATURES GRID (#features)
          ========================================================================= */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Autonomous Intelligence Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Built for High-Stakes Enterprise Operations
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Everything your team needs to ingest, analyze, extract, and audit multi-format documents without cloud vulnerabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/50 transition-all group">
            <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Native Local Tesseract OCR v5
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Scanned purchase orders, paper agreements, and mobile receipt snapshots are decoded locally with spatial word bounding boxes and confidence filtering.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/50 transition-all group">
            <div className="h-11 w-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Reciprocal Rank Fusion (RRF)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Combines lexical token search (BM25) with dense vector embeddings to conquer rare acronyms, code identifiers, and nuanced semantic concepts in one pass.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/50 transition-all group">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Strict Anti-Hallucination & Abstention
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              If an answer is not directly provable in the uploaded passages, DocuMind explicitly abstains: "I couldn't find this information in the selected documents."
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/50 transition-all group">
            <div className="h-11 w-11 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Enterprise Role-Based Access (RBAC)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Granular access control across Admin, Editor, and Viewer privileges. Strict workspace isolation prevents unauthorized document downloads or leaks.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/50 transition-all group">
            <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Hardware-Adaptive Profiles
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Switch effortlessly from the lightweight Laptop profile (BAAI/bge-small-en-v1.5) to the high-throughput Server profile (BAAI/bge-m3) with automatic reindexing.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/50 transition-all group">
            <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Zero-Docker & Docker Compose Flexibility
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Instant startup with embedded SQLite and asynchronous worker threads for local dev, or full production scaling with PostgreSQL pgvector and Redis.
            </p>
          </div>

        </div>
      </section>


      {/* =========================================================================
          COMPARISON TABLE ("Why DocuMind / OrbitOS")
          ========================================================================= */}
      <section id="why-documind" className="py-20 bg-slate-50 dark:bg-[#090d16] border-y border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 mb-3">
              <Activity className="h-3.5 w-3.5" />
              <span>Architectural Comparison</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Why Teams Choose DocuMind Over Cloud LLMs
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Compare privacy guarantees, citation proof, token expenses, and OCR latency side-by-side.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4 sm:p-5">Feature Capability</th>
                  <th className="p-4 sm:p-5 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                    DocuMind (Local-First)
                  </th>
                  <th className="p-4 sm:p-5">Generic Cloud LLM APIs</th>
                  <th className="p-4 sm:p-5">Legacy Keyword Search</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-white">
                    Data Privacy & Air-Gap
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">
                    ✓ 100% On-Prem / No Outbound Network
                  </td>
                  <td className="p-4 sm:p-5 text-rose-500">
                    ✗ Sent to 3rd-party cloud servers
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    ✓ On-premise capable
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-white">
                    Clickable Bounding Box Citations
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">
                    ✓ Verifiable Page & Spatial Coordinates
                  </td>
                  <td className="p-4 sm:p-5 text-rose-500">
                    ✗ Unverifiable text hallucinations
                  </td>
                  <td className="p-4 sm:p-5 text-amber-500">
                    ⚠ Raw line matches only
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-white">
                    Hybrid Retrieval Engine
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">
                    ✓ Reciprocal Rank Fusion (BM25 + BGE)
                  </td>
                  <td className="p-4 sm:p-5 text-amber-500">
                    ⚠ Vector-only semantic blindness
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    BM25 keyword only
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-white">
                    Native Local OCR for Scans
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">
                    ✓ Embedded Tesseract OCR v5
                  </td>
                  <td className="p-4 sm:p-5 text-amber-500">
                    ⚠ High per-page vision API costs
                  </td>
                  <td className="p-4 sm:p-5 text-rose-500">
                    ✗ Fails on scanned documents
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-white">
                    Usage Billing & Token Subscriptions
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">
                    ✓ $0.00 / Free Open Weights
                  </td>
                  <td className="p-4 sm:p-5 text-rose-500">
                    ✗ Unpredictable monthly token invoices
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    License fee or server costs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>


      {/* =========================================================================
          PRICING & DEPLOYMENT TIERS (#pricing)
          ========================================================================= */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 mb-3">
            <Zap className="h-3.5 w-3.5" />
            <span>Deployment Tiers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Simple, Transparent, Self-Hosted
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Run DocuMind in your local environment or deploy full enterprise clusters with zero proprietary API ties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Tier 1 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Developer / Local Mode
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                $0 <span className="text-xs font-normal text-slate-400">/ forever free</span>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Zero-Docker embedded SQLite & Celery in-process workers. Instant startup for individual research and testing.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Laptop Profile (BAAI/bge-small-en-v1.5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Local Tesseract OCR v5 engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Embedded SQLite database</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Interactive 3-Panel workspace</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenAuth(true)}
              className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Start Local Workspace
            </button>
          </div>

          {/* Tier 2 (Highlighted) */}
          <div className="p-8 rounded-2xl border-2 border-blue-600 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xl shadow-blue-600/10 relative -translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm">
              Most Popular
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                Team Server (Docker)
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                $0 <span className="text-xs font-normal text-slate-400">/ self-hosted open source</span>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Full Docker Compose stack with PostgreSQL, pgvector extension, Redis queue, and multi-user RBAC.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Server Profile (BAAI/bge-m3 1024-dim)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>PostgreSQL + pgvector storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Role-Based Access (Admin/Editor/Viewer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Redis distributed background workers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>Unlimited documents & workspaces</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenAuth(false)}
              className="mt-8 w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/30"
            >
              Launch Docker Stack
            </button>
          </div>

          {/* Tier 3 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Air-Gapped Enterprise
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                Custom <span className="text-xs font-normal text-slate-400">/ on-premise SLA</span>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Dedicated multi-GPU nodes, air-gapped security compliance, custom fine-tuning, and enterprise SSO integration.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Dedicated Multi-GPU Cluster Deployment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>SAML / Okta / Azure AD SSO Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Audit Logging & SOC2 Certification Pack</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Air-gapped offline installer binaries</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenAuth(false)}
              className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Contact Enterprise Engineering
            </button>
          </div>

        </div>
      </section>


      {/* =========================================================================
          FAQ ACCORDION (#faq)
          ========================================================================= */}
      <section className="py-20 bg-slate-50 dark:bg-[#090d16] border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Clear answers about models, hardware specifications, and local architecture.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={faq.q}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4.5 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4.5 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* =========================================================================
          FINAL HIGH-CONVERTING BOTTOM CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ready for Production Deployment</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Stop Guessing. Start Verifying Every Document Insight.
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-blue-100 leading-relaxed">
            Deploy DocuMind today with zero third-party API dependencies. Keep 100% of your confidential corporate contracts, finances, and records on your own infrastructure.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-blue-700 bg-white hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Get Started Free →
            </button>
            <button
              onClick={() => onOpenAuth(false)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white border border-white/40 hover:bg-white/10 transition-all cursor-pointer"
            >
              Sign In with Evaluation Admin
            </button>
          </div>
        </div>
      </section>


      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#06090e] py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  OrbitOperations · DocuMind
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Enterprise AI Document Intelligence Engine v2.4
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#pipeline" className="hover:text-blue-600 transition-colors">Pipeline</a>
              <a href="#why-documind" className="hover:text-blue-600 transition-colors">Architecture</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Deployment</a>
              <button 
                onClick={() => onOpenAuth(false)}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Local Engines Operational</span>
            </div>

          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/80 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} DocuMind / OrbitOperations. 100% Local-First. Zero Data Leaks. Built with Next.js 16, FastAPI, PyMuPDF, pgvector, and Tesseract OCR.
          </div>
        </div>
      </footer>

    </div>
  );
}
