"use client";

import React from "react";
import { 
  LayoutDashboard, FolderGit2, MessageSquareText, 
  FileSearch, Users, Settings2, ShieldCheck
} from "lucide-react";

export type NavView = "dashboard" | "documents" | "chat" | "intelligence" | "team" | "admin";

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  documentCount: number;
}

export function Sidebar({ currentView, onNavigate, documentCount }: SidebarProps) {
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

  return (
    <aside className="w-56 border-r border-border bg-card/60 flex flex-col justify-between p-3 shrink-0 select-none">
      <div className="space-y-4">
        <div className="px-2 pt-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Workspace Navigation
        </div>

        <nav className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors ${
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
      <div className="p-2.5 rounded border border-border bg-muted/20 text-[11px]">
        <div className="flex items-center space-x-1.5 font-medium text-foreground mb-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Local Perimeter Active</span>
        </div>
        <p className="text-muted-foreground text-[10px] leading-relaxed">
          Document parsing, OCR, and vector retrieval are restricted to on-premise hardware.
        </p>
      </div>
    </aside>
  );
}
