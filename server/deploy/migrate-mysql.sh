#!/bin/bash
# =============================================================================
# MySQL Migration Script: cPanel → Docker
# =============================================================================
# This script performs the complete migration from cPanel to local Docker.
# Run this on your Ubuntu VPS as root.
#
# BEFORE RUNNING:
# 1. Verify MySQL version on cPanel: mysql -h trendingnow.ge -u trending_projectx -p -e "SELECT VERSION();"
# 2. Update docker-compose.yml image if version differs from 8.0
# 3. Generate passwords and update .env file
#
# Usage: ./migrate-mysql.sh
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_step() { echo -e "${GREEN}[STEP]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
PROJECT_DIR="/opt/projectx"
BACKUP_DIR="${PROJECT_DIR}/backups"
SCRIPTS_DIR="${PROJECT_DIR}/scripts"
DUMP_FILE="${BACKUP_DIR}/cpanel_export.sql"

# cPanel source (password entered interactively)
CPANEL_HOST="trendingnow.ge"
CPANEL_USER="trending_projectx"
CPANEL_DB="trending_projectx"

echo "=============================================="
echo "  MySQL Migration: cPanel → Docker"
echo "=============================================="
echo ""

# Step 1: Create directory structure
echo_step "Creating directory structure..."
mkdir -p "$BACKUP_DIR" "$SCRIPTS_DIR"
chmod 700 "$PROJECT_DIR"

# Step 2: Check if .env exists with passwords
if [ ! -f "${PROJECT_DIR}/.env" ]; then
    echo_error ".env file not found at ${PROJECT_DIR}/.env"
    echo ""
    echo "Create it first with:"
    echo "  cat > ${PROJECT_DIR}/.env << 'EOF'"
    echo "  MYSQL_ROOT_PASSWORD=<generate with: openssl rand -base64 32>"
    echo "  MYSQL_PASSWORD=<generate with: openssl rand -base64 32>"
    echo "  EOF"
    echo "  chmod 600 ${PROJECT_DIR}/.env"
    exit 1
fi

source "${PROJECT_DIR}/.env"

if [ -z "${MYSQL_ROOT_PASSWORD:-}" ] || [ -z "${MYSQL_PASSWORD:-}" ]; then
    echo_error "MYSQL_ROOT_PASSWORD and MYSQL_PASSWORD must be set in ${PROJECT_DIR}/.env"
    exit 1
fi

echo_step "Environment loaded successfully"

# Step 3: Validate source database
echo_step "Validating source database connection..."
echo_warn "You will be prompted for the cPanel MySQL password"
echo ""

mysql -h "$CPANEL_HOST" -u "$CPANEL_USER" -p -e "
    SELECT VERSION() AS mysql_version;
    SELECT COUNT(*) AS user_count FROM ${CPANEL_DB}.users;
" || {
    echo_error "Failed to connect to source database"
    exit 1
}

echo ""
read -p "Does the above look correct? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
fi

# Step 4: Export from cPanel
echo_step "Exporting database from cPanel..."
echo_warn "Enter the cPanel password when prompted"
echo_warn "This may take several minutes depending on database size"
echo ""

mysqldump \
    -h "$CPANEL_HOST" \
    -u "$CPANEL_USER" \
    -p \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    --column-statistics=0 \
    --default-character-set=utf8mb4 \
    "$CPANEL_DB" > "$DUMP_FILE"

# Verify dump
DUMP_SIZE=$(ls -lh "$DUMP_FILE" | awk '{print $5}')
DUMP_LINES=$(wc -l < "$DUMP_FILE")
echo_step "Dump completed: $DUMP_FILE ($DUMP_SIZE, $DUMP_LINES lines)"

# Check for errors in dump
if grep -q "^-- Dump completed" "$DUMP_FILE"; then
    echo_step "Dump file appears valid (ends with completion marker)"
else
    echo_error "Dump file may be incomplete - missing completion marker"
    exit 1
fi

# Step 5: Start Docker MySQL
echo_step "Starting Docker MySQL..."
cd "$PROJECT_DIR"

docker compose up -d

echo "Waiting for MySQL to be ready (this may take 60+ seconds)..."
sleep 10

# Wait for healthy status
for i in {1..30}; do
    if docker compose ps | grep -q "healthy"; then
        echo_step "MySQL container is healthy"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 5
done

# Verify MySQL is truly ready
docker exec projectx-mysql mysqladmin ping -h localhost -uroot -p"$MYSQL_ROOT_PASSWORD" --silent || {
    echo_error "MySQL is not responding"
    docker logs projectx-mysql --tail 50
    exit 1
}

# Step 6: Verify target database exists
echo_step "Verifying target database exists..."
docker exec projectx-mysql mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -e "SHOW DATABASES;" | grep -q trending_projectx || {
    echo_error "Database 'trending_projectx' not found in Docker MySQL"
    exit 1
}
echo_step "Target database 'trending_projectx' confirmed"

# Step 7: Import dump
echo_step "Importing database into Docker MySQL..."
echo_warn "This may take several minutes..."

docker exec -i projectx-mysql mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    trending_projectx < "$DUMP_FILE"

echo_step "Import completed"

# Step 8: Verify import
echo_step "Verifying migration..."

docker exec projectx-mysql mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    trending_projectx -e "
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL SELECT 'services', COUNT(*) FROM services;
"

echo ""
echo_step "Migration completed successfully!"
echo ""
echo "=============================================="
echo "  NEXT STEPS"
echo "=============================================="
echo ""
echo "1. Compare row counts above with cPanel source"
echo ""
echo "2. Update your application .env:"
echo "   MYSQL_HOST=127.0.0.1"
echo "   MYSQL_USER=projectx_user"
echo "   MYSQL_PASSWORD=<value from ${PROJECT_DIR}/.env>"
echo "   MYSQL_DATABASE=trending_projectx"
echo ""
echo "3. Rotate JWT_SECRET (generate new with: openssl rand -hex 64)"
echo ""
echo "4. Restart your application: pm2 restart all"
echo ""
echo "5. Test the API: curl http://localhost:3000/api/services"
echo ""
echo "6. Setup backup cron:"
echo "   cp ${SCRIPTS_DIR}/backup-mysql.sh ${SCRIPTS_DIR}/"
echo "   chmod +x ${SCRIPTS_DIR}/backup-mysql.sh"
echo "   (crontab -l; echo '0 3 * * * ${SCRIPTS_DIR}/backup-mysql.sh >> /var/log/projectx-backup.log 2>&1') | crontab -"
echo ""
echo "=============================================="
