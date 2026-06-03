import { clearTokens, getAccessToken } from "./auth";
import type {
  AuthTokens,
  ChatMessage,
  Conversation,
  DocumentRecord,
  User,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; raw?: boolean } = { auth: true },
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && options.auth !== false) {
    clearTokens();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    const message =
      (detail && typeof detail === "object" && "detail" in detail
        ? String((detail as { detail: unknown }).detail)
        : null) || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  register: (body: { email: string; password: string; display_name: string }) =>
    request<User>(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      { auth: false },
    ),

  login: (body: { email: string; password: string }) =>
    request<AuthTokens>(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      { auth: false },
    ),

  me: () => request<User>("/api/v1/auth/me"),

  listDocuments: () => request<DocumentRecord[]>("/api/v1/documents"),

  getDocument: (id: string) => request<DocumentRecord>(`/api/v1/documents/${id}`),

  deleteDocument: (id: string) =>
    request<void>(`/api/v1/documents/${id}`, { method: "DELETE" }),

  uploadDocument: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<DocumentRecord>("/api/v1/documents", {
      method: "POST",
      body: fd,
    });
  },

  listConversations: (documentId?: string) => {
    const qs = documentId ? `?document_id=${documentId}` : "";
    return request<Conversation[]>(`/api/v1/conversations${qs}`);
  },

  getConversation: (id: string) =>
    request<Conversation>(`/api/v1/conversations/${id}`),

  createConversation: (body: { document_id: string; title?: string }) =>
    request<Conversation>("/api/v1/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  deleteConversation: (id: string) =>
    request<void>(`/api/v1/conversations/${id}`, { method: "DELETE" }),

  listMessages: (conversationId: string) =>
    request<ChatMessage[]>(`/api/v1/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    request<ChatMessage>(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),
};
