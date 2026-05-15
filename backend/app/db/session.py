from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from backend.app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,
    pool_recycle=1800
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)