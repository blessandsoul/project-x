#!/bin/bash

# Vehicle Makes & Models API Test Script
# This script tests all endpoints with various scenarios

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Vehicle Makes & Models API Test Suite"
echo "=========================================="
echo ""

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -e "${YELLOW}Testing:${NC} $name"
    echo "URL: $url"
    
    response=$(curl -s -w "\n%{http_code}" "$url")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Status: $http_code"
        echo "Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body)"
    else
        echo -e "${RED}✗ FAIL${NC} - Expected: $expected_status, Got: $http_code"
        echo "Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body)"
    fi
    echo ""
}

echo "=========================================="
echo "1. Vehicle Makes Tests"
echo "=========================================="
echo ""

# Test 1: Get car makes (should succeed)
test_endpoint \
    "Get car makes" \
    "$BASE_URL/api/vehicle-makes?type=car" \
    200

# Test 2: Get motorcycle makes (should succeed)
test_endpoint \
    "Get motorcycle makes" \
    "$BASE_URL/api/vehicle-makes?type=motorcycle" \
    200

# Test 3: Missing type parameter (should fail with 400)
test_endpoint \
    "Missing type parameter" \
    "$BASE_URL/api/vehicle-makes" \
    400

# Test 4: Invalid type parameter (should fail with 400)
test_endpoint \
    "Invalid type parameter" \
    "$BASE_URL/api/vehicle-makes?type=truck" \
    400

# Test 5: Case insensitive type (should succeed)
test_endpoint \
    "Case insensitive type (CAR)" \
    "$BASE_URL/api/vehicle-makes?type=CAR" \
    200

echo "=========================================="
echo "2. Vehicle Models Tests"
echo "=========================================="
echo ""

# Test 6: Get car models for BMW (makeId=452) (should succeed)
test_endpoint \
    "Get BMW car models" \
    "$BASE_URL/api/vehicle-models?type=car&makeId=452" \
    200

# Test 7: Get motorcycle models for BMW (should succeed)
test_endpoint \
    "Get BMW motorcycle models" \
    "$BASE_URL/api/vehicle-models?type=motorcycle&makeId=452" \
    200

# Test 8: Missing type parameter (should fail with 400)
test_endpoint \
    "Missing type parameter" \
    "$BASE_URL/api/vehicle-models?makeId=452" \
    400

# Test 9: Missing makeId parameter (should fail with 400)
test_endpoint \
    "Missing makeId parameter" \
    "$BASE_URL/api/vehicle-models?type=car" \
    400

# Test 10: Invalid makeId (non-numeric) (should fail with 400)
test_endpoint \
    "Invalid makeId (non-numeric)" \
    "$BASE_URL/api/vehicle-models?type=car&makeId=abc" \
    400

# Test 11: Invalid makeId (negative) (should fail with 400)
test_endpoint \
    "Invalid makeId (negative)" \
    "$BASE_URL/api/vehicle-models?type=car&makeId=-1" \
    400

# Test 12: Invalid makeId (zero) (should fail with 400)
test_endpoint \
    "Invalid makeId (zero)" \
    "$BASE_URL/api/vehicle-models?type=car&makeId=0" \
    400

# Test 13: Non-existent makeId (should succeed with empty array)
test_endpoint \
    "Non-existent makeId" \
    "$BASE_URL/api/vehicle-models?type=car&makeId=999999" \
    200

# Test 14: Case insensitive type (should succeed)
test_endpoint \
    "Case insensitive type (MOTORCYCLE)" \
    "$BASE_URL/api/vehicle-models?type=MOTORCYCLE&makeId=452" \
    200

echo "=========================================="
echo "3. Data Validation Tests"
echo "=========================================="
echo ""

# Test 15: Verify car makes response structure
echo -e "${YELLOW}Testing:${NC} Car makes response structure"
response=$(curl -s "$BASE_URL/api/vehicle-makes?type=car")
has_success=$(echo $response | jq -r '.success' 2>/dev/null)
has_count=$(echo $response | jq -r '.count' 2>/dev/null)
has_data=$(echo $response | jq -r '.data' 2>/dev/null)

if [ "$has_success" = "true" ] && [ "$has_count" != "null" ] && [ "$has_data" != "null" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Response has correct structure"
    echo "Sample: $(echo $response | jq -c '{success, count, data: .data[0:2]}' 2>/dev/null)"
else
    echo -e "${RED}✗ FAIL${NC} - Response structure is incorrect"
fi
echo ""

# Test 16: Verify models response structure
echo -e "${YELLOW}Testing:${NC} Models response structure"
response=$(curl -s "$BASE_URL/api/vehicle-models?type=car&makeId=452")
has_success=$(echo $response | jq -r '.success' 2>/dev/null)
has_count=$(echo $response | jq -r '.count' 2>/dev/null)
has_data=$(echo $response | jq -r '.data' 2>/dev/null)

if [ "$has_success" = "true" ] && [ "$has_count" != "null" ] && [ "$has_data" != "null" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Response has correct structure"
    echo "Sample: $(echo $response | jq -c '{success, count, data: .data[0:1]}' 2>/dev/null)"
else
    echo -e "${RED}✗ FAIL${NC} - Response structure is incorrect"
fi
echo ""

# Test 17: Verify makes are sorted alphabetically
echo -e "${YELLOW}Testing:${NC} Makes are sorted alphabetically"
response=$(curl -s "$BASE_URL/api/vehicle-makes?type=car")
first_make=$(echo $response | jq -r '.data[0].name' 2>/dev/null)
second_make=$(echo $response | jq -r '.data[1].name' 2>/dev/null)

if [[ "$first_make" < "$second_make" ]] || [[ "$first_make" == "$second_make" ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Makes are sorted: $first_make, $second_make, ..."
else
    echo -e "${RED}✗ FAIL${NC} - Makes are not sorted: $first_make, $second_make"
fi
echo ""

# Test 18: Verify models are sorted alphabetically
echo -e "${YELLOW}Testing:${NC} Models are sorted alphabetically"
response=$(curl -s "$BASE_URL/api/vehicle-models?type=car&makeId=452")
first_model=$(echo $response | jq -r '.data[0].modelName' 2>/dev/null)
second_model=$(echo $response | jq -r '.data[1].modelName' 2>/dev/null)

if [ "$first_model" != "null" ] && [ "$second_model" != "null" ]; then
    if [[ "$first_model" < "$second_model" ]] || [[ "$first_model" == "$second_model" ]]; then
        echo -e "${GREEN}✓ PASS${NC} - Models are sorted: $first_model, $second_model, ..."
    else
        echo -e "${RED}✗ FAIL${NC} - Models are not sorted: $first_model, $second_model"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} - No models found for makeId=452"
fi
echo ""

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="
