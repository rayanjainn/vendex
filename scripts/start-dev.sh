#!/bin/bash
# Start both services for development
echo "🚀 Starting Vendex..."

# Initialize NVM and use LTS Node
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if command -v nvm >/dev/null 2>&1; then
    echo "🟢 Using Node LTS via NVM..."
    nvm use --lts
else
    echo "⚠️ Warning: NVM not found. Using system Node/npm if available."
fi

# Determine python command
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python not found. Please install Python 3.8+."
    exit 1
fi

# Start Python backend
echo "📦 Preparing backend..."
cd backend || exit 1

# Reset venv if it's broken
if [ ! -d "venv" ]; then
    echo "🏗️ Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated."
else
    echo "❌ Error: Could not find venv/bin/activate."
    exit 1
fi

echo "🔄 Updating pip and base dependencies..."
export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
pip install --upgrade pip setuptools wheel

echo "🔄 Installing requirements..."
if ! pip install -r requirements.txt -v; then
    echo "❌ Error: Dependency installation failed. Please check your internet connection."
    echo "Tip: Try running 'pip install -r requirements.txt' manually in the backend folder."
    exit 1
fi

if ! command -v uvicorn >/dev/null 2>&1; then
    echo "❌ Error: uvicorn not found in path. Re-installing..."
    pip install uvicorn[standard]
fi

echo "🧹 Clearing Python cache..."
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

# Check whether the saved Alibaba session is still valid.
# We inspect the two shortest-lived critical cookies (_m_h5_tk and xlly_s);
# if either is missing or past its Unix timestamp expiry, delete the file so
# Playwright starts fresh instead of replaying a dead session.
SESSION_FILE="alibaba_session.json"
if [ -f "$SESSION_FILE" ]; then
    NOW=$(date +%s)
    # Extract expiry of _m_h5_tk and xlly_s via python (already in the venv)
    VALID=$(python3 - <<'PYEOF'
import json, time, sys, os
f = "alibaba_session.json"
critical = {"_m_h5_tk", "xlly_s"}
try:
    with open(f) as fh:
        cookies = {c["name"]: c for c in json.load(fh).get("cookies", [])}
    now = time.time()
    for name in critical:
        c = cookies.get(name)
        if not c or c.get("expires", -1) <= now:
            print("invalid")
            sys.exit(0)
    print("valid")
except Exception:
    print("invalid")
PYEOF
)
    if [ "$VALID" = "valid" ]; then
        echo "✅ Existing Alibaba session is still valid — reusing it."
    else
        echo "🗑️  Alibaba session has expired or is missing critical cookies — deleting..."
        rm -f "$SESSION_FILE"
        echo "✅ Session cleared — a new session will be created on first scrape."
    fi
else
    echo "ℹ️  No existing Alibaba session found (clean start)."
fi

echo "🔥 Starting FastAPI backend..."
uvicorn main:app --reload --port 3002 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize..."
MAX_TRIES=15
BACKEND_READY=0
for i in $(seq 1 $MAX_TRIES); do
  sleep 1
  if curl -s http://localhost:3002/health >/dev/null 2>&1; then
    BACKEND_READY=1
    break
  fi
done

if [ $BACKEND_READY -eq 0 ]; then
    echo "❌ Error: Backend failed to start after ${MAX_TRIES}s. Check terminal output above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Next.js frontend
echo "🔥 Starting Next.js frontend..."
cd .. || exit 1

if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ Vendex is now running!"
echo "  - Frontend: http://localhost:3001"
echo "  - Backend:  http://localhost:3002"
echo "  - API Docs: http://localhost:3002/docs"
echo ""
echo "Press Ctrl+C to stop both services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM EXIT
wait
