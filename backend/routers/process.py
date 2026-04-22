import uuid
import time
import os
import re
import shutil
import asyncio
import hmac
import hashlib
import json as _json
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from models.schemas import JobCreate, ProcessResponse, Platform, JobStatus
from pydantic import BaseModel
from utils.auth import require_admin
from models.database import save_job, update_job, save_supplier, update_csv_row
from services.downloader import download
from services.frame_extractor import extract_best_frames
from services.playwright_client import search_alibaba_with_playwright, scrape_product_url
from utils.logger import get_logger


def _is_product_url(url: str) -> bool:
    """Return True if the URL is a direct Alibaba product page (not a reel/video)."""
    return bool(re.search(
        r"alibaba\.com/.*(product-detail|offer-detail|[0-9]{10,}\.html)",
        url,
        re.IGNORECASE,
    ))

logger = get_logger(__name__)
router = APIRouter()

NEXTJS_WEBHOOK_URL = os.getenv("NEXTJS_WEBHOOK_URL")
NEXTJS_WEBHOOK_SECRET = os.getenv("NEXTJS_WEBHOOK_SECRET")

async def notify_nextjs(job_id: str, status: str):
    if not NEXTJS_WEBHOOK_URL or not NEXTJS_WEBHOOK_SECRET:
        return
    try:
        payload = _json.dumps({"job_id": job_id, "status": status}).encode()
        signature = hmac.new(
            NEXTJS_WEBHOOK_SECRET.encode(), payload, hashlib.sha256
        ).hexdigest()
        async with httpx.AsyncClient() as client:
            await client.post(
                NEXTJS_WEBHOOK_URL,
                content=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-webhook-signature": f"sha256={signature}",
                },
                timeout=5.0,
            )
    except Exception as e:
        logger.error(f"Webhook to Next.js failed: {e}")

