@echo off
setlocal EnableDelayedExpansion
title Vendex

echo.
echo  ============================================
echo   Vendex - Starting up...
echo  ============================================
echo.

:: ── Paths ─────────────────────────────────────────────────────────────────
set "ROOT=%~dp0.."
set "BACKEND=%ROOT%\backend"
set "VENV=%BACKEND%\venv"
set "VENV_PYTHON=%VENV%\Scripts\python.exe"
set "VENV_PIP=%VENV%\Scripts\pip.exe"
set "UVICORN=%VENV%\Scripts\uvicorn.exe"

:: ── Load .env ──────────────────────────────────────────────────────────────
if exist "%ROOT%\.env" (
    for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT%\.env") do (
        set "%%A=%%B"
    )
    echo [OK] Loaded .env
) else (
    echo [WARN] No .env file found at project root. DATABASE_URL and other vars may be missing.
    echo        Copy .env.example to .env and fill in your values.
)

:: ── Check Python ───────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org and add to PATH.
    pause
    exit /b 1
)

:: ── Create venv if missing ────────────────────────────────────────────────
if not exist "%VENV_PYTHON%" (
    echo [INFO] Creating Python virtual environment...
    python -m venv "%VENV%"
    if errorlevel 1 (
        echo [ERROR] Failed to create venv.
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created.
)

:: ── Install / update dependencies ────────────────────────────────────────
echo [INFO] Installing Python dependencies...
"%VENV_PIP%" install --upgrade pip --quiet
"%VENV_PIP%" install -r "%BACKEND%\requirements.txt" --quiet
if errorlevel 1 (
    echo [ERROR] pip install failed. Check your internet connection.
    pause
    exit /b 1
)
echo [OK] Python dependencies ready.

:: ── Clear .pyc cache ──────────────────────────────────────────────────────
echo [INFO] Clearing Python cache...
for /r "%BACKEND%" %%f in (*.pyc) do del "%%f" 2>nul
for /d /r "%BACKEND%" %%d in (__pycache__) do rd /s /q "%%d" 2>nul

:: ── Check Alibaba session validity ────────────────────────────────────────
:: Inspect the two shortest-lived critical cookies (_m_h5_tk and xlly_s).
:: If either is missing or past its Unix expiry timestamp, delete the file so
:: Playwright starts fresh rather than replaying a dead session.
if exist "%BACKEND%\alibaba_session.json" (
    cd /d "%BACKEND%"
    "%VENV_PYTHON%" -c "import json,time,sys; f='alibaba_session.json'; critical={'_m_h5_tk','xlly_s'}; cookies={c['name']:c for c in json.load(open(f)).get('cookies',[])}; now=time.time(); bad=[n for n in critical if not cookies.get(n) or cookies[n].get('expires',-1)<=now]; sys.exit(1 if bad else 0)" >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Alibaba session has expired or is missing critical cookies - deleting...
        del /f /q "%BACKEND%\alibaba_session.json"
        echo [OK] Session cleared - a new session will be created on first scrape.
    ) else (
        echo [OK] Existing Alibaba session is still valid - reusing it.
    )
) else (
    echo [INFO] No existing Alibaba session found - clean start.
)

:: ── Check Node ────────────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: ── Check FFmpeg ───────────────────────────────────────────
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] FFmpeg not found in PATH.
    echo        If you just installed it, RESTART your terminal.
    echo        If you haven't installed it, run: winget install ffmpeg
    pause
    exit /b 1
)

:: ── Install frontend deps if missing ─────────────────────────────────────
if not exist "%ROOT%\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%ROOT%"
    npm install --silent
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies ready.
)

:: ── Build frontend (Production) ──────────────────────────────────────────
echo [INFO] Building frontend for production...
cd /d "%ROOT%"
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
echo [OK] Production build complete.

:: ── Clean up existing processes ──────────────────────────────────────────
echo [INFO] Cleaning up existing processes on ports 3001 and 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: ── Start backend ─────────────────────────────────────────────────────────
echo [INFO] Starting FastAPI backend (Hidden)...
cd /d "%BACKEND%"
echo CreateObject("Wscript.Shell").Run "cmd /c ""%UVICORN%"" main:app --reload --port 3002 > vendex-backend.log 2>&1", 0, False > launch_backend.vbs
wscript.exe launch_backend.vbs
del launch_backend.vbs

:: Wait for backend to be healthy (poll up to 30s)
set /a tries=0
:wait_backend
set /a tries+=1
if %tries% gtr 30 (
    echo [ERROR] Backend did not start after 30s. Check vendex-backend.log
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
curl -sf http://localhost:3002/health >nul 2>&1
if errorlevel 1 goto wait_backend
echo [OK] Backend is up.

:: ── Start frontend ────────────────────────────────────────────────────────
echo [INFO] Starting Next.js production server (Hidden)...
cd /d "%ROOT%"
echo CreateObject("Wscript.Shell").Run "cmd /c npm run start > vendex-frontend.log 2>&1", 0, False > launch_frontend.vbs
wscript.exe launch_frontend.vbs
del launch_frontend.vbs

:: Wait for frontend
set /a tries=0
:wait_frontend
set /a tries+=1
if %tries% gtr 40 (
    echo [WARN] Frontend took too long. It may still be starting.
    goto open_browser
)
timeout /t 1 /nobreak >nul
curl -sf http://localhost:3001 >nul 2>&1
if errorlevel 1 goto wait_frontend

:open_browser
echo.
echo  ============================================
echo   Vendex is running!
echo   Frontend : http://localhost:3001
echo   Backend  : http://localhost:3002
echo   API docs : http://localhost:3002/docs
echo  ============================================
echo.

:: Open browser automatically
start "" "http://localhost:3001"

echo  Both servers are running in minimised windows.
echo  Close this window to keep them running in the background.
echo  To stop everything, close the "Vendex Backend" and "Vendex Frontend" windows.
echo.
pause
