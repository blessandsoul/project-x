# 🚨 Quick Fix for Your Coolify Deployment Errors

## Errors You're Seeing:

1. ❌ **Cross-Origin-Opener-Policy header has been ignored**
2. ❌ **X-Frame-Options may only be set via HTTP header**
3. ❌ **Content-Security-Policy directive: "style-src 'self' 'unsafe-inline'"**
4. ❌ **Failed to load resource: net::ERR_CERT_AUTHORITY_INVALID**
5. ❌ **Loading the stylesheet failed**

---

## ✅ What I Fixed:

### **1. Updated `server/src/plugins/index.ts`**

**Changes:**
- ✅ Disabled `frameguard` to prevent X-Frame-Options conflicts
- ✅ Enhanced CSP directives to allow:
  - Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
  - Inline scripts and styles (`'unsafe-inline'`, `'unsafe-eval'`)
  - Blob URLs for images
  - WebSocket connections (`wss:`, `ws:`)
- ✅ Added proper CSP directives: `frameSrc`, `objectSrc`, `baseUri`, `formAction`, `frameAncestors`

### **2. Created Deployment Guide**

**File:** `COOLIFY_DEPLOYMENT_GUIDE.md`

This comprehensive guide covers:
- Environment variable setup
- SSL certificate configuration
- CORS configuration
- Troubleshooting common errors
- Post-deployment checklist

---

## 🔧 What You Need to Do in Coolify:

### **Step 1: Update Environment Variables**

In your Coolify application settings, **verify/update** these critical env vars:

```bash
# CRITICAL: Replace with your actual domain
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Set to production
NODE_ENV=production

# Your actual domain
PUBLIC_UPLOADS_BASE_URL=https://yourdomain.com
```

### **Step 2: Fix SSL Certificate**

**Option A: Regenerate SSL (Recommended)**

1. Go to Coolify Dashboard → Your App → **Domains**
2. Click **"Regenerate SSL Certificate"**
3. Wait 2-3 minutes
4. Clear browser cache
5. Retry accessing your app

**Option B: Enable SSL if Not Enabled**

1. Go to Coolify Dashboard → Your App → **Domains**
2. Ensure your domain is added (e.g., `yourdomain.com`)
3. Enable **"Generate SSL Certificate"**
4. Click **"Save"**
5. Wait for certificate generation

### **Step 3: Redeploy**

1. **Commit and push** the updated `server/src/plugins/index.ts` to your GitHub repo
2. In Coolify, click **"Redeploy"** or **"Force Rebuild"**
3. Monitor build logs for errors
4. Wait for deployment to complete

### **Step 4: Verify**

1. Visit `https://yourdomain.com`
2. Open **DevTools** (F12) → **Console** tab
3. Check for errors:
   - ✅ No CORS errors
   - ✅ No CSP errors
   - ✅ No SSL certificate errors
   - ✅ Stylesheets load successfully

---

## 🐛 If Errors Persist:

### **Error: SSL Certificate Still Invalid**

**Possible Causes:**
- DNS not pointing to Coolify server
- SSL certificate generation failed
- Using HTTP instead of HTTPS

**Solutions:**
1. Verify DNS A record points to your Coolify server IP
2. Wait 5-10 minutes for DNS propagation
3. Try regenerating SSL certificate again
4. Check Coolify logs for SSL errors

### **Error: CORS Still Failing**

**Possible Causes:**
- `CORS_ALLOWED_ORIGINS` doesn't match your domain
- Trailing slash in domain
- Using HTTP instead of HTTPS

**Solutions:**
1. Ensure `CORS_ALLOWED_ORIGINS=https://yourdomain.com` (no trailing slash)
2. Restart application after changing env vars
3. Clear browser cache and cookies
4. Try incognito/private browsing mode

### **Error: Stylesheets Still Not Loading**

**Possible Causes:**
- CSP still blocking resources
- Static files not deployed
- Build failed

**Solutions:**
1. Check build logs in Coolify for errors
2. Verify `public` directory exists in deployed container
3. SSH into container and check file structure:
   ```bash
   ls -la /app/public
   ls -la /app/dist
   ```

---

## 📋 Deployment Checklist:

- [ ] Updated `server/src/plugins/index.ts` (already done ✅)
- [ ] Committed and pushed changes to GitHub
- [ ] Updated `CORS_ALLOWED_ORIGINS` in Coolify env vars
- [ ] Set `NODE_ENV=production` in Coolify env vars
- [ ] SSL certificate generated/regenerated in Coolify
- [ ] Redeployed application in Coolify
- [ ] Verified no errors in browser console
- [ ] Tested API endpoints
- [ ] Tested client application

---

## 🆘 Emergency Rollback:

If the new changes break something:

1. In Coolify, go to **Deployments** tab
2. Find the previous successful deployment
3. Click **"Redeploy"** on that version
4. Report the issue with logs

---

## 📞 Next Steps:

1. **Commit the changes:**
   ```bash
   git add server/src/plugins/index.ts COOLIFY_DEPLOYMENT_GUIDE.md CHANGELOG.md fx-handoff.md
   git commit -m "fix: Coolify deployment CSP/CORS/SSL errors"
   git push
   ```

2. **Update Coolify env vars** (see Step 1 above)

3. **Regenerate SSL certificate** (see Step 2 above)

4. **Redeploy** in Coolify

5. **Test** your application

---

**Last Updated:** 2026-01-06
