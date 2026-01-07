# 🚀 Coolify Deployment Guide for Project-X

This guide covers deploying your Project-X application to Coolify with proper SSL, CORS, and security configurations.

---

## 📋 Prerequisites

- Coolify instance running
- Domain name pointing to your Coolify server
- GitHub repository access
- MySQL database created in Coolify

---

## 🔧 Step 1: Environment Variables Configuration

In your Coolify application settings, add these environment variables:

### **Server Configuration**
```bash
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
```

### **Database Configuration**
```bash
# Use your Coolify MySQL service details
MYSQL_HOST=<your-mysql-service-name>
MYSQL_USER=<your-mysql-user>
MYSQL_PASSWORD=<your-mysql-password>
MYSQL_DATABASE=<your-database-name>
```

### **JWT Configuration**
```bash
# Generate new secret: openssl rand -hex 64
JWT_SECRET=<your-secure-jwt-secret>
JWT_EXPIRES_IN=1d
JWT_ISSUER=project-x-api
JWT_AUDIENCE=project-x-clients
```

### **CORS Configuration** ⚠️ **CRITICAL**
```bash
# Replace with your actual domain(s)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_CREDENTIALS=true
```

### **Public URL Configuration**
```bash
# Replace with your actual domain
PUBLIC_UPLOADS_BASE_URL=https://yourdomain.com
```

### **API Credentials**
```bash
AUCTION_API_EMAIL=<your-email>
AUCTION_API_PASSWORD=<your-password>
API_TOKEN=<your-api-token>
GEOLOCATOR_API_KEY=<your-geolocator-key>
EXCHANGE_API_KEY=<your-exchange-api-key>
```

### **Rate Limiting (Production)**
```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=1 minute
RATE_LIMIT_USER_LOGIN_MAX=5
RATE_LIMIT_USER_LOGIN_WINDOW=5 minutes
```

### **Logging & Security**
```bash
LOG_LEVEL=info
BCRYPT_SALT_ROUNDS=12
AUCTION_INGEST_CONCURRENCY=60
```

---

## 🔐 Step 2: SSL Certificate Configuration in Coolify

### **Option A: Let's Encrypt (Recommended)**

1. **In Coolify Dashboard:**
   - Go to your application settings
   - Navigate to **"Domains"** section
   - Add your domain (e.g., `yourdomain.com`)
   - Enable **"Generate SSL Certificate"**
   - Click **"Save"**
   - Wait for SSL certificate generation (1-2 minutes)

2. **Verify SSL:**
   - Visit `https://yourdomain.com`
   - Check for the padlock icon in browser
   - No certificate errors should appear

### **Option B: HTTP Only (Testing Only - NOT RECOMMENDED)**

If you want to test without SSL temporarily:

1. In Coolify, ensure your domain is set to HTTP only
2. Update `CORS_ALLOWED_ORIGINS` to use `http://` instead of `https://`
3. **⚠️ WARNING:** This is insecure and should only be used for testing

---

## 🐳 Step 3: Dockerfile Configuration

Ensure your `server/Dockerfile` (or root Dockerfile) looks like this:

```dockerfile
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source
COPY server/ ./

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

---

## 📦 Step 4: Build Configuration in Coolify

### **Build Pack Settings:**

1. **Base Directory:** `server` (if your server is in a subdirectory)
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm start`
4. **Port:** `3000`

### **If Using Docker:**

1. **Dockerfile Location:** `./server/Dockerfile` or `./Dockerfile`
2. **Docker Build Context:** `.` (root directory)

---

## 🔄 Step 5: Deploy & Verify

### **Deploy:**

1. Push your code to GitHub
2. In Coolify, click **"Deploy"**
3. Monitor build logs for errors

### **Verify Deployment:**

1. **Check Server Logs:**
   ```bash
   # In Coolify logs, you should see:
   Server listening on http://0.0.0.0:3000
   Database connected successfully
   Redis connected successfully
   ```

2. **Test API Endpoint:**
   ```bash
   curl https://yourdomain.com/api/v1/health
   ```

3. **Test Client:**
   - Visit `https://yourdomain.com`
   - Open browser DevTools (F12)
   - Check Console for errors
   - Verify no CORS errors
   - Verify no CSP errors

---

