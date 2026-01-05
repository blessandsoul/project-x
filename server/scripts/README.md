# Server Scripts

This directory contains utility scripts for testing and maintaining the server.

## Vehicle API Test Scripts

### test-vehicle-api.ps1 (Windows/PowerShell)

PowerShell script to test the Vehicle Makes & Models API endpoints.

**Usage:**

```powershell
# Make sure the server is running on http://localhost:3000
cd server/scripts
.\test-vehicle-api.ps1
```

**Requirements:**

- PowerShell 5.1 or higher
- Server running on http://localhost:3000

### test-vehicle-api.sh (Linux/macOS/Bash)

Bash script to test the Vehicle Makes & Models API endpoints.

**Usage:**

```bash
# Make sure the server is running on http://localhost:3000
cd server/scripts
chmod +x test-vehicle-api.sh
./test-vehicle-api.sh
```

**Requirements:**

- Bash shell
- curl
- jq (for JSON parsing)
- Server running on http://localhost:3000

**Install jq:**

- Ubuntu/Debian: `sudo apt-get install jq`
- macOS: `brew install jq`
- Windows (WSL): `sudo apt-get install jq`

## Test Coverage

Both scripts test the following scenarios:

### Vehicle Makes Tests

1. ✓ Get car makes (200 OK)
2. ✓ Get motorcycle makes (200 OK)
3. ✓ Missing type parameter (400 Bad Request)
4. ✓ Invalid type parameter (400 Bad Request)
5. ✓ Case insensitive type handling (200 OK)

### Vehicle Models Tests

6. ✓ Get car models by makeId (200 OK)
7. ✓ Get motorcycle models by makeId (200 OK)
8. ✓ Missing type parameter (400 Bad Request)
9. ✓ Missing makeId parameter (400 Bad Request)
10. ✓ Invalid makeId - non-numeric (400 Bad Request)
11. ✓ Invalid makeId - negative (400 Bad Request)
12. ✓ Invalid makeId - zero (400 Bad Request)
13. ✓ Non-existent makeId (200 OK with empty array)
14. ✓ Case insensitive type handling (200 OK)

### Data Validation Tests

15. ✓ Response structure validation (success, count, data)
16. ✓ Models response structure validation
17. ✓ Makes sorted alphabetically
18. ✓ Models sorted alphabetically

## Customization

To test against a different server URL, modify the `$BaseUrl` (PowerShell) or `BASE_URL` (Bash) variable at the top of the script:

**PowerShell:**

```powershell
$BaseUrl = "http://your-server:port"
```

**Bash:**

```bash
BASE_URL="http://your-server:port"
```

## Output

Both scripts provide color-coded output:

- 🟢 **Green** - Test passed
- 🔴 **Red** - Test failed
- 🟡 **Yellow** - Test skipped or informational

Example output:

```
==========================================
Vehicle Makes & Models API Test Suite
==========================================

==========================================
1. Vehicle Makes Tests
==========================================

Testing: Get car makes
URL: http://localhost:3000/api/vehicle-makes?type=car
✓ PASS - Status: 200
Response: {"success":true,"count":150,"data":[...]}

Testing: Missing type parameter
URL: http://localhost:3000/api/vehicle-makes
✓ PASS - Status: 400
Response: {"success":false,"error":"Missing required query parameter: type",...}
```

## Troubleshooting

### Server Not Running

If you see connection errors, make sure the server is running:

```bash
cd server
npm run dev
```

### Port Conflicts

If the server is running on a different port, update the base URL in the script.

### Permission Denied (Bash)

Make the script executable:

```bash
chmod +x test-vehicle-api.sh
```

### jq Not Found (Bash)

Install jq for JSON parsing:

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```
