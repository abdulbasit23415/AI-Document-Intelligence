"use client";

import React, { useState } from "react";
import { User, Workspace } from "@/lib/api";
import { 
  FileText, Shield, Cpu, LogOut, ChevronDown, Check, Sun, Moon, Database, Menu, X 
} from "lucide-react";

interface NavbarProps {
  currentUser: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onSelectWorkspace: (ws: Workspace) => void;
  onLogout: () => void;
  modelProfile: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onViewLanding?: () => void;
}

export function Navbar({
  currentUser,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onLogout,
  modelProfile,
  isDarkMode,
  onToggleDarkMode,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onViewLanding,
}: NavbarProps) {
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-card px-3 sm:px-5 flex items-center justify-between sticky top-0 z-40 transition-colors">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile menu toggle */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}

        {/* Brand identity */}
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded border border-border bg-foreground text-background flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
            DM
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              DocuMind
            </span>
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider hidden xs:inline">
              v1.0
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Workspace Dropdown */}
        {currentWorkspace && (
          <div className="relative">
            <button
              onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
              className="flex items-center space-x-1.5 px-2 py-1.5 rounded border border-border bg-muted/40 hover:bg-muted/70 transition-colors text-xs font-medium text-foreground"
            >
              <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="max-w-[90px] xs:max-w-[130px] sm:max-w-[170px] truncate">{currentWorkspace.name}</span>
            </button>

            {wsDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-md border border-border bg-popover shadow-lg p-1 z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Workspaces
                </div>
                <div className="py-0.5 max-h-52 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace(ws);
                        setWsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-muted text-left transition-colors"
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === currentWorkspace.id && (
                        <Check className="h-3.5 w-3.5 text-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Model Profile Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded border border-border bg-muted/30 text-[11px] font-mono text-muted-foreground">
          <Cpu className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>Local Engine:</span>
          <span className="text-foreground font-semibold">
            {modelProfile === "laptop" ? "Qwen3-4B / BGE-Small" : modelProfile}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>

        {/* Landing Page Trigger */}
        {onViewLanding && (
          <button
            type="button"
            onClick={onViewLanding}
            className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
            title="View Landing Page"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            <span>Landing Page</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-1.5 rounded border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center justify-center cursor-pointer shadow-xs"
          title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {isDarkMode ? (
            <Sun className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-slate-700" />
          )}
        </button>

        {/* User Account */}
        {currentUser ? (
          <div className="flex items-center space-x-2.5 pl-2 border-l border-border">
            <div className="text-right hidden md:block">
              <div className="text-xs font-medium text-foreground leading-none">
                {currentUser.full_name || currentUser.email.split("@")[0]}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {currentUser.is_superuser ? "Admin" : "Editor"}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
