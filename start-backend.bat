@echo off
echo Starting Hercules Gym Backend...
cd backend
call ..\.venv\Scripts\activate
python -m uvicorn server:app --host 127.0.0.1 --port 8001
