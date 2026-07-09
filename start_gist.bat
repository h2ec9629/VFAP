@echo off
chcp 65001 >nul
cd /d "%~dp0"
title VFAP_gist (Gist doukibann :8511)

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python and add to PATH.
    pause
    exit /b 1
)

python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo Installing packages...
    python -m pip install streamlit openpyxl pandas
)

if not exist "app.py" (
    echo [ERROR] app.py not found.
    pause
    exit /b 1
)

echo Starting Streamlit (VFAP_gist) on port 8511 ...
start "" /min python -m streamlit run app.py --server.port 8511 --server.headless true

echo Waiting for server...
:wait_loop
timeout /t 1 /nobreak >nul
python -c "import urllib.request; urllib.request.urlopen('http://localhost:8511', timeout=1)" >nul 2>&1
if errorlevel 1 goto wait_loop

echo [OK] Server ready. Opening browser...
set APPURL=http://localhost:8511

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=%APPURL%
    goto end
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=%APPURL%
    goto end
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=%APPURL%
    goto end
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=%APPURL%
    goto end
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=%APPURL%
    goto end
)
echo [WARNING] Chrome/Edge not found. Opening in default browser (address bar will show).
start %APPURL%

:end
echo [OK] Done. Close this window to stop the server.
pause
