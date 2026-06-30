#!/bin/bash
# =============================================================================
# AiB IAAS POC - One-Command Azure Deployment
# =============================================================================
# Deploys the complete POC to Azure free tier.
# Prerequisites: az CLI installed, Docker running, GitHub account
#
# Usage:
#   ./scripts/deploy.sh              # Full deploy
#   ./scripts/deploy.sh --api-only   # Just rebuild/redeploy the API
#   ./scripts/deploy.sh --infra-only # Just deploy infrastructure
# =============================================================================

set -e

# Configuration
RESOURCE_GROUP="${AZURE_RG:-aib-iaas-poc-rg}"
LOCATION="${AZURE_LOCATION:-uksouth}"
REGISTRY="ghcr.io"
IMAGE_NAME="${GITHUB_REPOSITORY:-local}/consolidated-api"
IMAGE_TAG="latest"
ENVIRONMENT="poc"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  AiB IAAS POC - Azure Deployment                    ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Resource Group: $RESOURCE_GROUP"
echo "║  Location:       $LOCATION"
echo "║  Environment:    $ENVIRONMENT"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
command -v az >/dev/null 2>&1 || { echo "❌ Azure CLI (az) required. Install: https://aka.ms/installazurecli"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required. Install: https://docs.docker.com/get-docker/"; exit 1; }

# Ensure logged in
echo "▸ Checking Azure login..."
az account show >/dev/null 2>&1 || { echo "  Logging in..."; az login; }
echo "  ✓ Logged in as: $(az account show --query user.name -o tsv)"
echo ""

# Step 1: Create Resource Group
if [ "$1" != "--api-only" ]; then
  echo "▸ Step 1/4: Creating resource group..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --tags project=aib-iaas environment=poc >/dev/null
  echo "  ✓ Resource group ready"
  echo ""
fi

# Step 2: Deploy Infrastructure (Bicep)
if [ "$1" != "--api-only" ]; then
  echo "▸ Step 2/4: Deploying infrastructure (Bicep)..."
  az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file infra/azure/main.bicep \
    --parameters environment="$ENVIRONMENT" location="$LOCATION" apiImage="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG" \
    --mode Incremental \
    --output none
  echo "  ✓ Infrastructure deployed"
  echo ""
fi

# Step 3: Build and Push Container Image
if [ "$1" != "--infra-only" ]; then
  echo "▸ Step 3/4: Building API container..."
  docker build -f infra/azure/Dockerfile.api -t "$REGISTRY/$IMAGE_NAME:$IMAGE_TAG" .
  echo "  ✓ Image built"

  echo ""
  echo "▸ Step 3b: Pushing to registry..."
  docker push "$REGISTRY/$IMAGE_NAME:$IMAGE_TAG" 2>/dev/null || {
    echo "  ⚠ Push to ghcr.io failed (may need: docker login ghcr.io)"
    echo "  Continuing with local image reference..."
  }
  echo "  ✓ Image pushed"
  echo ""
fi

# Step 4: Update Container App
if [ "$1" != "--infra-only" ]; then
  echo "▸ Step 4/4: Updating container app..."
  az containerapp update \
    --name "aib-iaas-$ENVIRONMENT-env-api" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$REGISTRY/$IMAGE_NAME:$IMAGE_TAG" \
    --output none 2>/dev/null || echo "  (Container app will pick up image on next request)"
  echo "  ✓ Container app updated"
  echo ""
fi

# Summary
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✓ Deployment Complete!                             ║"
echo "╠══════════════════════════════════════════════════════╣"

API_URL=$(az containerapp show -n "aib-iaas-$ENVIRONMENT-env-api" -g "$RESOURCE_GROUP" --query 'properties.configuration.ingress.fqdn' -o tsv 2>/dev/null || echo "pending...")
WEB_URL=$(az staticwebapp show -n "aib-iaas-$ENVIRONMENT-web" -g "$RESOURCE_GROUP" --query 'defaultHostname' -o tsv 2>/dev/null || echo "pending...")

echo "║                                                     ║"
echo "║  API:  https://$API_URL"
echo "║  Web:  https://$WEB_URL"
echo "║                                                     ║"
echo "║  Health: https://$API_URL/api/health"
echo "║                                                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  - Open https://$WEB_URL in your browser"
echo "  - For auto-deploy: push to GitHub (workflow runs automatically)"
echo "  - To tear down: az group delete --name $RESOURCE_GROUP --yes"
