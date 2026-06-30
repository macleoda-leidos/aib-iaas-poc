// AiB IAAS POC - Azure Infrastructure (Free Tier)
// Deploys: Container Apps (API) + Static Web App (Frontend) + Storage (Data)

targetScope = 'resourceGroup'

@description('Environment name')
param environment string = 'poc'

@description('Azure region')
param location string = resourceGroup().location

@description('Container image for the API')
param apiImage string = 'ghcr.io/aib-iaas/consolidated-api:latest'

@description('GitHub repository URL for Static Web App')
param repoUrl string = ''

@description('GitHub token for SWA deployment')
@secure()
param githubToken string = ''

var projectName = 'aib-iaas'
var resourcePrefix = '${projectName}-${environment}'

// ===== STORAGE (Azure Files for SQLite persistence) =====
module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    name: replace('${resourcePrefix}store', '-', '')
    location: location
    shareName: 'iaas-data'
  }
}

// ===== CONTAINER APPS ENVIRONMENT =====
module containerApps 'modules/container-apps.bicep' = {
  name: 'container-apps-deployment'
  params: {
    environmentName: '${resourcePrefix}-env'
    location: location
    apiImage: apiImage
    storageAccountName: storage.outputs.storageAccountName
    storageAccountKey: storage.outputs.storageAccountKey
    shareName: 'iaas-data'
  }
}

// ===== STATIC WEB APP (Frontend) =====
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'static-web-app-deployment'
  params: {
    name: '${resourcePrefix}-web'
    location: location
    repoUrl: repoUrl
    githubToken: githubToken
    apiBaseUrl: containerApps.outputs.apiUrl
  }
}

// ===== OUTPUTS =====
output apiUrl string = containerApps.outputs.apiUrl
output webUrl string = staticWebApp.outputs.defaultHostname
output storageAccount string = storage.outputs.storageAccountName
