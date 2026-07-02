@echo off
cd /d "%~dp0"

title VFAP

git --version > nul 2>&1
if errorlevel 1 goto skip_git

if not exist "token\VFAPtoken.txt" goto skip_git
set /p PAT=<token\VFAPtoken.txt

if exist ".git" (
    git remote set-url origin https://h2ec9629:%PAT%@github.com/h2ec9629/VFAP.git
    git pull origin master
) else (
    git clone https://h2ec9629:%PAT%@github.com/h2ec9629/VFAP.git .
)

:skip_git

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python and add to PATH.
    pause
    exit /b 1
)
echo [OK] Python found:
python --version

python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo Installing packages...
    python -m pip install streamlit openpyxl pandas
)

if not exist "app.py" (
    echo [ERROR] app.py not found. Place this bat in the VFAP folder.
    pause
    exit /b 1
)

echo Starting Streamlit...
start "" /min python -m streamlit run app.py --server.headless true

echo Waiting for server...
:wait_loop
timeout /t 1 /nobreak >nul
python -c "import urllib.request; urllib.request.urlopen('http://localhost:8501', timeout=1)" >nul 2>&1
if errorlevel 1 goto wait_loop

echo [OK] Server ready. Opening browser...

set APPURL=http://localhost:8501

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=%APPURL%
    goto end
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=%APPURL%
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

start %APPURL%

:end
echo [OK] Done. Close this window to stop the server.
pause
