@echo off
REM EduIA - sobe a API e abre o painel para a apresentacao
cd /d "%~dp0backend"
if exist ".venv\Scripts\activate.bat" call ".venv\Scripts\activate.bat"
if not exist "modelo\artefatos\modelo_rf.pkl" (
  echo Modelo nao encontrado. Treinando pela primeira vez...
  python modelo\treinar.py
)
start "EduIA API" cmd /k "uvicorn api.api:app --port 8000"
timeout /t 5 /nobreak >nul
start "" "%~dp0frontend\index.html"
start "" "http://localhost:8000/docs"
