# Quick Build Script (Skip Type Checking)
# Use this to build the client without strict TypeScript checking
# Useful for quick deployments when you have non-critical type warnings

Write-Host "🔨 Building client (skipping type check)..." -ForegroundColor Cyan

# Build with Vite only (skip tsc)
$env:SKIP_TYPE_CHECK = "true"
npm run build:vite

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Build output is in: client/dist" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Note: Type checking was skipped. Run 'npm run type-check' to see type errors." -ForegroundColor Gray
