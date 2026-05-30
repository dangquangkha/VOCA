from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.app.core.config import settings
from backend.app.core.limiter import limiter

# ── Logging Configuration ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    """
    Application startup.
    NOTE: Database seeding is NOT run here to avoid slow startups and duplicate data in production.
    To seed MBTI data manually, run: python -m backend.seed_mbti
    """
    pass

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount static files
uploads_dir = os.path.join(os.getcwd(), "backend", "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# CORS Configuration
from fastapi.middleware.cors import CORSMiddleware
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:3001",
    "http://[::1]:3000",
    "http://[::1]:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        logger.debug(
            "%s %s — %d (%.2fms)",
            request.method, request.url.path,
            response.status_code, duration * 1000
        )
        return response
    except Exception as e:
        logger.exception("Unhandled error in middleware/route: %s", request.url)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Credentials": "true",
            }
        )

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerPath AI API", "status": "Running"}

# Import all models to register them with SQLAlchemy
from backend.app.db import base

from backend.app.api.v1.api import api_router

app.include_router(api_router, prefix="/api/v1")