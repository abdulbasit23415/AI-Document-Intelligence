"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Workspace, DocumentItem, api, setAuthToken, getAuthToken 
} from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavView } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { DocumentLibraryView } from "@/components/DocumentLibraryView";
import { ChatWorkspaceView } from "@/components/ChatWorkspaceView";
import { IntelligenceHubView } from "@/components/IntelligenceHubView";
import { TeamMembersView } from "@/components/TeamMembersView";
import { AdminSettingsView } from "@/components/AdminSettingsView";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
import { AuthModal } from "@/components/AuthModal";
import { LandingPage } from "@/components/LandingPage";

export default function DocuMindApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentView, setCurrentView] = useState<NavView>("dashboard");

  // Inspection modal state
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);
  const [inspectTargetPage, setInspectTargetPage] = useState<number | null>(null);

  // App settings state (Default to Light theme)
  const [modelProfile, setModelProfile] = useState<string>("laptop");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Landing page & Auth modal states
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalIsRegister, setAuthModalIsRegister] = useState<boolean>(false);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    const savedTheme = typeof window !== "undefined" ? localStorage.getItem("docmind_theme") : null;
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      if (nextTheme) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        try { localStorage.setItem("docmind_theme", "dark"); } catch (e) {}
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
        try { localStorage.setItem("docmind_theme", "light"); } catch (e) {}
      }
      return nextTheme;
    });
  };

  // Check auth session
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (token) {
      setInitialLoading(true);
      try {
        const user = await api.getMe();
        setCurrentUser(user);
        await loadWorkspaces();
        setShowLandingPage(false);
      } catch (err) {
        console.error("Session expired or invalid:", err);
        setAuthToken(null);
        setCurrentUser(null);
      } finally {
        setInitialLoading(false);
      }
    }
  };

  const loadWorkspaces = async () => {
    try {
      const wsList = await api.listWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        const active = currentWorkspace || wsList[0];
        setCurrentWorkspace(active);
        await loadDocuments(active.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDocuments = async (wsId: string) => {
    try {
      const docs = await api.listDocuments(wsId);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    loadDocuments(ws.id);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadWorkspaces();
    setShowLandingPage(false);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    setDocuments([]);
    setShowLandingPage(true);
  };

  const handleOpenDocById = (docId: string, pageNumber?: number | null) => {
    const found = documents.find((d) => d.id === docId);
    if (found) {
      setInspectDoc(found);
      setInspectTargetPage(pageNumber || 1);
    }
  };



  // Render Landing Page if not authenticated OR if user requested to view it
  if (!currentUser || showLandingPage) {
    return (
      <div data-theme={isDarkMode ? "dark" : "light"} className={isDarkMode ? "dark" : ""}>
        <LandingPage
          onOpenAuth={(isRegister = false) => {
            setAuthModalIsRegister(isRegister);
            setIsAuthModalOpen(true);
          }}
          onEnterDemo={async () => {
            if (currentUser) {
              setShowLandingPage(false);
              return;
            }
            try {
              const params = new URLSearchParams();
              params.append("username", "admin@docmind.local");
              params.append("password", "AdminDocuMind2026!");
              const res = await api.login(params);
              handleAuthSuccess(res.user);
            } catch (err) {
              setAuthModalIsRegister(false);
              setIsAuthModalOpen(true);
            }
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleTheme}
          currentUser={currentUser}
          onEnterWorkspace={() => setShowLandingPage(false)}
        />
        {isAuthModalOpen && (
          <AuthModal
            initialRegister={authModalIsRegister}
            onSuccess={(user) => {
              handleAuthSuccess(user);
              setIsAuthModalOpen(false);
            }}
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      data-theme={isDarkMode ? "dark" : "light"}
      className={`min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 ${isDarkMode ? "dark" : ""}`}
    >
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onLogout={handleLogout}
        modelProfile={modelProfile}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onViewLanding={() => setShowLandingPage(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }}
          documentCount={documents.length}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Central Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8">
          {currentView === "dashboard" && (
            <DashboardView
              workspace={currentWorkspace}
              documents={documents}
              onNavigateToUpload={() => setCurrentView("documents")}
              onSelectDocument={(doc) => {
                setInspectDoc(doc);
                setInspectTargetPage(1);
              }}
              onRefresh={() => currentWorkspace && loadDocuments(currentWorkspace.id)}
            />
          )}

          {currentView === "documents" && (
            <DocumentLibraryView
              workspace={currentWorkspace}
              documents={documents}
              onRefresh={() => currentWorkspace && loadDocuments(currentWorkspace.id)}
              onSelectDocument={(doc) => {
                setInspectDoc(doc);
                setInspectTargetPage(1);
              }}
            />
          )}

          {currentView === "chat" && (
            <ChatWorkspaceView
              workspace={currentWorkspace}
              documents={documents}
              onOpenDocumentModal={handleOpenDocById}
            />
          )}

          {currentView === "intelligence" && (
            <IntelligenceHubView
              workspace={currentWorkspace}
              documents={documents}
              onOpenDocument={handleOpenDocById}
            />
          )}

          {currentView === "team" && (
            <TeamMembersView workspace={currentWorkspace} />
          )}

          {currentView === "admin" && (
            <AdminSettingsView
              workspace={currentWorkspace}
              onRefreshStats={() => currentWorkspace && loadDocuments(currentWorkspace.id)}
            />
          )}
        </main>
      </div>

      {/* Document Detail Modal */}
      {inspectDoc && currentWorkspace && (
        <DocumentDetailModal
          workspaceId={currentWorkspace.id}
          document={inspectDoc}
          targetPage={inspectTargetPage}
          onClose={() => {
            setInspectDoc(null);
            setInspectTargetPage(null);
          }}
        />
      )}
    </div>
  );
}
