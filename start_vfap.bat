@echo off
cd /d %~dp0
echo =============================
echo  VFAP 起動スクリプト
echo =============================
echo.
echo [1/3] git pull...
git pull
echo.
echo [2/3] 仮想環境チェック...
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo 仮想環境なし、システムPythonで起動します
)
echo.
echo [3/3] Streamlit 起動...
streamlit run app.py
pause
