@echo off
chcp 65001 >nul
echo ========================================
echo 正在启动台北榮總藥物查詢系統 API...
echo ========================================
echo.
cd /d %~dp0
python app.py
pause

