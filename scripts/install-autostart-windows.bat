@echo off
:: Run this ONCE as Administrator to register Vendex to auto-start on Windows login.
:: After running, Vendex will launch automatically every time you log in.

setlocal
set "SCRIPT=%~dp0start-windows.bat"
set "TASK_NAME=VendexAutoStart"

echo.
echo  Installing Vendex auto-start on login...
echo  Script: %SCRIPT%
echo.

:: Delete existing task if present
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: Create task: runs at logon for any user, minimised
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "\"%SCRIPT%\"" ^
  /sc ONLOGON ^
  /rl HIGHEST ^
  /f

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to create scheduled task.
    echo         Make sure you are running this script as Administrator.
    echo         Right-click the file and choose "Run as administrator".
    pause
    exit /b 1
)

echo.
echo  ============================================
echo   Done! Vendex will now start automatically
echo   every time you log into Windows.
echo.
echo   To remove auto-start, run:
echo     schtasks /delete /tn VendexAutoStart /f
echo  ============================================
echo.
pause
