# Client Deployment Guide

## Overview

Your server is now configured to serve static files from the `server/public` folder. This allows you to host your client application from the same server as your API.

## Current Setup

### Server Configuration

✅ **Static File Serving Enabled**
- **Public folder**: `server/public/`
- **URL**: `http://localhost:3000/` (root path)
- **API endpoints**: `http://localhost:3000/api/v1/*`

### File Structure

```
server/
├── public/              ← Client files go here
│   └── index.html      ← Landing page (currently active)
├── uploads/            ← User uploads (avatars, logos)
├── src/
└── ...
```

## Deployment Steps

### Option 1: Quick Test (Current Status)

The server is already serving a simple landing page from `server/public/index.html`.

**Test it now:**
1. Open browser: `http://localhost:3000`
2. You should see the "Project X API Server" landing page
3. API is still available at: `http://localhost:3000/api/v1/*`

### Option 2: Deploy Your React Client

#### Step 1: Build Your Client

```bash
cd client
npm run build
```

This creates a `client/dist` folder with your production-ready files.

#### Step 2: Copy Build to Server

**Windows (PowerShell):**
```powershell
# Remove old files (except index.html if you want to keep it as fallback)
Remove-Item -Path "server\public\*" -Recurse -Force -Exclude "index.html"

# Copy new build
Copy-Item -Path "client\dist\*" -Destination "server\public\" -Recurse -Force
```

**Linux/Mac:**
```bash
# Remove old files
rm -rf server/public/*

# Copy new build
cp -r client/dist/* server/public/
```

#### Step 3: Update Client API Base URL

Before building, ensure your client uses the correct API URL:

**For same-domain deployment** (recommended):

```typescript
// client/src/lib/apiClient.ts
export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api/v1'
  : '/api/v1' // ← Relative URL for production
```

**For separate domains:**

```typescript
export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api/v1'
  : 'https://api.yourdomain.com/api/v1'
```

#### Step 4: Restart Server (if needed)

The server should automatically serve the new files. If not, restart:

```bash
cd server
npm run dev
```

#### Step 5: Test

1. Open: `http://localhost:3000`
2. Your React app should load
3. API calls should work at: `http://localhost:3000/api/v1/*`

## How It Works

### Route Priority

The server handles routes in this order:

1. **API Routes** (`/api/v1/*`) - Highest priority
2. **Health Check** (`/health`, `/health/db`)
3. **Uploads** (`/uploads/*`) - User-uploaded files
4. **Static Files** (`/`) - Your client application

### SPA Fallback

For Single Page Applications (React, Vue, etc.), you may need to configure fallback routing:

**Current Setup:**
- Static files are served from `/`
- If a file doesn't exist, Fastify returns 404

**For SPA Routing:**
If your client uses React Router or similar, you'll need to add a wildcard route to serve `index.html` for all non-API routes.

Add this to `server/src/routes/index.ts` (after all API routes):

```typescript
// SPA fallback - serve index.html for all non-API routes
fastify.setNotFoundHandler((request, reply) => {
  // Only serve index.html for browser requests (Accept: text/html)
  const acceptsHtml = request.headers.accept?.includes('text/html');
  
  if (acceptsHtml && !request.url.startsWith('/api/')) {
    return reply.sendFile('index.html');
  }
  
  // For API routes and non-HTML requests, return 404
  return reply.code(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: 'Route not found'
  });
});
```

## File Caching

### Development
- HTML files: No cache
- Other assets: No cache

### Production
- HTML files: No cache (always fresh)
- JS/CSS/Images: 1 year cache (immutable)

This ensures users always get the latest HTML but can cache assets efficiently.

## Environment Variables

### Client (.env.production)

```env
VITE_API_BASE_URL=/api/v1
```

### Server (.env)

```env
NODE_ENV=production
PORT=3000
# ... other vars
```

## Automated Deployment Script

Create `deploy-client.sh` (or `.ps1` for Windows):

```bash
#!/bin/bash

echo "🔨 Building client..."
cd client
npm run build

echo "📦 Deploying to server..."
cd ..
rm -rf server/public/*
cp -r client/dist/* server/public/

echo "✅ Deployment complete!"
echo "🌐 Visit: http://localhost:3000"
```

Make it executable:
```bash
chmod +x deploy-client.sh
./deploy-client.sh
```

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start server
cd server
pm2 start npm --name "project-x-api" -- start

# View logs
pm2 logs project-x-api

# Restart
pm2 restart project-x-api
```

### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy server
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

# Copy built client to public folder
COPY client/dist/ ./public/

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t project-x .
docker run -p 3000:3000 project-x
```

## Troubleshooting

### Issue: Client shows blank page

**Solution:**
1. Check browser console for errors
2. Verify API base URL is correct
3. Check that files were copied correctly
4. Ensure `index.html` exists in `server/public/`

### Issue: API calls fail with CORS errors

**Solution:**
1. If serving from same domain, use relative URLs: `/api/v1/*`
2. If separate domains, configure CORS in server
3. Check `CORS_ALLOWED_ORIGINS` environment variable

### Issue: React Router routes return 404

**Solution:**
Add the SPA fallback handler (see "SPA Fallback" section above)

### Issue: Assets not loading

**Solution:**
1. Check that Vite build output is in `client/dist/`
2. Verify files were copied to `server/public/`
3. Check browser Network tab for 404s
4. Ensure asset paths are relative (not absolute)

## Testing Checklist

- [ ] Landing page loads at `http://localhost:3000`
- [ ] API health check works: `http://localhost:3000/health`
- [ ] API endpoints work: `http://localhost:3000/api/v1/companies`
- [ ] Client app loads after deployment
- [ ] Client can make API calls
- [ ] Authentication works (login/logout)
- [ ] Static assets load (images, CSS, JS)
- [ ] React Router navigation works (if applicable)

## Next Steps

1. **Test the current landing page**: Visit `http://localhost:3000`
2. **Build your client**: `cd client && npm run build`
3. **Deploy**: Copy `client/dist/*` to `server/public/`
4. **Verify**: Test your app at `http://localhost:3000`

Your server is ready to host your client application! 🚀
