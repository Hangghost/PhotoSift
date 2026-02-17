import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    folder_path TEXT,
    thumbnail_path TEXT,
    full_image_path TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'keep', 'delete', 'uploaded')),
    blur_score REAL,
    duplicate_group_id TEXT,
    composition_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    folder_path TEXT,
    total_photos INTEGER DEFAULT 0,
    processed_photos INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    photo_id TEXT REFERENCES photos(id),
    platform TEXT,
    platform_id TEXT,
    status TEXT CHECK(status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def get_db_path() -> Path:
    return settings.database_path


def init_db() -> None:
    settings.ensure_dirs()
    with get_connection() as conn:
        conn.executescript(SCHEMA)


@contextmanager
def get_connection():
    conn = sqlite3.connect(str(get_db_path()))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
