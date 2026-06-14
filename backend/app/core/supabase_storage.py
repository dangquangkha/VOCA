import httpx
import logging
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

async def upload_file_to_supabase(
    bucket: str,
    file_path: str,
    file_content: bytes,
    content_type: str
) -> str:
    """
    Upload file directly to Supabase Storage using standard REST API.
    Returns the public URL of the uploaded file.
    """
    if not settings.SUPABASE_URL or settings.SUPABASE_SERVICE_ROLE_KEY == "placeholder":
        logger.error("Supabase Storage is not configured properly in .env")
        raise ValueError("Supabase storage credentials are not configured.")

    # Remove trailing slash from base url if present
    base_url = settings.SUPABASE_URL.rstrip("/")
    upload_url = f"{base_url}/storage/v1/object/{bucket}/{file_path}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": content_type,
        "x-upsert": "true"  # Allow overwrite if same filename is uploaded
    }

    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Uploading file to Supabase Storage: {upload_url} ({content_type})")
            response = await client.post(upload_url, content=file_content, headers=headers, timeout=30.0)
            
            if response.status_code != 200:
                logger.error(f"Supabase Storage Upload failed: {response.status_code} - {response.text}")
                raise Exception(f"Supabase storage upload failed: {response.text}")
                
            logger.info("File uploaded successfully to Supabase Storage.")
            
            # Construct and return the public URL
            public_url = f"{base_url}/storage/v1/object/public/{bucket}/{file_path}"
            return public_url
            
        except httpx.RequestError as exc:
            logger.error(f"HTTP request error during upload to Supabase: {exc}")
            raise Exception(f"Network error during Supabase upload: {str(exc)}")
