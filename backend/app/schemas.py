from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import DocumentStatus, MessageRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    display_name: str
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    original_filename: str
    mime_type: str
    byte_size: int
    status: DocumentStatus
    error_message: str | None = None
    page_count: int | None = None
    chunk_count: int | None = None
    created_at: datetime
    updated_at: datetime


class ConversationCreate(BaseModel):
    document_id: UUID
    title: str | None = Field(default=None, max_length=200)


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class CitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int
    chunk_id: UUID
    score: float | None = None
    page_start: int | None = None
    page_end: int | None = None
    content_preview: str


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    citations: list[CitationResponse] = []
    created_at: datetime
