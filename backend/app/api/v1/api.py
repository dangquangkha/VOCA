from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, users, experts, bookings, roadmap, ai, chat, assessments, payments, admin, conversations, moderation, account_actions, reviews, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(experts.router, prefix="/experts", tags=["experts"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(roadmap.router, prefix="/roadmap", tags=["roadmap"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(conversations.router, prefix="/chat", tags=["chat"])  # Conversations under /chat
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(moderation.router, prefix="/admin/moderation", tags=["moderation"])
api_router.include_router(account_actions.router, prefix="/admin/account-actions", tags=["account-actions"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
