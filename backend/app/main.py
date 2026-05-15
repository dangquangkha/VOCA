from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.app.core.config import settings
from backend.app.core.limiter import limiter

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    try:
        from backend.seed_mbti import seed_mbti
        await seed_mbti()
        print("MBTI Seeding triggered on startup")
    except Exception as e:
        print(f"MBTI Seeding failed: {e}")

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
        host = request.headers.get('host')
        origin = request.headers.get('origin')
        print(f"DEBUG: {request.method} {request.url} [Host: {host}, Origin: {origin}] - Status: {response.status_code}")
        return response
    except Exception as e:
        print(f"CRITICAL ERROR in middleware or route: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)},
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