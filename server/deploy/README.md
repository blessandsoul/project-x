# MySQL Migration Deployment Files

This directory contains files needed to migrate MySQL from cPanel to local Docker on your Ubuntu VPS.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Docker configuration for MySQL + Adminer |
| `migrate-mysql.sh` | Full migration script (export → import → verify) |
| `backup-mysql.sh` | Automated backup script for cron |

## Quick Start

### 1. Transfer files to VPS

```bash
# From your local machine (in this directory)
scp -r ./* root@your-vps-ip:/opt/projectx/
```

### 2. Generate passwords on VPS

```bash
ssh root@your-vps-ip

# Generate and save passwords
echo "MYSQL_ROOT_PASSWORD: $(openssl rand -base64 32)"
echo "MYSQL_PASSWORD: $(openssl rand -base64 32)"
echo "JWT_SECRET: $(openssl rand -hex 64)"

# Create .env with generated passwords
cat > /opt/projectx/.env << 'EOF'
MYSQL_ROOT_PASSWORD=<paste-root-password>
MYSQL_PASSWORD=<paste-user-password>
EOF

chmod 600 /opt/projectx/.env
```

### 3. Run migration

```bash
cd /opt/projectx
chmod +x migrate-mysql.sh backup-mysql.sh
./migrate-mysql.sh
```

### 4. Update application .env

After successful migration, update your server's `.env`:

```ini
MYSQL_HOST=127.0.0.1
MYSQL_USER=projectx_user
MYSQL_PASSWORD=<same as MYSQL_PASSWORD from /opt/projectx/.env>
MYSQL_DATABASE=trending_projectx

# ROTATE THIS - use the JWT_SECRET generated above
JWT_SECRET=<new-128-char-hex>
```

### 5. Restart and verify

```bash
pm2 restart all
curl http://localhost:3000/api/services
```

## Rollback

If anything breaks, revert `.env` to use cPanel:

```ini
MYSQL_HOST=trendingnow.ge
MYSQL_USER=trending_projectx
MYSQL_PASSWORD=vAcE0B+q5M-ko~3W
MYSQL_DATABASE=trending_projectx
```

Then: `pm2 restart all`

## Adminer Access

Adminer is bound to localhost only. Access via SSH tunnel:

```bash
# From your local machine
ssh -L 8080:127.0.0.1:8080 root@your-vps-ip

# Then open in browser
http://localhost:8080
```

Login with:
- Server: `mysql`
- Username: `root`
- Password: `<MYSQL_ROOT_PASSWORD from /opt/projectx/.env>`
- Database: `trending_projectx`
