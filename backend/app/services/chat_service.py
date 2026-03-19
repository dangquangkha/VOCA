from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.app.models.chat import Message
from backend.app.services.chat_socket import manager
from backend.app.core.config import settings


async def send_system_message(
    sender_id: int,
    receiver_id: int,
    content: str,
):
    """
    Persist a system-generated chat message using a FRESH independent
    database session (avoids re-entrant commit issues with the caller's
    session), then best-effort-push via WebSocket.

    Safe to call BEFORE or AFTER the caller commits its own transaction.
    """
    # Build a standalone session so we never conflict with the caller's
    # transaction (which may already be committed, rolled back, or mid-flight).
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")

    engine = create_async_engine(url, echo=False, pool_size=2, max_overflow=0)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with AsyncSessionLocal() as session:
            message = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content,
                is_read=False,
            )
            session.add(message)
            await session.flush()          # assigns message.id
            await session.commit()
            await session.refresh(message) # loads server-generated created_at

        # Best-effort WebSocket push — receiver may not be connected
        try:
            await manager.send_personal_message(
                {
                    "id": message.id,
                    "sender_id": message.sender_id,
                    "receiver_id": message.receiver_id,
                    "content": message.content,
                    "created_at": message.created_at.isoformat(),
                },
                message.receiver_id,
            )
        except Exception:
            pass  # Not connected — that is fine

        return message

    except Exception as e:
        print(f"WARNING: send_system_message failed: {e}")
        return None
    finally:
        await engine.dispose()
