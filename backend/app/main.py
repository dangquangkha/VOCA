from fastapi import FastAPI
from backend.app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

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
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def log_requests(request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    host = request.headers.get('host')
    origin = request.headers.get('origin')
    print(f"DEBUG: {request.method} {request.url} [Host: {host}, Origin: {origin}] - Status: {response.status_code}")
    return response

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerPath AI API", "status": "Running"}

# Import all models to register them with SQLAlchemy
from backend.app.db import base

from backend.app.api.v1.api import api_router

app.include_router(api_router, prefix="/api/v1")