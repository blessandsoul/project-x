# SPA Routing Fix - Manual Refresh Issue

## Problem
When manually refreshing the page on any route other than the root (e.g., `/auction-listings`), the server returned an INTERNAL_ERROR:
```
The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Object
```

The app worked fine when navigating through React Router links, but broke on manual refresh.

## Root Cause
The `registerSpaFallback` function in `server/src/routes/index.ts` was calling `reply.sendFile('index.html')` without providing the absolute path to the file. This caused Fastify to attempt to send an object instead of the actual file content.

## Solution
Updated the `registerSpaFallback` function to:
1. Import `path` and `fileURLToPath` modules
2. Calculate the absolute path to the `public` directory
3. Pass the absolute path as the second argument to `reply.sendFile()`

### Changes Made

**File: `server/src/routes/index.ts`**

1. Added imports:
```typescript
import path from 'path';
import { fileURLToPath } from 'url';
```

2. Added path resolution:
```typescript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

3. Updated `registerSpaFallback` function:
```typescript
export async function registerSpaFallback(fastify: FastifyInstance): Promise<void> {
    const publicPath = path.join(__dirname, '..', '..', 'public');
    
    // Wildcard route to catch all GET requests that didn't match any route
    // Serves index.html for client-side routing (React Router)
    fastify.get('/*', async (request, reply) => {
        // Serve index.html for SPA routing
        return reply.sendFile('index.html', publicPath);
    });

    fastify.log.debug('SPA fallback route registered');
}
```

## How It Works
1. The catch-all route `/*` is registered **AFTER** all API routes (as seen in `server.ts` line 92-99)
2. When a request comes in for a non-API route (e.g., `/auction-listings`), it doesn't match any API endpoint
3. The catch-all route catches it and serves `index.html` from the `public` directory
4. React Router then takes over on the client side and renders the correct component

## Benefits
✅ Manual page refresh now works on all routes  
✅ React Router handles client-side routing properly  
✅ No interference with API endpoints or static assets  
✅ Proper file streaming instead of object serialization  

## Testing
To verify the fix:
1. Navigate to any route in your React app (e.g., `/auction-listings`)
2. Manually refresh the page (F5 or Ctrl+R)
3. The page should load correctly without errors
4. Check the browser console - no errors should appear
5. Verify API calls still work correctly

## Technical Details
- The `reply.sendFile()` method requires the root directory as the second parameter when using relative paths
- Without the root parameter, Fastify doesn't know where to look for the file
- The path resolution uses `__dirname` which points to the compiled `dist/routes` directory
- We go up two levels (`..`, `..`) to reach the `server` root, then into `public`
