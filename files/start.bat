@echo off
echo.
echo ============================================
echo    PharmaRep HCP CRM - Starting Up
echo ============================================
echo.

echo Setting up Python backend...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt -q
echo Backend dependencies ready.

start "FastAPI Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload --port 8000"
cd ..

echo Setting up React frontend...
cd frontend
if not exist node_modules (
    npm install
)
start "React Frontend" cmd /k "npm start"
cd ..

echo.
echo Both servers are starting in separate windows!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
pause
