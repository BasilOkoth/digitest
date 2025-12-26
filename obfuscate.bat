@echo off
echo ========================================
echo  🛡️  DIGITMATCH PRO - BOT OBFUSCATION
echo ========================================
echo.

echo 📁 Checking project structure...
if not exist "bot.html" (
    echo ❌ ERROR: bot.html not found!
    echo Please place this BAT file in the same folder as bot.html
    pause
    exit /b 1
)

echo 🔍 Checking for Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo 📦 Checking for javascript-obfuscator...
npm list javascript-obfuscator >nul 2>&1
if errorlevel 1 (
    echo 📥 Installing javascript-obfuscator...
    npm install javascript-obfuscator --save-dev
)

echo.
echo 🚀 Running obfuscation...
node obfuscate.js

echo.
echo ✅ Obfuscation complete!
echo 📄 Output: bot-obfuscated.html
echo.

if exist "bot-obfuscated.html" (
    echo 📋 Opening bot-obfuscated.html...
    timeout /t 2 /nobreak >nul
    start "" "bot-obfuscated.html"
) else (
    echo ❌ bot-obfuscated.html was not created!
)

echo.
pause