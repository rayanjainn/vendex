import json
import asyncio
import shutil
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from models.database import get_all_jobs, get_job, delete_job_with_suppliers

router = APIRouter()

@router.get("/jobs")
async def read_jobs(status: str = None, limit: int = 50, offset: int = 0):
    jobs = await get_all_jobs(status, limit, offset)
    return jobs

@router.get("/jobs/{job_id}")
async def read_job(job_id: str):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/jobs/{job_id}/stream")
async def job_stream(job_id: str, request: Request):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    async def event_generator():
        last_status = None
        last_log_count = 0
        while True:
            if await request.is_disconnected():
                break
                
            job_data = await get_job(job_id)
            if not job_data:
                break
            
            # Check for ANY changes (status or new logs)
            current_log_count = len(job_data.get("detailedLogs", []))
            if job_data["status"] != last_status or current_log_count != last_log_count:
                last_status = job_data["status"]
                last_log_count = current_log_count
                yield f"data: {json.dumps(job_data)}\n\n"
                
            if job_data["status"] in ("complete", "failed"):
                break
                
            yield "event: ping\ndata: {}\n\n"
            await asyncio.sleep(1.5)
            
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
    )

@router.delete("/jobs/{job_id}")
async def delete_job_endpoint(job_id: str):
    await delete_job_with_suppliers(job_id)
    try:
        shutil.rmtree(f"./downloads/{job_id}", ignore_errors=True)
        shutil.rmtree(f"./frames/{job_id}", ignore_errors=True)
    except:
        pass
    return {"message": "Job deleted"}
