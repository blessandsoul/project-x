# Simple migration using WSL or manual steps
# Since Docker networking on Windows has limitations, here are manual steps:

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Manual Migration Steps" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host ""
Write-Host "Option 1: Use WSL (if installed)" -ForegroundColor Green
Write-Host "  wsl" -ForegroundColor Yellow
Write-Host "  mysqldump -h trendingnow.ge -u trending_projectx -p trending_projectx > /mnt/c/temp/dump.sql" -ForegroundColor Yellow
Write-Host "  # Enter password: vAcE0B+q5M-ko~3W" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 2: Download MySQL Client" -ForegroundColor Green
Write-Host "  1. Download from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
Write-Host "  2. Extract and add to PATH" -ForegroundColor Yellow
Write-Host "  3. Run: mysqldump -h trendingnow.ge -u trending_projectx -p trending_projectx > dump.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 3: Use phpMyAdmin on cPanel" -ForegroundColor Green
Write-Host "  1. Login to cPanel" -ForegroundColor Yellow
Write-Host "  2. Go to phpMyAdmin" -ForegroundColor Yellow
Write-Host "  3. Select 'trending_projectx' database" -ForegroundColor Yellow
Write-Host "  4. Click 'Export' tab" -ForegroundColor Yellow
Write-Host "  5. Choose 'Quick' export method" -ForegroundColor Yellow
Write-Host "  6. Download the .sql file" -ForegroundColor Yellow
Write-Host "  7. Save it as: $PSScriptRoot\cpanel_local_dump.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "After you have the dump file, run:" -ForegroundColor Cyan
Write-Host "  .\import-only.ps1" -ForegroundColor Yellow
