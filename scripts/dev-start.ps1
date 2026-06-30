# AiB IAAS POC - Development Launcher
# Starts all backend services + web & admin apps in one terminal
# Usage: Right-click > Run with PowerShell, or use the desktop shortcut

# Ensure Node.js is on PATH
$env:Path = "C:\Users\macleoda\nodejs\node-v22.16.0-win-x64;$env:Path"

# Set working directory
Set-Location "C:\Users\macleoda\projects\aib-iaas-poc"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AiB IAAS POC - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Web App:    http://localhost:3000" -ForegroundColor Green
Write-Host "  Admin App:  http://localhost:3010" -ForegroundColor Green
Write-Host "  API Gateway: http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Open browser after a delay (background job)
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 8
    Start-Process "http://localhost:3000"
} | Out-Null

# Start all services + apps with concurrently
npx concurrently --kill-others-on-fail `
  --names "mock,gw,rec,doc,orch,pay,audit,credit,org,user,notif,ident,web,admin" `
  --prefix-colors "magenta,blue,green,yellow,cyan,red,white,gray,blueBright,greenBright,yellowBright,cyanBright,redBright,whiteBright" `
  --prefix "[{name}]" `
  "npm run dev -w services/mock-integrations" `
  "npm run dev -w services/api-gateway" `
  "npm run dev -w services/recommendation-service" `
  "npm run dev -w services/document-service" `
  "npm run dev -w services/integration-orchestrator" `
  "npm run dev -w services/payment-service" `
  "npm run dev -w services/audit-service" `
  "npm run dev -w services/credit-check-service" `
  "npm run dev -w services/organisation-service" `
  "npm run dev -w services/user-service" `
  "npm run dev -w services/notification-service" `
  "npm run dev -w services/identity-service" `
  "npm run dev -w apps/web" `
  "npm run dev -w apps/admin"
