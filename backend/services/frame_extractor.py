import os
import cv2
import numpy as np
import asyncio
from typing import List
from models.schemas import BaseModel
from utils.logger import get_logger

logger = get_logger(__name__)

FRAME_OUTPUT_DIR = os.getenv("FRAME_OUTPUT_DIR", "./frames")

class FrameResult(BaseModel):
    path: str
    score: float
    frame_index: int
    timestamp_seconds: float

def score_frame(frame: np.ndarray) -> float:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    laplacian_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    sharpness = min(laplacian_score / 500.0, 1.0)

    mean_brightness = gray.mean()
    brightness = 1.0 - abs(mean_brightness - 135) / 135.0
    brightness = max(0.0, brightness)

    h, w = frame.shape[:2]
    center = frame[h//4:3*h//4, w//4:3*w//4]
    center_contrast = cv2.Laplacian(
        cv2.cvtColor(center, cv2.COLOR_BGR2GRAY), cv2.CV_64F
    ).var()
    center_score = min(center_contrast / 300.0, 1.0)

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    saturation = hsv[:,:,1].mean() / 255.0

    top_region = gray[:int(h*0.15), :]
    edge_density = cv2.Canny(top_region, 100, 200).mean() / 255.0
    text_penalty = max(0.0, 1.0 - edge_density * 5)

    score = (
        0.35 * sharpness +
        0.20 * brightness +
        0.20 * center_score +
        0.10 * saturation +
        0.15 * text_penalty
    )
    return score

def _extract_sync(video_path: str, job_id: str, top_n: int) -> List[FrameResult]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
        
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    start_frame = int(total_frames * 0.1)
    end_frame = int(total_frames * 0.9)
    step = max(int(fps * 0.5), 1)
    
    samples = list(range(start_frame, end_frame, step))
    if len(samples) > 120:
        samples = samples[:120]
        
    results = []
    
    for frame_idx in samples:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue
            
        score = score_frame(frame)
        results.append((score, frame_idx, frame))
        
    cap.release()
    
    results.sort(key=lambda x: x[0], reverse=True)
    top_results = results[:top_n]
    
    output_dir = os.path.join(FRAME_OUTPUT_DIR, job_id)
    os.makedirs(output_dir, exist_ok=True)
    
    final_frames = []
    for rank, (score, frame_idx, frame) in enumerate(top_results):
        path = os.path.join(output_dir, f"frame_{rank}.jpg")
        cv2.imwrite(path, frame)
        timestamp = frame_idx / fps
        final_frames.append(FrameResult(
            path=path,
            score=score,
            frame_index=frame_idx,
            timestamp_seconds=timestamp
        ))
        
    return final_frames

async def extract_best_frames(video_path: str, job_id: str, top_n: int = 3) -> List[FrameResult]:
    return await asyncio.to_thread(_extract_sync, video_path, job_id, top_n)
