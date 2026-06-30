#!/bin/bash
# AiB IAAS POC - End-to-End Smoke Test
# Tests key API flows across services
#
# Prerequisites: services running on default ports
# Run: bash scripts/smoke-test.sh

set -e

BASE_URL="${API_URL:-http://localhost:3001}"
MOCK_URL="${MOCK_URL:-http://localhost:3005}"
RECOMMEND_URL="${RECOMMEND_URL:-http://localhost:3002}"
USER_URL="${USER_URL:-http://localhost:3011}"

PASS=0
FAIL=0

check() {
  local desc="$1"
  local result="$2"
  if [ $? -eq 0 ] && [ -n "$result" ]; then
    echo "  ✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "╔══════════════════════════════════════════════════════╗"
echo "║  AiB IAAS POC - Smoke Test Suite                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 1. Mock Integrations Health
echo "▸ Mock Integrations Service ($MOCK_URL)"
RESULT=$(curl -sf "$MOCK_URL/api/mock/health" 2>/dev/null)
check "Health check returns healthy" "$RESULT"

# 2. BASYS Lookup - Found case
RESULT=$(curl -sf -X POST "$MOCK_URL/api/basys/lookup" -H "Content-Type: application/json" -d '{"lastName":"SMITH"}' 2>/dev/null)
echo "$RESULT" | grep -q '"found":true' && check "BASYS lookup - found for SMITH" "$RESULT" || { echo "  ✗ BASYS lookup - found for SMITH"; FAIL=$((FAIL+1)); }

# 3. BASYS Lookup - Not found
RESULT=$(curl -sf -X POST "$MOCK_URL/api/basys/lookup" -H "Content-Type: application/json" -d '{"lastName":"NOBODY"}' 2>/dev/null)
echo "$RESULT" | grep -q '"found":false' && check "BASYS lookup - not found for NOBODY" "$RESULT" || { echo "  ✗ BASYS lookup - not found"; FAIL=$((FAIL+1)); }

# 4. Moratorium Check
RESULT=$(curl -sf -X POST "$MOCK_URL/api/moratorium/check" -H "Content-Type: application/json" -d '{"postcode":"EH1 1AA"}' 2>/dev/null)
echo "$RESULT" | grep -q '"found":true' && check "Moratorium - active for EH postcode" "$RESULT" || { echo "  ✗ Moratorium check"; FAIL=$((FAIL+1)); }

# 5. Credit Check
RESULT=$(curl -sf -X POST "$MOCK_URL/api/credit-check/run" -H "Content-Type: application/json" -d '{"firstName":"John","lastName":"Test","dateOfBirth":"1985-01-01","address":{"line1":"1 Test St","postcode":"EH1 1AA"}}' 2>/dev/null)
echo "$RESULT" | grep -q '"creditScore"' && check "Credit check returns score" "$RESULT" || { echo "  ✗ Credit check"; FAIL=$((FAIL+1)); }

echo ""

# 6. Recommendation Service
echo "▸ Recommendation Service ($RECOMMEND_URL)"
RESULT=$(curl -sf -X POST "$RECOMMEND_URL/api/recommend" -H "Content-Type: application/json" -d '{"totalDebt":12000,"numberOfCreditors":3,"monthlyIncome":2000,"monthlyExpenditure":1700,"employmentStatus":"employed","hasAssets":false,"totalAssetValue":0,"existingCases":[],"hasMoratorium":false}' 2>/dev/null)
echo "$RESULT" | grep -q '"debt_arrangement_scheme"' && check "DAS recommendation for medium debt" "$RESULT" || { echo "  ✗ DAS recommendation"; FAIL=$((FAIL+1)); }

RESULT=$(curl -sf -X POST "$RECOMMEND_URL/api/recommend" -H "Content-Type: application/json" -d '{"totalDebt":800,"numberOfCreditors":1,"monthlyIncome":1500,"monthlyExpenditure":1200,"employmentStatus":"employed","hasAssets":false,"totalAssetValue":0,"existingCases":[],"hasMoratorium":false}' 2>/dev/null)
echo "$RESULT" | grep -q '"signposting_advice"' && check "Signposting for very low debt" "$RESULT" || { echo "  ✗ Signposting recommendation"; FAIL=$((FAIL+1)); }

echo ""

# 7. API Gateway
echo "▸ API Gateway ($BASE_URL)"
RESULT=$(curl -sf "$BASE_URL/api/health" 2>/dev/null)
check "Gateway health check" "$RESULT"

# 8. Create application
RESULT=$(curl -sf -X POST "$BASE_URL/api/applications" -H "Content-Type: application/json" -d '{"debtorDetails":{"firstName":"Smoke","lastName":"Test"}}' 2>/dev/null)
APP_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "Create application" "$APP_ID"

# 9. Get application
if [ -n "$APP_ID" ]; then
  RESULT=$(curl -sf "$BASE_URL/api/applications/$APP_ID" 2>/dev/null)
  echo "$RESULT" | grep -q '"success":true' && check "Get application by ID" "$RESULT" || { echo "  ✗ Get application"; FAIL=$((FAIL+1)); }
fi

# 10. Postcode lookup
RESULT=$(curl -sf "$BASE_URL/api/postcode/EH1%201AA" 2>/dev/null)
echo "$RESULT" | grep -q '"addresses"' && check "Postcode lookup returns addresses" "$RESULT" || { echo "  ✗ Postcode lookup"; FAIL=$((FAIL+1)); }

echo ""

# 11. User Service
echo "▸ User Service ($USER_URL)"
RESULT=$(curl -sf "$USER_URL/api/health" 2>/dev/null)
check "User service health" "$RESULT"

RESULT=$(curl -sf -X POST "$USER_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@aib.example.gov.scot","password":"any"}' 2>/dev/null)
echo "$RESULT" | grep -q '"token"' && check "Admin login returns token" "$RESULT" || { echo "  ✗ Admin login"; FAIL=$((FAIL+1)); }

RESULT=$(curl -sf "$USER_URL/api/roles" 2>/dev/null)
echo "$RESULT" | grep -q '"system_admin"' && check "Roles list includes system_admin" "$RESULT" || { echo "  ✗ Roles list"; FAIL=$((FAIL+1)); }

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo "  ⚠ Some tests failed - check service availability"
  exit 1
else
  echo "  ✓ All smoke tests passed!"
  exit 0
fi
