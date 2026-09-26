import os
import re
import logging
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from backend.app.config import settings
from backend.app.core.supabase_client import supabase_admin
from backend.app.models.attachment import Attachment
from backend.app.schemas.ticket import AttachmentRead

logger = logging.getLogger(__name__)

STORAGE_BUCKET = getattr(settings, "SUPABASE_STORAGE_BUCKET", "ticket-attachments")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf", ".doc", ".docx", ".txt"}


def format_size(size_bytes: int | None) -> str:
    if not size_bytes:
        return "0 Bytes"
    k = 1024.0
    sizes = ["Bytes", "KB", "MB", "GB"]
    i = 0
    val = float(size_bytes)
    while val >= k and i < len(sizes) - 1:
        val /= k
        i += 1
    return f"{val:.1f} {sizes[i]}"


def sanitize_filename(filename: str) -> str:
    base = os.path.basename(filename)
    return re.sub(r"[^a-zA-Z0-9_.-]", "_", base)


async def get_signed_url_safe(ticket_id: UUID, filename: str, expires_in: int = 3600) -> str:
    """Generate a temporary signed URL from Supabase Storage for direct secure access."""
    storage_path = f"{ticket_id}/{filename}"
    try:
        data = await run_in_threadpool(
            supabase_admin.storage.from_(STORAGE_BUCKET).create_signed_url,
            storage_path,
            expires_in,
        )
        return data.get("signedURL") or data.get("signedUrl") or f"/tickets/{ticket_id}/attachments/{filename}"
    except Exception as exc:
        logger.warning("Could not generate signed URL for %s: %s", storage_path, exc)
        return f"/tickets/{ticket_id}/attachments/{filename}"


async def get_ticket_attachments(ticket_id: UUID, db: AsyncSession) -> list[AttachmentRead]:
    """Retrieve all attachments for a given ticket."""
    attachments: list[AttachmentRead] = []
    try:
        result = await db.execute(select(Attachment).where(Attachment.ticket_id == ticket_id))
        rows = result.scalars().all()
        for r in rows:
            formatted_sz = format_size(r.file_size)
            signed_url = await get_signed_url_safe(ticket_id, r.filename)
            attachments.append(
                AttachmentRead(
                    id=r.id,
                    ticket_id=r.ticket_id,
                    filename=r.filename,
                    name=r.original_filename,
                    url=signed_url,
                    content_type=r.content_type,
                    size=formatted_sz,
                    file_size=r.file_size,
                    size_formatted=formatted_sz,
                    created_at=r.created_at,
                )
            )
    except Exception as exc:
        logger.error("Failed to query attachments for ticket %s: %s", ticket_id, exc)

    return attachments


async def download_attachment_bytes(ticket_id: UUID, filename: str) -> bytes:
    """Download raw attachment bytes from Supabase storage."""
    storage_path = f"{ticket_id}/{filename}"
    return await run_in_threadpool(
        supabase_admin.storage.from_(STORAGE_BUCKET).download,
        storage_path,
    )