## 🐛 Troubleshooting Common Issues

### **Issue 1: CORS Errors**

**Symptom:** `Origin not allowed by CORS` in browser console

**Solution:**
1. Verify `CORS_ALLOWED_ORIGINS` includes your domain with `https://`
2. Ensure no trailing slashes in domain
3. Restart application after changing env vars

### **Issue 2: SSL Certificate Errors**

**Symptom:** `ERR_CERT_AUTHORITY_INVALID` or `NET::ERR_CERT_AUTHORITY_INVALID`

**Solution:**
1. In Coolify, go to Domains section
2. Click **"Regenerate SSL Certificate"**
3. Wait 2-3 minutes
4. Clear browser cache and retry
5. Verify domain DNS is pointing to Coolify server

### **Issue 3: CSP Blocking Resources**

**Symptom:** `Content Security Policy directive` errors

**Solution:**
- This should be fixed by the updated `plugins/index.ts`
- Ensure you've deployed the latest code
- Check server logs for CSP warnings

### **Issue 4: X-Frame-Options Conflict**

**Symptom:** `X-Frame-Options may only be set via HTTP header`

**Solution:**
- This is fixed by setting `frameguard: false` in Helmet config
- Deploy the updated code

### **Issue 5: Static Assets Not Loading**

**Symptom:** CSS/JS files return 404

**Solution:**
1. Verify `public` directory exists in deployed container
2. Check build logs for file copy errors
3. Ensure `fastifyStatic` is configured correctly

### **Issue 6: Database Connection Failed**

**Symptom:** `ECONNREFUSED` or `Access denied for user`

**Solution:**
1. Verify MySQL service is running in Coolify
2. Check `MYSQL_HOST` matches Coolify service name
3. Verify MySQL user has correct permissions
4. Test connection from Coolify terminal:
   ```bash
   mysql -h <MYSQL_HOST> -u <MYSQL_USER> -p<MYSQL_PASSWORD> <MYSQL_DATABASE>
   ```

---

## 🔍 Step 6: Post-Deployment Checklist

- [ ] SSL certificate is valid (green padlock in browser)
- [ ] No CORS errors in browser console
- [ ] No CSP errors in browser console
- [ ] API endpoints respond correctly
- [ ] Client application loads
- [ ] Database connection successful
- [ ] Redis connection successful (if using)
- [ ] File uploads work
- [ ] Authentication works
- [ ] WebSocket connections work (if using)

---

## 📝 Important Notes

### **Security Best Practices:**

1. **Never commit `.env` files** to Git
2. **Use strong passwords** for database and JWT secrets
3. **Enable rate limiting** in production
4. **Monitor logs** regularly for suspicious activity
5. **Keep dependencies updated**

### **Performance Optimization:**

1. **Enable Gzip compression** (already configured)
2. **Use CDN** for static assets (optional)
3. **Configure caching headers** (already configured)
4. **Monitor server resources** in Coolify dashboard

### **Backup Strategy:**

1. **Database:** Set up automated backups in Coolify
2. **Uploads:** Consider using S3 or similar for file storage
3. **Environment Variables:** Keep a secure backup of all env vars

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Coolify Logs:**
   - Application logs
   - Build logs
   - System logs

2. **Check Browser DevTools:**
   - Console tab for JavaScript errors
   - Network tab for failed requests
   - Security tab for certificate issues

3. **Common Log Locations:**
   - Server logs: Coolify dashboard → Your app → Logs
   - Build logs: Coolify dashboard → Your app → Deployments → View logs

---

## 🎯 Quick Fix Commands

### **Restart Application:**
```bash
# In Coolify dashboard, click "Restart"
```

### **Rebuild Application:**
```bash
# In Coolify dashboard, click "Redeploy"
```

### **View Real-time Logs:**
```bash
# In Coolify dashboard, go to Logs tab
```

### **SSH into Container:**
```bash
# In Coolify dashboard, click "Terminal" or "SSH"
```

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Browser shows `https://` with green padlock
2. ✅ No errors in browser console
3. ✅ API responds to requests
4. ✅ Client application loads and functions
5. ✅ Database queries work
6. ✅ File uploads work
7. ✅ Authentication works

---

**Last Updated:** 2026-01-06
**Version:** 1.0.0
