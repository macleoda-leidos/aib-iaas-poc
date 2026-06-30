#!/bin/bash
# AiB IAAS POC - Start All Services
# Starts all backend services in the correct order

PROJ_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  AiB IAAS POC - Starting All Services               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Kill any existing services on our ports
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3011 3012; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Killing existing process on port $port (PID: $pid)"
    kill $pid 2>/dev/null
  fi
done

sleep 1

# Start services (order matters)
start_service() {
  local name="$1"
  local dir="$2"
  echo "Starting $name..."
  cd "$PROJ_ROOT/services/$dir" && npx tsx src/index.ts > /dev/null 2>&1 &
  echo "  PID: $!"
}

start_service "Mock Integrations (3005)" "mock-integrations"
start_service "Recommendation (3002)" "recommendation-service"
start_service "Document (3003)" "document-service"
start_service "Payment (3006)" "payment-service"
start_service "Audit (3007)" "audit-service"
start_service "Credit Check (3008)" "credit-check-service"
start_service "Organisation (3009)" "organisation-service"
start_service "User (3011)" "user-service"
start_service "Notification (3012)" "notification-service"

sleep 3

start_service "Integration Orchestrator (3004)" "integration-orchestrator"
start_service "API Gateway (3001)" "api-gateway"

echo ""
echo "All services starting. Waiting for readiness..."
sleep 5

echo ""
echo "Service status:"
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3011 3012; do
  status=$(curl -sf "http://localhost:$port/api/health" 2>/dev/null | grep -o '"healthy"' || echo '"DOWN"')
  printf "  Port %s: %s\n" "$port" "$status"
done

echo ""
echo "Services running. Press Ctrl+C to stop all."
echo "Web portal: cd apps/web && npm run dev"
echo "Admin portal: cd apps/admin && npm run dev"
wait