async def run_pipeline(job_id: str, reel_url: str, label: str = "", csv_row_id: str = ""):
    stages = []
    detailed_logs = []
    pipeline_start = time.time()

    def log_event(stage, msg, data=None):
        detailed_logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": stage,
            "message": msg,
            "data": data
        })

    async def flush_logs():
        await update_job(job_id, {"detailed_logs": detailed_logs})

    detected_product = ""  # filled in by Gemini frame analysis for reel jobs
    try:
        is_product = _is_product_url(reel_url)

        # Seed all stages as "pending" immediately so the frontend can show the full roadmap
        pending_stages = [
            {"stage": "download",    "status": "pending", "message": "Waiting", "duration_ms": None, "timestamp": ""},
            {"stage": "extract",     "status": "pending", "message": "Waiting", "duration_ms": None, "timestamp": ""},
            {"stage": "search",      "status": "pending", "message": "Waiting", "duration_ms": None, "timestamp": ""},
            {"stage": "normalizing", "status": "pending", "message": "Waiting", "duration_ms": None, "timestamp": ""},
        ]
        await update_job(job_id, {"pipeline_stages": pending_stages})

        if is_product:
            await update_job(job_id, {"status": JobStatus.SEARCHING.value, "progress_percent": 30})
            log_event("search", "Direct product URL — scraping page", {"url": reel_url})

            t0 = time.time()
            suppliers = await scrape_product_url(reel_url, job_id)
            sc_ms = int((time.time() - t0) * 1000)
            log_event("search", f"Scraped {len(suppliers)} product(s)")

            stages += [
                {"stage": "download", "status": "done", "message": "Direct URL (skipped)", "duration_ms": 0, "timestamp": datetime.now(timezone.utc).isoformat()},
                {"stage": "extract",  "status": "done", "message": "Direct URL (skipped)", "duration_ms": 0, "timestamp": datetime.now(timezone.utc).isoformat()},
                {"stage": "search",   "status": "done", "message": f"Scraped {len(suppliers)} product(s)", "duration_ms": sc_ms, "timestamp": datetime.now(timezone.utc).isoformat()},
            ]
            await update_job(job_id, {"pipeline_stages": stages, "detailed_logs": detailed_logs})

        else:
            def _make_stages(done: list[dict], running_key: str, msg: str) -> list[dict]:
                """Return full stage list: done stages + current running + remaining pending."""
                order = ["download", "extract", "search", "normalizing"]
                result = list(done)
                for key in order[len(done):]:
                    if key == running_key:
                        result.append({"stage": key, "status": "running", "message": msg, "duration_ms": None, "timestamp": datetime.now(timezone.utc).isoformat()})
                    else:
                        result.append({"stage": key, "status": "pending", "message": "Waiting", "duration_ms": None, "timestamp": ""})
                return result

            # ── DOWNLOADING ───────────────────────────────────────────────────
            t0 = time.time()
            await update_job(job_id, {"status": JobStatus.DOWNLOADING.value, "progress_percent": 10,
                                      "pipeline_stages": _make_stages([], "download", f"Downloading reel…")})
            log_event("download", f"Downloading {reel_url}")
            await flush_logs()
            video_info = await download(reel_url, job_id)
            video_path = video_info["video_path"]
            dl_ms = int((time.time() - t0) * 1000)
            log_event("download", "Download complete", video_info)
            stages.append({"stage": "download", "status": "done", "message": "Video downloaded", "duration_ms": dl_ms, "timestamp": datetime.now(timezone.utc).isoformat()})
            await update_job(job_id, {"pipeline_stages": _make_stages(stages, "extract", "Waiting…"), "detailed_logs": detailed_logs})

            # ── EXTRACTING FRAMES ─────────────────────────────────────────────
            t0 = time.time()
            await update_job(job_id, {"status": JobStatus.EXTRACTING.value, "progress_percent": 35,
                                      "pipeline_stages": _make_stages(stages, "extract", "Extracting best frames…")})
            log_event("extract", "Extracting frames")
            await flush_logs()
            frames, detected_product = await extract_best_frames(video_path, job_id)
            if not frames:
                raise Exception("No valid frames extracted from video")
            ex_ms = int((time.time() - t0) * 1000)
            if detected_product:
                log_event("extract", f"Extracted {len(frames)} frames — product identified: {detected_product}")
            else:
                log_event("extract", f"Extracted {len(frames)} frames")
            stages.append({"stage": "extract", "status": "done", "message": f"{len(frames)} frames extracted", "duration_ms": ex_ms, "timestamp": datetime.now(timezone.utc).isoformat()})
            await update_job(job_id, {"pipeline_stages": _make_stages(stages, "search", "Waiting…"), "detailed_logs": detailed_logs})

            # ── SEARCHING SUPPLIERS ───────────────────────────────────────────
            t0 = time.time()
            await update_job(job_id, {"status": JobStatus.SEARCHING.value, "progress_percent": 55,
                                      "pipeline_stages": _make_stages(stages, "search", "Searching Alibaba…")})
            log_event("search", "Starting Alibaba image search")
            await flush_logs()

            async def _live_log(stage, msg, data=None):
                log_event(stage, msg, data)
                await flush_logs()

            suppliers = await search_alibaba_with_playwright(frames[0].path, job_id, log_cb=_live_log)
            sc_ms = int((time.time() - t0) * 1000)
            log_event("search", f"Found {len(suppliers)} products")
            stages.append({"stage": "search", "status": "done", "message": f"Found {len(suppliers)} suppliers", "duration_ms": sc_ms, "timestamp": datetime.now(timezone.utc).isoformat()})
            await update_job(job_id, {"pipeline_stages": stages, "detailed_logs": detailed_logs})

        # ── NORMALIZING ───────────────────────────────────────────────────────
        await update_job(job_id, {"status": JobStatus.NORMALIZING.value, "progress_percent": 90})
        log_event("normalize", "Saving to database")
        
        # Retry logic for DB saves (handling Neon connection drops)
        max_retries = 3
        for attempt in range(max_retries):
            try:
                for supplier in suppliers:
                    await save_supplier(supplier.model_dump())
                break # Success
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                logger.warning(f"DB Save attempt {attempt + 1} failed, retrying in 2s... Error: {e}")
                await asyncio.sleep(2)

        stages.append({"stage": "normalizing", "status": "done", "message": f"Saved {len(suppliers)} suppliers", "duration_ms": 0, "timestamp": datetime.now(timezone.utc).isoformat()})

        # ── COMPLETE ──────────────────────────────────────────────────────────
        total_seconds = round(time.time() - pipeline_start, 1)
        log_event("pipeline", f"Completed in {total_seconds}s")
        detected_name = suppliers[0].product_name if suppliers else (detected_product or label or "Product from reel")

        await update_job(job_id, {
            "status": JobStatus.COMPLETE.value,
            "extracted_frame_url": "",
            "detected_product_name": detected_name,
            "detected_keywords": [],
            "result_count": len(suppliers),
            "progress_percent": 100,
            "pipeline_stages": stages,
            "detailed_logs": detailed_logs,
            "duration_seconds": total_seconds,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

        # Mark the CSV row as done
        if csv_row_id:
            await update_csv_row(csv_row_id, {"status": "done", "job_id": job_id})

        await notify_nextjs(job_id, "complete")

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        log_event("pipeline", "Job failed", {"error": str(e)})
        total_seconds = round(time.time() - pipeline_start, 1)
        await update_job(job_id, {
            "status": JobStatus.FAILED.value,
            "error_message": str(e),
            "detailed_logs": detailed_logs,
            "duration_seconds": total_seconds,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        if csv_row_id:
            await update_csv_row(csv_row_id, {"status": "failed"})
        await notify_nextjs(job_id, "failed")
    finally:
        shutil.rmtree(f"./downloads/{job_id}", ignore_errors=True)


@router.post("/process", response_model=ProcessResponse)
async def process_job(payload: JobCreate, _admin: str = Depends(require_admin)):
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    job_data = {
        "id": job_id,
        "reel_url": str(payload.reel_url),
        "platform": payload.platform.value if payload.platform else Platform.OTHER.value,
        "status": JobStatus.PENDING.value,
        "created_at": now,
        "updated_at": now,
        "progress_percent": 0,
        "pipeline_stages": [],
        "detected_keywords": []
    }

    await save_job(job_data)
    asyncio.create_task(run_pipeline(job_id, str(payload.reel_url)))
    return {"job_id": job_id, "status": "queued", "message": "Pipeline processing started"}


class BatchItem(BaseModel):
    url: str
    label: str = ""
    csv_row_id: str = ""

class BatchJobCreateV2(BaseModel):
    items: list[BatchItem]

# Best batch size is 2: each job uses 10 parallel browser tabs (= 10 Alibaba connections).
# 2 jobs = 20 simultaneous connections — pushing the limit but manageable.
# 3+ jobs = 30+ connections = mass CAPTCHAs on every tab, making things slower not faster.
batch_semaphore = asyncio.Semaphore(int(os.getenv("MAX_CONCURRENT_JOBS", "2")))

async def _bounded_run(job_id: str, url: str, label: str, csv_row_id: str):
    async with batch_semaphore:
        await run_pipeline(job_id, url, label, csv_row_id)

@router.post("/process/batch")
async def process_batch(payload: BatchJobCreateV2, _admin: str = Depends(require_admin)):
    # FastAPI BackgroundTasks runs tasks sequentially — use asyncio.create_task
    # so all jobs are scheduled onto the event loop immediately and run in parallel
    # (bounded by batch_semaphore).
    job_ids = []
    now = datetime.now(timezone.utc).isoformat()

    for item in payload.items:
        job_id = f"job_{uuid.uuid4().hex[:8]}"
        job_data = {
            "id": job_id,
            "reel_url": item.url,
            "platform": Platform.OTHER.value,
            "status": JobStatus.PENDING.value,
            "created_at": now,
            "updated_at": now,
            "progress_percent": 0,
            "pipeline_stages": [],
            "detected_keywords": [],
            "label": item.label,
            "csv_row_id": item.csv_row_id,
        }
        await save_job(job_data)
        job_ids.append({"job_id": job_id, "csv_row_id": item.csv_row_id})
        asyncio.create_task(_bounded_run(job_id, item.url, item.label, item.csv_row_id))

    return {"jobs": job_ids}
