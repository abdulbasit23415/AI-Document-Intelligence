import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user, require_workspace_role
from apps.api.models.models import User, ChatConversation, ChatMessage, AuditLog
from apps.api.schemas.schemas import (
    ChatConversationCreate, ChatConversationResponse, ChatMessageSend, ChatMessageResponse
)
from apps.api.services.retrieval import retrieval_engine
from apps.api.services.llm_adapter import llm_adapter

router = APIRouter(prefix="/workspaces/{workspace_id}/chat", tags=["Chat & Retrieval"])

@router.get("/conversations", response_model=List[ChatConversationResponse])
def list_conversations(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    convs = db.query(ChatConversation).filter(
        ChatConversation.workspace_id == workspace_id,
        ChatConversation.user_id == current_user.id
    ).order_by(desc(ChatConversation.updated_at)).all()
    return convs

@router.post("/conversations", response_model=ChatConversationResponse)
def create_conversation(
    workspace_id: str,
    conv_in: ChatConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    conv = ChatConversation(
        workspace_id=workspace_id,
        user_id=current_user.id,
        title=conv_in.title or "New Conversation",
        selected_document_ids=conv_in.selected_document_ids or []
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
def get_conversation_messages(
    workspace_id: str,
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.workspace_id == workspace_id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.created_at).all()
    return messages

@router.post("/conversations/{conversation_id}/messages")
def send_message_stream(
    workspace_id: str,
    conversation_id: str,
    msg_in: ChatMessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.workspace_id == workspace_id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    # 1. Save user query message
    user_msg = ChatMessage(
        conversation_id=conversation_id,
        role="user",
        content=msg_in.content
    )
    db.add(user_msg)
    db.commit()

    # 2. Hybrid Retrieval with authorization enforcement
    selected_docs = msg_in.selected_document_ids or conv.selected_document_ids or None
    retrieved_passages = retrieval_engine.retrieve(
        db=db,
        workspace_id=workspace_id,
        query=msg_in.content,
        authorized_user_role=role,
        selected_doc_ids=selected_docs
    )

    def event_stream():
        full_text = ""
        validated_citations = []
        timings = {}

        for event in llm_adapter.generate_answer_stream(msg_in.content, retrieved_passages):
            if event["event"] == "token":
                full_text += event["data"]
                yield f"data: {json.dumps(event)}\n\n"
            elif event["event"] == "done":
                validated_citations = event.get("citations", [])
                timings = event.get("timings", {})
                yield f"data: {json.dumps(event)}\n\n"

        # 3. Persist assistant response with validated citations
        try:
            from apps.api.core.database import SessionLocal
            save_db = SessionLocal()
            asst_msg = ChatMessage(
                conversation_id=conversation_id,
                role="assistant",
                content=full_text,
                citations=validated_citations,
                retrieval_timings=timings
            )
            save_db.add(asst_msg)
            save_db.commit()
            save_db.close()
        except Exception as e:
            pass

    return StreamingResponse(event_stream(), media_type="text/event-stream")
