@echo off
cd /d %~dp0
echo === git pull ===
git pull
echo.
echo === streamlit run ===
streamlit run app.py
pause
