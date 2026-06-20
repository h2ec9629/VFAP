@echo off
cd /d "%~dp0"
set "SGT_BASE_DIR=%USERPROFILE%\OneDrive\work\SGT_cloud"

title SGT Management System

echo ============================================================
echo  SGT Management System - starting up...
echo  Browser will open automatically when ready.
echo  Close this window to stop the server.
echo ============================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python or add it to PATH.
    pause
    exit /b 1
)

python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo First-time setup: installing required packages...
    python -m pip install streamlit openpyxl pandas
)

echo Starting Streamlit server...

:: Start Streamlit in background (minimized window)
start "" /min python -m streamlit run app.py --server.headless true

:: Wait until port 8501 is ready
:wait_loop
timeout /t 1 /nobreak >nul
python -c "import urllib.request; urllib.request.urlopen('http://localhost:8501', timeout=1)" >nul 2>&1
if errorlevel 1 goto wait_loop

echo.
echo  Server ready! Opening browser...
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:8501

echo.
echo ============================================================
echo  App is running. Close this window to stop the server.
echo ============================================================

:: Keep alive loop
:running_loop
timeout /t 5 /nobreak >nul
python -c "import urllib.request; urllib.request.urlopen('http://localhost:8501', timeout=1)" >nul 2>&1
if errorlevel 1 (
    echo Server stopped.
    pause
    exit /b 0
)
goto running_loop
