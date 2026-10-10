"use client";

import React, { useState } from "react";
import { api, User } from "@/lib/api";
import { Mail, Lock, User as UserIcon, Sparkles, X } from "lucide-react";

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onClose?: () => void;
  initialRegister?: boolean;
}

export function AuthModal({ onSuccess, onClose, initialRegister = false }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [email, setEmail] = useState("admin@docmind.local");
  const [password, setPassword] = useState("AdminDocuMind2026!");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register({ email, password, full_name: fullName || undefined });
        onSuccess(res.user);
      } else {
        const params = new URLSearchParams();
        params.append("username", email);
        params.append("password", password);
        const res = await api.login(params);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setIsRegister(false);
    setEmail("admin@docmind.local");
    setPassword("AdminDocuMind2026!");
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="relative bg-card border border-border rounded-lg w-full max-w-sm p-6 shadow-lg space-y-5 animate-in fade-in duration-150">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="h-9 w-9 rounded border border-border bg-foreground text-background mx-auto flex items-center justify-center font-bold text-sm tracking-wider">
            DM
          </div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            {isRegister ? "Create Workspace Account" : "Sign in to DocuMind"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Enterprise Private Document Intelligence
          </p>
        </div>

        {/* Demo Quick Fill Button */}
        <div className="p-3 rounded border border-border bg-muted/20 text-center space-y-1.5">
          <div className="text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-muted-foreground" />
            <span>Evaluation Seed Account</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemoAdmin}
            className="w-full py-1.5 px-2 rounded border border-border bg-card hover:bg-muted text-foreground text-[11px] font-medium transition-colors duration-150"
          >
            Load Admin Credentials (admin@docmind.local)
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded border border-destructive/40 bg-destructive/10 text-destructive text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Full Name</label>
              <div className="relative">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-9 pr-3 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors duration-150"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Work Email</label>
            <div className="relative">
              <Mail className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors duration-150"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors duration-150"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded border border-primary bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity duration-150"
          >
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-muted-foreground pt-1">
          {isRegister ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-foreground font-semibold hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new workspace?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-foreground font-semibold hover:underline"
              >
                Register
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
