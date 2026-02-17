import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import photos

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup
    settings.ensure_dirs()
    db_dir = settings.database_path.parent
    if not db_dir.exists():
        logger.error("Database directory %s does not exist and could not be created", db_dir)
        raise RuntimeError(f"Database directory not available: {db_dir}")
    init_db()
    logger.info("PhotoSift started — DB at %s", settings.database_path)
    yield
    # Shutdown
    logger.info("PhotoSift shutting down")


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(photos.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.app_name}
