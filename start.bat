@echo off
chcp 65001 > nul
cd /d "%~dp0"

title VFAP - starting up...

echo ============================================================
echo  VFAP - GitHub最新版を取得中...
echo ============================================================
echo.

REM Gitがなければスキップ
git --version > nul 2>&1
if errorlevel 1 goto skip_git

REM PATを読み込む
if not exist "token\VFAPtoken.txt" goto skip_git
set /p PAT=<token\VFAPtoken.txt

REM .gitがあればpull、なければclone
if exist ".git" (
    echo [git] 最新版を取得中...
    git remote set-url origin https://h2ec9629:%PAT%@github.com/h2ec9629/VFAP.git
    git pull origin master
) else (
    echo [git] 初回セットアップ中...
    git clone https://h2ec9629:%PAT%@github.com/h2ec9629/VFAP.git .
)
echo.

:skip_git

echo ============================================================
echo  VFAP - アプリ起動中...
echo  ブラウザが自動で開きます。
echo  停止するにはこのウィンドウを閉じてください。
echo ============================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python が見つかりません。インストールしてPATHを通してください。
    pause
    exit /b 1
)

python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo 初回セットアップ: パッケージをインストール中...
    python -m pip install streamlit openpyxl pandas
)

echo Streamlit 起動中...
start "" /min python -m streamlit run app.py --server.headless true

:wait_loop
timeout /t 1 /nobreak >nul
python -c "import urllib.request; urllib.request.urlopen('http://localhost:8501', timeout=1)" >nul 2>&1
if errorle