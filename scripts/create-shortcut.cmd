@echo off
:: Creates a desktop shortcut for the AiB IAAS POC launcher
set SCRIPT_DIR=%~dp0
set SHORTCUT=%USERPROFILE%\Desktop\AiB-POC.lnk
set TARGET=%SCRIPT_DIR%dev-start.cmd
set ICON=%SystemRoot%\System32\shell32.dll,21

:: Use PowerShell to create the .lnk file
powershell.exe -ExecutionPolicy Bypass -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT%'); $sc.TargetPath = '%TARGET%'; $sc.WorkingDirectory = '%SCRIPT_DIR%..'; $sc.IconLocation = '%ICON%'; $sc.Description = 'Start AiB IAAS POC (all services + web apps)'; $sc.Save(); Write-Host 'Shortcut created: %SHORTCUT%' -ForegroundColor Green"
