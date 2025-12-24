#!/bin/bash
# =============================================================================
# MySQL Backup Script for ProjectX
# =============================================================================
# Runs nightly via cron, keeps 14 days of backups locally.
#
# Setup:
#   chmod +x backup-mysql.sh
#   crontab -e
#   0 3 * * * /opt/projectx/scripts/backup-mysql.sh >> /var/log/projectx-backup.log 2>&1
# =============================================================================

set -euo pipefail

BACKUP_DIR="/opt/projectx/backups"
CONTAINER="projectx-mysql"
DB_NAME="trending_projectx"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"
RETENTION_DAYS=14

# Load Docker MySQL root password
source /opt/projectx/.env

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of ${DB_NAME}..."

docker exec "$CONTAINER" mysqldump \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($FILESIZE)"

# Cleanup old backups
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "[$(date)] Deleted $DELETED backups older than $RETENTION_DAYS days"

echo "[$(date)] Backup completed successfully"
