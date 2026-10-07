"use client";

import React from "react";
import { 
  LayoutDashboard, FolderGit2, MessageSquareText, 
  FileSearch, Users, Settings2, ShieldCheck, X
} from "lucide-react";

export type NavView = "dashboard" | "documents" | "chat" | "intelligence" | "team" | "admin";

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  documentCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ 
  currentView, 
  onNavigate, 
  documentCount,
  isOpenMobile = false,
  onCloseMobile
}: SidebarProps) {
  const items = [
    {
      id: "dashboard" as NavView,
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "documents" as NavView,
      label: "Documents",
      icon: FolderGit2,
      badge: documentCount > 0 ? documentCount : null,
    },
    {
      id: "chat" as NavView,
      label: "Chat & Citations",
      icon: MessageSquareText,
      badge: "Workspace",
    },
    {
      id: "intelligence" as NavView,
      label: "Extraction & Compare",
      icon: FileSearch,
      badge: null,
    },
    {
      id: "team" as NavView,
      label: "Team & Roles",
      icon: Users,
      badge: null,
    },
    {
      id: "admin" as NavView,
      label: "Settings & System",
      icon: Settings2,
      badge: null,
    },
  ];

  const handleItemClick = (id: NavView) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 pt-1">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Workspace Navigation
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? "bg-background text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Local Perimeter Assurance Note */}
      <div className="p-2.5 rounded border border-border bg-muted/20 text-[11px] mt-4">
        <div className="flex items-center space-x-1.5 font-medium text-foreground mb-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">Local Perimeter Active</span>
        </div>
        <p className="text-muted-foreground text-[10px] leading-relaxed">
          Document parsing, OCR, and vector retrieval are restricted to on-premise hardware.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-56 border-r border-border bg-card/60 flex-col justify-between p-3 shrink-0 select-none">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-150">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col justify-between p-4 shadow-2xl select-none z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
