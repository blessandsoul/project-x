# Vehicle Makes & Models API Test Script (PowerShell)
# This script tests all endpoints with various scenarios

$BaseUrl = "http://localhost:3000"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Vehicle Makes & Models API Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to test an endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus
    )
    
    Write-Host "Testing: " -NoNewline -ForegroundColor Yellow
    Write-Host $Name
    Write-Host "URL: $Url"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode
        $body = $response.Content
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $body = $_.Exception.Response
    }
    
    if ($statusCode -eq $ExpectedStatus) {
        Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
        Write-Host " - Status: $statusCode"
        try {
            $json = $body | ConvertFrom-Json
            Write-Host "Response: $($json | ConvertTo-Json -Compress -Depth 2)"
        } catch {
            Write-Host "Response: $body"
        }
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " - Expected: $ExpectedStatus, Got: $statusCode"
        Write-Host "Response: $body"
    }
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Vehicle Makes Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get car makes (should succeed)
Test-Endpoint `
    -Name "Get car makes" `
    -Url "$BaseUrl/api/vehicle-makes?type=car" `
    -ExpectedStatus 200

# Test 2: Get motorcycle makes (should succeed)
Test-Endpoint `
    -Name "Get motorcycle makes" `
    -Url "$BaseUrl/api/vehicle-makes?type=motorcycle" `
    -ExpectedStatus 200

# Test 3: Missing type parameter (should fail with 400)
Test-Endpoint `
    -Name "Missing type parameter" `
    -Url "$BaseUrl/api/vehicle-makes" `
    -ExpectedStatus 400

# Test 4: Invalid type parameter (should fail with 400)
Test-Endpoint `
    -Name "Invalid type parameter" `
    -Url "$BaseUrl/api/vehicle-makes?type=truck" `
    -ExpectedStatus 400

# Test 5: Case insensitive type (should succeed)
Test-Endpoint `
    -Name "Case insensitive type (CAR)" `
    -Url "$BaseUrl/api/vehicle-makes?type=CAR" `
    -ExpectedStatus 200

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "2. Vehicle Models Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 6: Get car models for BMW (makeId=452) (should succeed)
Test-Endpoint `
    -Name "Get BMW car models" `
    -Url "$BaseUrl/api/vehicle-models?type=car&makeId=452" `
    -ExpectedStatus 200

# Test 7: Get motorcycle models for BMW (should succeed)
Test-Endpoint `
    -Name "Get BMW motorcycle models" `
    -Url "$BaseUrl/api/vehicle-models?type=motorcycle&makeId=452" `
    -ExpectedStatus 200

# Test 8: Missing type parameter (should fail with 400)
Test-Endpoint `
    -Name "Missing type parameter" `
    -Url "$BaseUrl/api/vehicle-models?makeId=452" `
    -ExpectedStatus 400

# Test 9: Missing makeId parameter (should fail with 400)
Test-Endpoint `
    -Name "Missing makeId parameter" `
    -Url "$BaseUrl/api/vehicle-models?type=car" `
    -ExpectedStatus 400

# Test 10: Invalid makeId (non-numeric) (should fail with 400)
Test-Endpoint `
    -Name "Invalid makeId (non-numeric)" `
    -Url "$BaseUrl/api/vehicle-models?type=car&makeId=abc" `
    -ExpectedStatus 400

# Test 11: Invalid makeId (negative) (should fail with 400)
Test-Endpoint `
    -Name "Invalid makeId (negative)" `
    -Url "$BaseUrl/api/vehicle-models?type=car&makeId=-1" `
    -ExpectedStatus 400

# Test 12: Invalid makeId (zero) (should fail with 400)
Test-Endpoint `
    -Name "Invalid makeId (zero)" `
    -Url "$BaseUrl/api/vehicle-models?type=car&makeId=0" `
    -ExpectedStatus 400

# Test 13: Non-existent makeId (should succeed with empty array)
Test-Endpoint `
    -Name "Non-existent makeId" `
    -Url "$BaseUrl/api/vehicle-models?type=car&makeId=999999" `
    -ExpectedStatus 200

# Test 14: Case insensitive type (should succeed)
Test-Endpoint `
    -Name "Case insensitive type (MOTORCYCLE)" `
    -Url "$BaseUrl/api/vehicle-models?type=MOTORCYCLE&makeId=452" `
    -ExpectedStatus 200

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "3. Data Validation Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 15: Verify car makes response structure
Write-Host "Testing: " -NoNewline -ForegroundColor Yellow
Write-Host "Car makes response structure"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/vehicle-makes?type=car" -Method Get
    if ($response.success -and $null -ne $response.count -and $null -ne $response.data) {
        Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
        Write-Host " - Response has correct structure"
        Write-Host "Sample: success=$($response.success), count=$($response.count), data[0]=$($response.data[0] | ConvertTo-Json -Compress)"
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " - Response structure is incorrect"
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " - Request failed: $_"
}
Write-Host ""

# Test 16: Verify models response structure
Write-Host "Testing: " -NoNewline -ForegroundColor Yellow
Write-Host "Models response structure"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/vehicle-models?type=car&makeId=452" -Method Get
    if ($response.success -and $null -ne $response.count -and $null -ne $response.data) {
        Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
        Write-Host " - Response has correct structure"
        if ($response.data.Count -gt 0) {
            Write-Host "Sample: success=$($response.success), count=$($response.count), data[0]=$($response.data[0] | ConvertTo-Json -Compress)"
        }
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " - Response structure is incorrect"
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " - Request failed: $_"
}
Write-Host ""

# Test 17: Verify makes are sorted alphabetically
Write-Host "Testing: " -NoNewline -ForegroundColor Yellow
Write-Host "Makes are sorted alphabetically"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/vehicle-makes?type=car" -Method Get
    if ($response.data.Count -ge 2) {
        $firstName = $response.data[0].name
        $secondName = $response.data[1].name
        if ($firstName -le $secondName) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " - Makes are sorted: $firstName, $secondName, ..."
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " - Makes are not sorted: $firstName, $secondName"
        }
    } else {
        Write-Host "⚠ SKIP" -ForegroundColor Yellow -NoNewline
        Write-Host " - Not enough makes to verify sorting"
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " - Request failed: $_"
}
Write-Host ""

# Test 18: Verify models are sorted alphabetically
Write-Host "Testing: " -NoNewline -ForegroundColor Yellow
Write-Host "Models are sorted alphabetically"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/vehicle-models?type=car&makeId=452" -Method Get
    if ($response.data.Count -ge 2) {
        $firstName = $response.data[0].modelName
        $secondName = $response.data[1].modelName
        if ($firstName -le $secondName) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " - Models are sorted: $firstName, $secondName, ..."
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " - Models are not sorted: $firstName, $secondName"
        }
    } else {
        Write-Host "⚠ SKIP" -ForegroundColor Yellow -NoNewline
        Write-Host " - No models found for makeId=452"
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " - Request failed: $_"
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
