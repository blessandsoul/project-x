# PowerShell Script to Migrate cPanel DB to Local Docker MySQL
# Usage: ./migrate-local.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
Set-Location $ScriptDir

# Configuration
$RemoteHost = "trendingnow.ge"
$RemoteUser = "trending_projectx"
$RemoteDB = "trending_projectx"
$RemotePass = "vAcE0B+q5M-ko~3W"
$DumpFile = "$ScriptDir\cpanel_local_dump.sql"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  MySQL Migration: cPanel -> Local Docker" -ForegroundColor Cyan
Write-Host "=============================================="

# 1. Check Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH."
    exit 1
}
if (!(docker info 2>$null)) {
    Write-Error "Docker Desktop is not running. Please start it first."
    exit 1
}

# 2. Setup Local Docker Environment
if (!(Test-Path ".env")) {
    Write-Host "Creating local .env for Docker..." -ForegroundColor Yellow
    @"
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=trending_projectx
MYSQL_USER=projectx_user
MYSQL_PASSWORD=localdevpass
"@ | Out-File -Encoding utf8 .env
}

# 3. Start Local MySQL
Write-Host "Starting local MySQL container..." -ForegroundColor Green
docker compose up -d

Write-Host "Waiting 40s for MySQL to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

# 4. Dump Remote Database using curl (works on Windows without mysqldump)
Write-Host "`nDownloading database from $RemoteHost..." -ForegroundColor Green
Write-Host "This may take 2-5 minutes depending on database size..." -ForegroundColor Yellow

# Use Docker MySQL client to dump from remote
$env:MYSQL_PWD = $RemotePass
docker run --rm `
    -e MYSQL_PWD=$RemotePass `
    mysql:8.0 `
    mysqldump `
    -h $RemoteHost `
    -u $RemoteUser `
    --single-transaction `
    --column-statistics=0 `
    --default-character-set=utf8mb4 `
    --set-gtid-purged=OFF `
    --routines `
    --triggers `
    --events `
    $RemoteDB | Out-File -Encoding utf8 $DumpFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Dump failed. Check network connection to $RemoteHost"
    exit 1
}

$DumpSize = (Get-Item $DumpFile).Length / 1MB
Write-Host "Dump successful! Size: $("{0:N2}" -f $DumpSize) MB" -ForegroundColor Green

# 5. Import to Local Docker
Write-Host "`nImporting into local Docker MySQL..." -ForegroundColor Green

# Read password from .env
$LocalRootPass = (Get-Content .env | Select-String "MYSQL_ROOT_PASSWORD").ToString().Split('=')[1].Trim()

# Import
Get-Content $DumpFile | docker exec -i projectx-mysql mysql -uroot -p$LocalRootPass trending_projectx

if ($LASTEXITCODE -ne 0) {
    Write-Error "Import failed."
    exit 1
}

# 6. Verify
Write-Host "`nVerifying migration..." -ForegroundColor Green
docker exec projectx-mysql mysql -uroot -p$LocalRootPass trending_projectx -e @"
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'services', COUNT(*) FROM services;
"@

Write-Host "`n=============================================="  -ForegroundColor Green
Write-Host "SUCCESS! Database migrated to local Docker" -ForegroundColor Green
Write-Host "=============================================="
Write-Host "`nUpdate your server\.env with:" -ForegroundColor Cyan
Write-Host "MYSQL_HOST=127.0.0.1" -ForegroundColor Yellow
Write-Host "MYSQL_USER=projectx_user" -ForegroundColor Yellow
Write-Host "MYSQL_PASSWORD=localdevpass" -ForegroundColor Yellow
Write-Host "MYSQL_DATABASE=trending_projectx" -ForegroundColor Yellow
Write-Host "`nThen restart: npm run dev" -ForegroundColor Cyan
Write-Host "=============================================="
