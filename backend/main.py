from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models.database import init_db
from routers import jobs, process, health, suppliers, csv_upload
import os
from utils.logger import get_logger

logger = get_logger(__name__)

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "./downloads")
FRAME_OUTPUT_DIR = os.getenv("FRAME_OUTPUT_DIR", "./frames")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    os.makedirs(FRAME_OUTPUT_DIR, exist_ok=True)
    logger.info("ReelSource backend started")
    yield
    logger.info("ReelSource backend shutting down")

app = FastAPI(
    title="ReelSource API",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health")
async def root_health():
    return {"status": "ok", "message": "ReelSource backend is running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process.router, prefix="/api/v1", tags=["process"])
app.include_router(jobs.router, prefix="/api/v1", tags=["jobs"])
app.include_router(suppliers.router, prefix="/api/v1", tags=["suppliers"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(csv_upload.router, prefix="/api/v1", tags=["csv"])
