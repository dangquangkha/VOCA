from fastapi import APIRouter
from backend.app.api.v1.endpoints import roadmap, ai, chat, assessments, admin, conversations, moderation, account_actions, reviews, notifications, support, group_sessions
from backend.app.domains.identity import router as identity_router
from backend.app.domains.identity.users_router import router as users_ddd_router  # Task 5: DDD migration
from backend.app.domains.marketplace import router as marketplace_router
from backend.app.domains.booking import router as booking_router
from backend.app.domains.payments import router as payments_router
from backend.app.domains.mbti import router as mbti_router

api_router = APIRouter()

# --- DDD DOMAINS ---
api_router.include_router(mbti_router.router, prefix="/mbti", tags=["mbti"])
api_router.include_router(identity_router.router, prefix="/auth", tags=["auth"])
api_router.include_router(users_ddd_router, prefix="/users", tags=["users"])  # Task 5: migrated from legacy
api_router.include_router(marketplace_router.router, prefix="/experts", tags=["experts"])
api_router.include_router(marketplace_router.router, prefix="/expert", tags=["experts"])
api_router.include_router(booking_router.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(payments_router.router, prefix="/payments", tags=["payments"])
api_router.include_router(group_sessions.router, prefix="/group-sessions", tags=["group-sessions"])

# --- LEGACY (Migration in progress) ---
api_router.include_router(roadmap.router, prefix="/roadmap", tags=["roadmap"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(conversations.router, prefix="/chat", tags=["chat"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(moderation.router, prefix="/admin/moderation", tags=["moderation"])
api_router.include_router(account_actions.router, prefix="/admin/account-actions", tags=["account-actions"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(support.router, prefix="/support", tags=["support"])
