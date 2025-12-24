# Import-only script - run this after you have the dump file
# Usage: ./import-only.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
Set-Location $ScriptDir

$DumpFile = "$ScriptDir\cpanel_local_dump.sql"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Importing Database to Local Docker" -ForegroundColor Cyan
Write-Host "=============================================="

# Check if dump file exists
if (!(Test-Path $DumpFile)) {
    Write-Error "Dump file not found: $DumpFile"
    Write-Host "Please download the database dump first. See manual-steps.ps1" -ForegroundColor Yellow
    exit 1
}

$DumpSize = (Get-Item $DumpFile).Length / 1MB
Write-Host "Found dump file: $("{0:N2}" -f $DumpSize) MB" -ForegroundColor Green

# Setup .env if not exists
if (!(Test-Path ".env")) {
    Write-Host "Creating .env..." -ForegroundColor Yellow
    @"
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=trending_projectx
MYSQL_USER=projectx_user
MYSQL_PASSWORD=localdevpass
"@ | Out-File -Encoding utf8 .env
}

# Start Docker
Write-Host "Starting Docker containers..." -ForegroundColor Green
docker compose up -d

Write-Host "Waiting 40s for MySQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

# Import
Write-Host "Importing database..." -ForegroundColor Green
Get-Content $DumpFile | docker exec -i projectx-mysql mysql -uroot -proot trending_projectx

if ($LASTEXITCODE -ne 0) {
    Write-Error "Import failed"
    exit 1
}

# Verify
Write-Host "`nVerifying..." -ForegroundColor Green
docker exec projectx-mysql mysql -uroot -proot trending_projectx -e @"
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'services', COUNT(*) FROM services;
"@

Write-Host "`n=============================================="  -ForegroundColor Green
Write-Host "SUCCESS! Update server\.env with:" -ForegroundColor Green
Write-Host "=============================================="
Write-Host "MYSQL_HOST=127.0.0.1" -ForegroundColor Yellow
Write-Host "MYSQL_USER=projectx_user" -ForegroundColor Yellow
Write-Host "MYSQL_PASSWORD=localdevpass" -ForegroundColor Yellow
Write-Host "MYSQL_DATABASE=trending_projectx" -ForegroundColor Yellow
Write-Host "=============================================="
