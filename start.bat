@echo off
echo Starting LinguaSphere AI...

start cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload"
start cmd /k "cd frontend && npm run dev"

echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:3000
