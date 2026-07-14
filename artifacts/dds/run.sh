#!/bin/bash

# Azura Admin Panel - Portable Launcher
# Zero-config script for Linux/macOS

echo "🚀 Azura Admin Panel Launcher"
echo "----------------------------"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Detect Package Manager
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo "❌ No package manager (npm/pnpm) found."
    exit 1
fi

echo "📦 Using $PKG_MANAGER"

# Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    $PKG_MANAGER install
fi

# Check for .env or dynamic config (managed via Firebase/R2)
echo "✅ System check complete."
echo "🌐 Starting server at http://localhost:5173"

# Start the dev server
$PKG_MANAGER run dev
