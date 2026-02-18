@echo off
echo Installing requirements...
python -m pip install -r requirements.txt

:ask
set /p continue="Would you like to continue? (y/n): "

cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

