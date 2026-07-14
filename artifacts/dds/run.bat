@echo off
title Azura Admin Panel Launcher
echo 🚀 Azura Admin Panel Launcher
echo ----------------------------

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b
)

:: Detect Package Manager
set PKG_MANAGER=npm
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    set PKG_MANAGER=pnpm
)

echo 📦 Using %PKG_MANAGER%

:: Install dependencies if node_modules missing
if not exist "node_modules\" (
    echo 📥 Installing dependencies...
    call %PKG_MANAGER% install
)

echo ✅ System check complete.
echo 🌐 Starting server at http://localhost:5173

:: Start the dev server
call %PKG_MANAGER% run dev
pause
