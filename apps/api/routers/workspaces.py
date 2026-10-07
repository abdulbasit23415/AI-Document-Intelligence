from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user, require_workspace_role
from apps.api.models.models import User, Workspace, WorkspaceMember, Document
from apps.api.schemas.schemas import (
    WorkspaceCreate, WorkspaceResponse, WorkspaceMemberResponse, MemberRoleUpdate
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).all()
    results = []
    for m in memberships:
        ws = m.workspace
        doc_count = db.query(Document).filter(
            Document.workspace_id == ws.id,
            Document.is_deleted == False
        ).count()
        results.append(WorkspaceResponse(
            id=ws.id,
            name=ws.name,
            slug=ws.slug,
            current_user_role=m.role,
            document_count=doc_count,
            created_at=ws.created_at
        ))
    return results

@router.post("", response_model=WorkspaceResponse)
def create_workspace(ws_in: WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slug = f"{ws_in.name.lower().replace(' ', '-')[:30]}-{current_user.id[:6]}"
    ws = Workspace(name=ws_in.name, slug=slug)
    db.add(ws)
    db.flush()

    membership = WorkspaceMember(workspace_id=ws.id, user_id=current_user.id, role="admin")
    db.add(membership)
    db.commit()
    db.refresh(ws)

    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        current_user_role="admin",
        document_count=0,
        created_at=ws.created_at
    )

@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
def get_workspace_members(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()
    out = []
    for m in members:
        u = m.user
        out.append(WorkspaceMemberResponse(
            id=m.id,
            workspace_id=m.workspace_id,
            user_id=u.id,
            role=m.role,
            email=u.email,
            full_name=u.full_name,
            created_at=m.created_at
        ))
    return out

@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse)
def add_workspace_member(
    workspace_id: str,
    email: str,
    role: str = "viewer",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin"])(workspace_id, current_user, db)
    target_user = db.query(User).filter(User.email == email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found with this email.")

    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == target_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this workspace.")

    mem = WorkspaceMember(workspace_id=workspace_id, user_id=target_user.id, role=role)
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return WorkspaceMemberResponse(
        id=mem.id,
        workspace_id=mem.workspace_id,
        user_id=target_user.id,
        role=mem.role,
        email=target_user.email,
        full_name=target_user.full_name,
        created_at=mem.created_at
    )

@router.patch("/{workspace_id}/members/{user_id}")
def update_member_role(
    workspace_id: str,
    user_id: str,
    role_in: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin"])(workspace_id, current_user, db)
    mem = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membership not found.")
    mem.role = role_in.role
    db.commit()
    return {"status": "success", "new_role": mem.role}

@router.delete("/{workspace_id}/members/{user_id}")
def remove_member(
    workspace_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin"])(workspace_id, current_user, db)
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Admins cannot remove themselves from the workspace.")
    mem = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membership not found.")
    db.delete(mem)
    db.commit()
    return {"status": "success"}
