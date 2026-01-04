# Deploy Client to Server
# This script builds the client and copies it to the server's public folder

Write-Host "🔨 Building client..." -ForegroundColor Cyan

# Navigate to client directory and build
Set-Location -Path "client"
npm run build:skip-check

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client build failed!" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

Write-Host "✅ Client built successfully!" -ForegroundColor Green

# Navigate back to root
Set-Location -Path ".."

Write-Host "📦 Deploying to server/public..." -ForegroundColor Cyan

# Remove old files from public folder (except .gitkeep if exists)
if (Test-Path "server\public\*") {
    Remove-Item -Path "server\public\*" -Recurse -Force -Exclude ".gitkeep"
}

# Copy new build to public folder
Copy-Item -Path "client\dist\*" -Destination "server\public\" -Recurse -Force

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your client is now available at:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📡 API endpoints are at:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000/api/v1/*" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Make sure your server is running with 'npm run dev'" -ForegroundColor Gray
