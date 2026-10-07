"use client";

import React, { useState, useEffect } from "react";
import { Workspace, WorkspaceMember, api } from "@/lib/api";
import { Users, UserPlus, Shield, Mail } from "lucide-react";

interface TeamMembersProps {
  workspace: Workspace | null;
}

export function TeamMembersView({ workspace }: TeamMembersProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    loadMembers();
  }, [workspace]);

  const loadMembers = async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      const res = await api.getWorkspaceMembers(workspace.id);
      setMembers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !inviteEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await api.addWorkspaceMember(workspace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      loadMembers();
    } catch (err: any) {
      alert(`Could not add member: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Workspace Access & Permissions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage authorized collaborators and enforce strict RBAC boundaries for <span className="font-medium text-foreground">{workspace?.name}</span>.
        </p>
      </div>

      {/* Add Member Form */}
      <form
        onSubmit={handleAddMember}
        className="p-4 rounded border border-border bg-card flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="relative flex-1">
          <Mail className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@enterprise.com"
            required
            className="w-full pl-9 pr-3 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors duration-150"
          />
        </div>

        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as any)}
          className="px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground font-medium focus:outline-none"
        >
          <option value="viewer">Viewer (Read-only)</option>
          <option value="editor">Editor (Upload & Search)</option>
          <option value="admin">Administrator (Full Control)</option>
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center space-x-1.5 px-4 py-1.5 rounded border border-primary bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity duration-150"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Add Member</span>
        </button>
      </form>

      {/* Members Table */}
      <div className="rounded border border-border bg-card overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border text-[10px] sm:text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 sm:px-4">Member</th>
              <th className="py-2.5 px-3 sm:px-4">Email</th>
              <th className="py-2.5 px-3 sm:px-4">Assigned Role</th>
              <th className="py-2.5 px-3 sm:px-4 hidden sm:table-cell">Added Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-muted/20 transition-colors duration-150">
                <td className="py-3 px-4 font-semibold text-foreground">
                  {m.full_name || "Workspace Member"}
                </td>
                <td className="py-3 px-4 font-mono text-muted-foreground">
                  {m.email}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border inline-flex items-center gap-1 ${
                      m.role === "admin"
                        ? "bg-foreground text-background border-foreground"
                        : m.role === "editor"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>{m.role}</span>
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
