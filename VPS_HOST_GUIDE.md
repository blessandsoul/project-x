# 🚀 Ultimate Ubuntu VPS Hosting Guide for Trusted Importers

This guide covers everything: Node.js, MySQL, Redis, Nginx, Security, and Storage.

---

## 🛠 Prerequisites
- Ubuntu 22.04 or 24.04 VPS
- A Domain Name pointing to your VPS IP
- SSH access

---

## Step 1: System Baseline
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install build-essential curl git ufw -y
```

---

## Step 2: Install Node.js (v24) via NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
```

---

## Step 3: MySQL & Redis (The "Engines")

### 1. Install Services
```bash
sudo apt install mysql-server redis-server -y
```

### 2. Configure MySQL
```bash
sudo mysql_secure_installation # Follow prompts to secure
```

```bash
sudo mysql -u root -p
# Inside MySQL:
CREATE DATABASE trusted_importers_prod;
CREATE USER 'trusted_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON trusted_importers_prod.* TO 'trusted_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 4: Storage & Permissions (The "Uploads" Folder)
Your server stores files (images, documents) in an `uploads/` folder.

### Persistent Storage Setup
1. Create the data folder on the drive:
   ```bash
   sudo mkdir -p /var/data/trusted-importers/uploads
   sudo chown -R $USER:$USER /var/data/trusted-importers/uploads
   ```
2. Link it to your server:
   ```bash
   # 1. Be in your server directory:
   cd ~/apps/trusted-importers/server
   
   # 2. Delete any existing dummy folder:
   rm -rf uploads
   
   # 3. Create the symbolic link:
   ln -s /var/data/trusted-importers/uploads uploads
   ```

---

## Step 5: Security (Firewall)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Step 6: Clone & Build
```bash
mkdir -p ~/apps
git clone <your-repo-url> ~/apps/trusted-importers
cd ~/apps/trusted-importers/client && npm install && npm run build
cd ~/apps/trusted-importers/server && npm install && npm run build
```

---

## Step 7: Data Migration (Local to Remote)
To move your current data to the VPS:

### 1. On your Local Machine (Export)
Run this in your **local** PowerShell/Terminal:
```bash
mysqldump -u root -p trending_projectx > full_database_dump.sql
```

### 2. Move Dump to VPS
Run this from your **local** machine:
```bash
# Replace 'vps_ip' with your actual VPS IP address
scp full_database_dump.sql deploy@vps_ip:~/apps/trusted-importers/server/
```

### 3. On your VPS (Import)
Run these commands **on your VPS** terminal:
```bash
cd ~/apps/trusted-importers/server/
# Import into the new production database
mysql -u trusted_user -p trusted_importers_prod < full_database_dump.sql
```

---

## Step 8: Production PM2 Setup
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs --only project-x-server
pm2 save
pm2 startup
```

---

## Step 9: Nginx & SSL
Create config at `/etc/nginx/sites-available/trusted-importers`:
```nginx
server {
    listen 80;
    server_name yourdomain.com; # Change to your domain

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and secure:
```bash
sudo ln -s /etc/nginx/sites-available/trusted-importers /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```
