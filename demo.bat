@echo off
chcp 65001 >nul 2>&1
title 碳循校园 EcoTrace — 演示服务器

echo.
echo   🌿 碳循校园 EcoTrace — 一键启动演示
echo   ─────────────────────────────────────
echo.

:: 跳转到脚本所在目录（支持从其他位置双击运行）
cd /d "%~dp0"

:: 运行环境检测 + 启动脚本（PowerShell）
powershell -ExecutionPolicy Bypass -NoProfile -File "setup-env.ps1"

if %errorlevel% neq 0 (
    echo.
    echo   启动失败，请查看上方错误信息。
    echo.
    pause
)
