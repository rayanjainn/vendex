import os
import yt_dlp
import asyncio
from typing import Dict, Any
from models.schemas import Platform
from utils.exceptions import DownloadError, LoginRequiredError
from utils.logger import get_logger

logger = get_logger(__name__)

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "./downloads")
INSTAGRAM_COOKIES_FILE = os.getenv("INSTAGRAM_COOKIES_FILE", "./instagram_cookies.txt")
COOKIES_FROM_BROWSER = os.getenv("COOKIES_FROM_BROWSER", "chrome")
FFMPEG_LOCATION = os.getenv("FFMPEG_LOCATION", None)

# Diagnostic log on module load
logger.info(f"Downloader initialized. CWD: {os.getcwd()}")
logger.info(f"FFMPEG_LOCATION from .env: {FFMPEG_LOCATION}")
if FFMPEG_LOCATION:
    bin_path = os.path.join(FFMPEG_LOCATION, "ffmpeg.exe" if os.name == "nt" else "ffmpeg")
    logger.info(f"Checking for FFmpeg at: {bin_path} -> Exists: {os.path.exists(bin_path)}")

def detect_platform(url: str) -> Platform:
    url_lower = url.lower()
    if 'instagram.com' in url_lower:
        return Platform.INSTAGRAM
    elif 'tiktok.com' in url_lower or 'vm.tiktok.com' in url_lower:
        return Platform.TIKTOK
    elif 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return Platform.YOUTUBE
    elif 'facebook.com' in url_lower or 'fb.watch' in url_lower:
        return Platform.FACEBOOK
    return Platform.OTHER

def _download_sync(url: str, job_id: str) -> Dict[str, Any]:
    output_path = f"{DOWNLOAD_DIR}/{job_id}/video.%(ext)s"
    os.makedirs(f"{DOWNLOAD_DIR}/{job_id}", exist_ok=True)

    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_path,
        'socket_timeout': 30,
        'retries': 5,
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'concurrent_fragment_downloads': 5,
        'ffmpeg_location': FFMPEG_LOCATION,
    }

    platform = detect_platform(url)
    logger.info(f"[Job {job_id}] Platform detected: {platform.value}")

    if platform in (Platform.INSTAGRAM, Platform.TIKTOK, Platform.FACEBOOK):
        # Prefer explicit cookie file if it exists
        if INSTAGRAM_COOKIES_FILE and os.path.exists(INSTAGRAM_COOKIES_FILE):
            logger.info(f"[Job {job_id}] Using cookie file: {INSTAGRAM_COOKIES_FILE} (Size: {os.path.getsize(INSTAGRAM_COOKIES_FILE)} bytes)")
            ydl_opts['cookiefile'] = INSTAGRAM_COOKIES_FILE
        else:
            # Fall back to reading cookies directly from the browser
            logger.info(f"[Job {job_id}] No cookie file found at '{INSTAGRAM_COOKIES_FILE}', trying cookies from browser: {COOKIES_FROM_BROWSER}")
            ydl_opts['cookiesfrombrowser'] = (COOKIES_FROM_BROWSER,)

    # Log system PATH and binary availability right before download
    import shutil
    logger.debug(f"[Job {job_id}] System PATH: {os.environ.get('PATH', '')}")
    logger.info(f"[Job {job_id}] which ffmpeg: {shutil.which('ffmpeg')}")
    logger.info(f"[Job {job_id}] ydl_opts: {ydl_opts}")

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logger.info(f"[Job {job_id}] Starting yt-dlp extraction...")
            info = ydl.extract_info(url, download=True)
            video_path = ydl.prepare_filename(info)

            return {
                "video_path": video_path,
                "platform": platform,
                "title": info.get('title', 'Unknown'),
                "duration": info.get('duration', 0),
                "thumbnail_url": info.get('thumbnail', '')
            }
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        logger.error(f"[Job {job_id}] Download failed: {str(e)}")
        if 'login' in error_msg or 'cookie' in error_msg or 'sign in' in error_msg or 'rate-limit' in error_msg or 'not available' in error_msg:
            raise LoginRequiredError(
                "Instagram requires authentication. "
                "Export your cookies by running: "
                "yt-dlp --cookies-from-browser chrome --cookies ./instagram_cookies.txt 'https://www.instagram.com' "
                "then set INSTAGRAM_COOKIES_FILE=./instagram_cookies.txt in backend/.env"
            )
        raise DownloadError(f"Failed to download video: {str(e)}")
    except Exception as e:
        logger.error(f"[Job {job_id}] Unexpected download error: {str(e)}")
        raise DownloadError(f"Unexpected error during download: {str(e)}")

async def download(url: str, job_id: str) -> Dict[str, Any]:
    return await asyncio.to_thread(_download_sync, url, job_id)
