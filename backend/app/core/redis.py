from redis import asyncio as aioredis
from backend.app.core.config import settings

# Global Redis async client
redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
