/**
 * DocuMind API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  current_user_role?: string;
  document_count: number;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "admin" | "editor" | "viewer";
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  workspace_id: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  page_count: number | null;
  status: "uploaded" | "queued" | "parsing" | "ocr" | "chunking" | "embedding" | "ready" | "failed";
  status_message: string | null;
  version: number;
  is_restricted: boolean;
  metadata_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  page_number: number | null;
  section_heading: string | null;
  content: string;
  token_count: number;
  bounding_boxes: Array<{ page: number; left: number; top: number; right: number; bottom: number }> | null;
}

export interface DocumentDetail extends DocumentItem {
  chunks: DocumentChunk[];
}

export interface BoundingBox {
  page: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CitationItem {
  citation_id: number;
  chunk_id: string;
  document_id: string;
  document_name: string;
  page_number?: number | null;
  section?: string | null;
  text_excerpt: string;
  relevance_score?: number | null;
  bounding_boxes?: BoundingBox[] | null;
}

export interface ChatConversation {
  id: string;
  workspace_id: string;
  title: string;
  selected_document_ids: string[];
  model_profile: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: CitationItem[];
  retrieval_timings?: Record<string, any>;
  created_at: string;
}

export interface SystemStats {
  total_documents: number;
  total_pages: number;
  total_chunks: number;
  total_storage_bytes: number;
  model_profile: string;
  system_memory_mb: {
    total_mb: number;
    available_mb: number;
    percent_used: number;
  };
  active_jobs: number;
  queue_name: string;
  tesseract_available: boolean;
}

// Token storage helpers
let cachedToken: string | null = null;

export function setAuthToken(token: string | null) {
  cachedToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("docmind_token", token);
    } else {
      localStorage.removeItem("docmind_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (cachedToken) return cachedToken;
  if (typeof window !== "undefined") {
    cachedToken = localStorage.getItem("docmind_token");
  }
  return cachedToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errDetail = res.statusText;
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errDetail;
    } catch (_) {}
    throw new Error(errDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(formData: URLSearchParams) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    setAuthToken(data.access_token);
    return data;
  },

  async register(data: { email: string; password: string; full_name?: string }) {
    const res = await request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setAuthToken(res.access_token);
    return res;
  },

  async getMe(): Promise<User> {
    return request<User>("/auth/me");
  },

  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    return request<Workspace[]>("/workspaces");
  },

  async createWorkspace(name: string): Promise<Workspace> {
    return request<Workspace>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async getWorkspaceMembers(wsId: string): Promise<WorkspaceMember[]> {
    return request<WorkspaceMember[]>(`/workspaces/${wsId}/members`);
  },

  async addWorkspaceMember(wsId: string, email: string, role: string): Promise<WorkspaceMember> {
    return request<WorkspaceMember>(`/workspaces/${wsId}/members?email=${encodeURIComponent(email)}&role=${role}`, {
      method: "POST",
    });
  },

  // Documents
  async listDocuments(wsId: string, search?: string, statusFilter?: string): Promise<DocumentItem[]> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status_filter", statusFilter);
    return request<DocumentItem[]>(`/workspaces/${wsId}/documents?${params.toString()}`);
  },

  async uploadDocuments(wsId: string, files: File[], isRestricted: boolean = false): Promise<DocumentItem[]> {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/workspaces/${wsId}/documents/upload?is_restricted=${isRestricted}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async getDocumentDetail(wsId: string, docId: string): Promise<DocumentDetail> {
    return request<DocumentDetail>(`/workspaces/${wsId}/documents/${docId}`);
  },

  async retryDocument(wsId: string, docId: string) {
    return request(`/workspaces/${wsId}/documents/${docId}/retry`, { method: "POST" });
  },

  async deleteDocument(wsId: string, docId: string) {
    return request(`/workspaces/${wsId}/documents/${docId}`, { method: "DELETE" });
  },

  getDocumentDownloadUrl(wsId: string, docId: string): string {
    return `${API_BASE}/workspaces/${wsId}/documents/${docId}/download`;
  },

  // Chat
  async listConversations(wsId: string): Promise<ChatConversation[]> {
    return request<ChatConversation[]>(`/workspaces/${wsId}/chat/conversations`);
  },

  async createConversation(wsId: string, title?: string, selectedDocIds?: string[]): Promise<ChatConversation> {
    return request<ChatConversation>(`/workspaces/${wsId}/chat/conversations`, {
      method: "POST",
      body: JSON.stringify({ title, selected_document_ids: selectedDocIds || [] }),
    });
  },

  async getConversationMessages(wsId: string, convId: string): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`/workspaces/${wsId}/chat/conversations/${convId}/messages`);
  },

  async sendMessageStream(
    wsId: string,
    convId: string,
    content: string,
    selectedDocIds: string[] | undefined,
    onToken: (token: string) => void,
    onDone: (citations: CitationItem[], timings: any) => void,
    onError: (err: string) => void
  ) {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_BASE}/workspaces/${wsId}/chat/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content,
          selected_document_ids: selectedDocIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("ReadableStream not supported");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === "token") {
                onToken(data.data);
              } else if (data.event === "done") {
                onDone(data.citations || [], data.timings || {});
              }
            } catch (e) {
              // json parse skip
            }
          }
        }
      }
    } catch (err: any) {
      onError(err.message || "Failed to stream response");
    }
  },

  // Document Intelligence
  async extractContract(wsId: string, docId: string) {
    return request(`/workspaces/${wsId}/intelligence/contract/${docId}`, { method: "POST" });
  },

  async extractInvoice(wsId: string, docId: string) {
    return request(`/workspaces/${wsId}/intelligence/invoice/${docId}`, { method: "POST" });
  },

  async summarizeDocument(wsId: string, docId: string) {
    return request(`/workspaces/${wsId}/intelligence/summary/${docId}`, { method: "POST" });
  },

  async compareDocuments(wsId: string, docAId: string, docBId: string) {
    return request(`/workspaces/${wsId}/intelligence/compare?document_a_id=${docAId}&document_b_id=${docBId}`, {
      method: "POST",
    });
  },

  // Admin & Health
  async getSystemStats(): Promise<SystemStats> {
    return request<SystemStats>("/admin/stats");
  },

  async updateAdminSettings(data: { model_profile: string; enable_cloud_models?: boolean; github_token?: string }) {
    return request("/admin/settings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async triggerReindex(wsId: string, targetModel: string) {
    return request(`/admin/reindex?workspace_id=${wsId}`, {
      method: "POST",
      body: JSON.stringify({ target_embedding_model: targetModel }),
    });
  },

  async getHealth() {
    return request("/health");
  },

  async getReady() {
    return request("/ready");
  },
};
