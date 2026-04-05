#!/bin/bash
# Start both services for development
echo "🚀 Starting Vendex..."

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
pip install --upgrade pip setuptools wheel -q

echo "🔄 Installing requirements..."
if ! pip install -r requirements.txt -q; then
    echo "❌ Error: Dependency installation failed. Please check your internet connection."
    echo "Tip: Try running 'pip install -r requirements.txt' manually in the backend folder."
    exit 1
fi

if ! command -v uvicorn >/dev/null 2>&1; then
    echo "❌ Error: uvicorn not found in path. Re-installing..."
    pip install uvicorn[standard] -q
fi

echo "🧹 Clearing Python cache..."
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

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
