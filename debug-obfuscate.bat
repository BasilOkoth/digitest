@echo off
cls
color 0A
title DEBUG Obfuscation
echo ========================================
echo  🔧 DEBUG: Bot Obfuscation Troubleshooter
echo ========================================
echo.

echo 📍 Current Directory: %CD%
echo.

:: Step 1: Check for bot.html
echo [1/6] Checking for bot.html...
if exist "bot.html" (
    echo ✅ FOUND: bot.html exists
    for /f %%i in ('powershell -command "(Get-Item 'bot.html').Length"') do (
        echo    Size: %%i bytes
    )
) else (
    echo ❌ ERROR: bot.html NOT FOUND!
    echo    Looking in: %CD%
    echo    Create bot.html or move BAT file to correct folder
    goto :error
)

:: Step 2: Check Node.js
echo.
echo [2/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js not found!
    echo    Install from: https://nodejs.org/
    goto :error
)
node --version
echo ✅ Node.js OK

:: Step 3: Check npm
echo.
echo [3/6] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm not found!
    goto :error
)
npm --version
echo ✅ npm OK

:: Step 4: Check/Create obfuscate.js
echo.
echo [4/6] Checking obfuscate.js...
if not exist "obfuscate.js" (
    echo ⚠️ obfuscate.js not found, creating simple version...
    
    (
echo const fs = require('fs');
echo const path = require('path');
echo 
echo console.log('=== SIMPLE OBFUSCATION TEST ===');
echo 
echo // Read bot.html
echo const botHtml = fs.readFileSync('bot.html', 'utf8');
echo console.log('Read bot.html:', botHtml.length, 'characters');
echo 
echo // Simple clean
echo let cleanedHtml = botHtml
echo     .replace(/<script[^>]*src=["']#["'][^>]*><\/script>/gi, '')
echo     .replace(/<link[^>]*href=["']#["'][^>]*>/gi, '');
echo 
echo // Add resources
echo cleanedHtml = cleanedHtml.replace('</title>', '</title>
echo     <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
echo     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
echo     <style>');
echo 
echo // Write output
echo fs.writeFileSync('bot-obfuscated.html', cleanedHtml, 'utf8');
echo console.log('✅ Written to bot-obfuscated.html');
    ) > obfuscate.js
    
    echo ✅ Created simple obfuscate.js
) else (
    echo ✅ Found existing obfuscate.js
    for /f %%i in ('powershell -command "(Get-Item 'obfuscate.js').Length"') do (
        echo    Size: %%i bytes
    )
)

:: Step 5: Install javascript-obfuscator
echo.
echo [5/6] Installing javascript-obfuscator...
echo Installing package (this may take a moment)...
npm install javascript-obfuscator --save-dev > npm-install.log 2>&1
if errorlevel 1 (
    echo ⚠️ Package install had issues, checking if already installed...
    npm list javascript-obfuscator >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to install javascript-obfuscator
        echo    Check npm-install.log for details
        goto :error
    ) else (
        echo ✅ Package already installed
    )
) else (
    echo ✅ Package installed successfully
)

:: Step 6: Run obfuscation
echo.
echo [6/6] Running obfuscation...
echo ============================
node obfuscate.js
echo ============================

:: Check result
echo.
echo 📊 RESULTS:
echo ----------
if exist "bot-obfuscated.html" (
    echo ✅ SUCCESS: bot-obfuscated.html created!
    for /f %%i in ('powershell -command "(Get-Item 'bot-obfuscated.html').Length"') do (
        echo    Size: %%i bytes
    )
    
    echo.
    echo 🚀 What would you like to do?
    echo   1. Open in browser
    echo   2. Open in Notepad
    echo   3. View folder
    echo   4. Exit
    echo.
    choice /C 1234 /M "Select option"
    
    if errorlevel 4 goto :exit
    if errorlevel 3 (
        explorer .
        goto :exit
    )
    if errorlevel 2 (
        notepad "bot-obfuscated.html"
        goto :exit
    )
    if errorlevel 1 (
        start "" "bot-obfuscated.html"
        goto :exit
    )
) else (
    echo ❌ FAILED: bot-obfuscated.html was not created!
    echo.
    echo 🔍 Check for errors above
    echo 📁 Check if node_modules folder exists
    goto :error
)

:error
echo.
echo ⚠️  TROUBLESHOOTING STEPS:
echo   1. Make sure Node.js is installed (nodejs.org)
echo   2. Check if you have internet connection
echo   3. Run as Administrator if needed
echo   4. Check if antivirus is blocking Node.js
echo.
pause
exit /b 1

:exit
echo.
echo ✅ Debug complete!
pause