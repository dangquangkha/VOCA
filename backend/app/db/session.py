from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from backend.app.core.config import settings

url = settings.DATABASE_URL
if url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    url, 
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,
    pool_recycle=1800
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)