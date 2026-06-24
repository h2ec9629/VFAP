@echo off
set TARGET=%USERPROFILE%\Desktop\dev\VFAP
set TOKENFILE=%~dp0VFAPtoken.txt

echo =============================
echo  VFAP git pull
echo =============================

if not exist "%TARGET%\.git" (
    echo ERROR: .git not found in %TARGET%
  