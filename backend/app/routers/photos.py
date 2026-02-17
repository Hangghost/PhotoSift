import hashlib
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.database import get_connection
from app.models.schemas import (
    BatchStatusUpdate,
    LoadFolderRequest,
    PhotoFeaturedUpdate,
    PhotoOut,
    PhotoStatusUpdate,
    SessionOut,
)

router = APIRouter(prefix="/api/photos", tags=["photos"])

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".bmp", ".tiff", ".tif"}


def _photo_id(folder: str, filename: str) -> str:
    return hashlib.sha256(f"{folder}/{filename}".encode()).hexdigest()[:16]


def _row_to_photo(r) -> PhotoOut:
    return PhotoOut(
        id=r["id"],
        name=r["name"],
        folder_path=r["folder_path"],
        thumbnail_url=f"/api/photos/{r['id']}/thumbnail",
        full_image_url=f"/api/photos/{r['id']}/image",
        status=r["status"],
        featured=bool(r["featured"]),
        blur_score=r["blur_score"],
        duplicate_group_id=r["duplicate_group_id"],
        composition_score=r["composition_score"],
        created_at=r["created_at"],
        updated_at=r["updated_at"],
    )


@router.post("/load-folder", response_model=SessionOut)
async def load_folder(req: LoadFolderRequest):
    """Scan a local folder and load all photos into the database."""
    try:
        folder = Path(req.folder_path).expanduser().resolve()
    except RuntimeError:
        # In Docker, expanduser() may fail if HOME is not set
        # Fall back to using the path as-is
        folder = Path(req.folder_path).resolve()

    if not folder.is_dir():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")

    session_id = uuid.uuid4().hex[:12]
    photos = []

    for f in sorted(folder.iterdir()):
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS:
            photo_id = _photo_id(str(folder), f.name)
            photos.append((photo_id, f.name, str(folder), str(f)))

    with get_connection() as conn:
        # Create session
        conn.execute(
            "INSERT INTO sessions (id, folder_path, total_photos, status) "
            "VALUES (?, ?, ?, 'active')",
            (session_id, str(folder), len(photos)),
        )
        # Upsert photos
        for pid, name, fpath, full_path in photos:
            conn.execute(
                """INSERT INTO photos (id, name, folder_path, full_image_path, status)
                   VALUES (?, ?, ?, ?, 'pending')
                   ON CONFLICT(id) DO UPDATE SET
                     folder_path=excluded.folder_path,
                     full_image_path=excluded.full_image_path,
                     updated_at=CURRENT_TIMESTAMP""",
                (pid, name, fpath, full_path),
            )

    return SessionOut(
        id=session_id,
        folder_path=str(folder),
        total_photos=len(photos),
        processed_photos=0,
        status="active",
    )


@router.get("", response_model=list[PhotoOut])
async def list_photos(folder_path: str | None = None, status: str | None = None):
    """List photos, optionally filtered by folder or status."""
    query = "SELECT * FROM photos WHERE 1=1"
    params: list = []

    if folder_path:
        query += " AND folder_path = ?"
        params.append(folder_path)
    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY name ASC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()

    return [_row_to_photo(r) for r in rows]


@router.get("/{photo_id}/image")
async def get_image(photo_id: str):
    """Serve the full-size image."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT full_image_path FROM photos WHERE id = ?", (photo_id,)
        ).fetchone()
    if not row or not row["full_image_path"]:
        raise HTTPException(status_code=404, detail="Photo not found")

    path = Path(row["full_image_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image file not found on disk")

    return FileResponse(path)


@router.get("/{photo_id}/thumbnail")
async def get_thumbnail(photo_id: str):
    """Serve a thumbnail (for now, same as full image)."""
    # TODO: generate actual thumbnails for performance
    return await get_image(photo_id)


@router.patch("/{photo_id}/status", response_model=PhotoOut)
async def update_status(photo_id: str, body: PhotoStatusUpdate):
    """Update a single photo's status."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE photos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (body.status.value, photo_id),
        )
        row = conn.execute("SELECT * FROM photos WHERE id = ?", (photo_id,)).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Photo not found")

    return _row_to_photo(row)


@router.patch("/{photo_id}/featured", response_model=PhotoOut)
async def update_featured(photo_id: str, body: PhotoFeaturedUpdate):
    """Toggle a single photo's featured flag."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE photos SET featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (int(body.featured), photo_id),
        )
        row = conn.execute("SELECT * FROM photos WHERE id = ?", (photo_id,)).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Photo not found")

    return _row_to_photo(row)


@router.patch("/batch/status")
async def batch_update_status(body: BatchStatusUpdate):
    """Update multiple photos' status at once."""
    with get_connection() as conn:
        for pid in body.photo_ids:
            conn.execute(
                "UPDATE photos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (body.status.value, pid),
            )
    return {"updated": len(body.photo_ids), "status": body.status.value}


@router.post("/batch/copy-featured")
async def copy_featured(req: LoadFolderRequest):
    """Copy all featured photos to a '精選' subfolder."""
    folder = Path(req.folder_path)
    if not folder.is_dir():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")

    dest = folder / "精選"
    dest.mkdir(exist_ok=True)

    with get_connection() as conn:
        rows = conn.execute(
            "SELECT full_image_path, name FROM photos WHERE folder_path = ? AND featured = 1",
            (req.folder_path,),
        ).fetchall()

    copied = 0
    errors = []
    for r in rows:
        try:
            src = Path(r["full_image_path"])
            if src.exists():
                shutil.copy2(str(src), str(dest / r["name"]))
                copied += 1
            else:
                errors.append({"name": r["name"], "error": "Source file not found"})
        except Exception as e:
            errors.append({"name": r["name"], "error": str(e)})

    return {"copied": copied, "folder": str(dest), "errors": errors}


@router.delete("/batch/delete-marked")
async def delete_marked_photos(folder_path: str):
    """Delete photos marked as 'delete' from disk and database."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, full_image_path FROM photos WHERE folder_path = ? AND status = 'delete'",
            (folder_path,),
        ).fetchall()

        deleted = 0
        errors = []
        for r in rows:
            try:
                path = Path(r["full_image_path"])
                if path.exists():
                    path.unlink()
                conn.execute("DELETE FROM photos WHERE id = ?", (r["id"],))
                deleted += 1
            except Exception as e:
                errors.append({"id": r["id"], "error": str(e)})

    return {"deleted": deleted, "errors": errors}


@router.get("/sessions", response_model=list[SessionOut])
async def list_sessions():
    """List all sessions."""
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM sessions ORDER BY created_at DESC").fetchall()
    return [
        SessionOut(
            id=r["id"],
            folder_path=r["folder_path"],
            total_photos=r["total_photos"],
            processed_photos=r["processed_photos"],
            status=r["status"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
