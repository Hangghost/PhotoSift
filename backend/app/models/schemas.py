from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class PhotoStatus(StrEnum):
    pending = "pending"
    keep = "keep"
    delete = "delete"
    uploaded = "uploaded"


class PhotoOut(BaseModel):
    id: str
    name: str
    folder_path: str | None = None
    thumbnail_url: str | None = None
    full_image_url: str | None = None
    status: PhotoStatus = PhotoStatus.pending
    blur_score: float | None = None
    duplicate_group_id: str | None = None
    composition_score: float | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PhotoStatusUpdate(BaseModel):
    status: PhotoStatus


class BatchStatusUpdate(BaseModel):
    photo_ids: list[str]
    status: PhotoStatus


class SessionOut(BaseModel):
    id: str
    folder_path: str | None = None
    total_photos: int = 0
    processed_photos: int = 0
    status: str = "active"
    created_at: datetime | None = None


class SessionCreate(BaseModel):
    folder_path: str


class LoadFolderRequest(BaseModel):
    folder_path: str
