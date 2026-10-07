from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from packages.shared.contracts import CitationItem

# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Workspace Schemas ---
class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceMemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    email: str
    full_name: Optional[str]
    created_at: datetime

class MemberRoleUpdate(BaseModel):
    role: str = Field(pattern="^(admin|editor|viewer)$")

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    current_user_role: Optional[str] = None
    document_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: str
    workspace_id: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    page_count: Optional[int]
    status: str
    status_message: Optional[str]
    version: int
    is_restricted: bool
    metadata_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: Optional[int]
    section_heading: Optional[str]
    content: str
    token_count: int
    bounding_boxes: Optional[List[Dict[str, Any]]]

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    chunks: List[DocumentChunkResponse] = []

# --- Chat & Retrieval Schemas ---
class ChatConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    selected_document_ids: Optional[List[str]] = []

class ChatConversationResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    selected_document_ids: List[str]
    model_profile: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageSend(BaseModel):
    content: str
    selected_document_ids: Optional[List[str]] = None

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    citations: List[CitationItem] = []
    retrieval_timings: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

# --- Admin & System Settings ---
class SystemStatsResponse(BaseModel):
    total_documents: int
    total_pages: int
    total_chunks: int
    total_storage_bytes: int
    model_profile: str
    system_memory_mb: Dict[str, Any]
    active_jobs: int
    queue_name: str
    tesseract_available: bool

class ModelSettingsUpdate(BaseModel):
    model_profile: str
    enable_cloud_models: Optional[bool] = None
    github_token: Optional[str] = None

class ReindexRequest(BaseModel):
    target_embedding_model: str
