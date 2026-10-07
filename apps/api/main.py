import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.core.config import settings
from apps.api.core.database import Base, engine, SessionLocal
from apps.api.core.security import get_password_hash
from apps.api.models.models import User, Workspace, WorkspaceMember
from apps.api.routers import auth, workspaces, documents, chat, intelligence, admin, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("docmind.api")

def init_db():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Seed default administrator if database is fresh
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@docmind.local").first()
        if not admin_user:
            logger.info("Seeding initial administrator: admin@docmind.local")
            admin_user = User(
                email="admin@docmind.local",
                hashed_password=get_password_hash("AdminDocuMind2026!"),
                full_name="DocuMind Administrator",
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            db.flush()

            default_ws = Workspace(
                name="Primary Enterprise Workspace",
                slug="primary-workspace"
            )
            db.add(default_ws)
            db.flush()

            membership = WorkspaceMember(
                workspace_id=default_ws.id,
                user_id=admin_user.id,
                role="admin"
            )
            db.add(membership)
            db.commit()
            logger.info("Default administrator and workspace created successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info(f"DocuMind API started successfully. Profile: {settings.MODEL_PROFILE}")
    yield
    logger.info("DocuMind API shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise AI Document Intelligence Platform with local offline embeddings, OCR, and verifiable citations.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits frontend dev and prod origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(workspaces.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(intelligence.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
        "ready": f"{settings.API_V1_PREFIX}/ready"
    }
