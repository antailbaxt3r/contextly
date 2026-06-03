export type DocumentStatus =
  | "pending"
  | "parsing"
  | "embedding"
  | "ready"
  | "failed";

export type MessageRole = "user" | "assistant" | "system";

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface DocumentRecord {
  id: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  status: DocumentStatus;
  error_message: string | null;
  page_count: number | null;
  chunk_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  rank: number;
  chunk_id: string;
  score: number | null;
  page_start: number | null;
  page_end: number | null;
  content_preview: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  created_at: string;
}
