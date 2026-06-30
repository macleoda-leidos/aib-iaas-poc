// Azure Static Web App - Hosts Next.js frontend (free tier)
// Free tier: 100GB bandwidth, 2 custom domains, SSL included

@description('Static Web App name')
param name string

@description('Azure region')
param location string

@description('GitHub repository URL')
param repoUrl string

@description('GitHub token for deployment')
@secure()
param githubToken string

@description('Backend API URL for proxying')
param apiBaseUrl string

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repoUrl != '' ? repoUrl : null
    repositoryToken: githubToken != '' ? githubToken : null
    branch: 'main'
    buildProperties: {
      appLocation: '/apps/web'
      outputLocation: '.next'
      appBuildCommand: 'npm run build'
    }
  }
  tags: {
    project: 'aib-iaas'
    component: 'frontend'
  }
}

// Linked backend for API proxying
resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2022-09-01' = if (apiBaseUrl != '') {
  parent: staticWebApp
  name: 'api-backend'
  properties: {
    backendResourceId: ''
    region: location
  }
}

output defaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppId string = staticWebApp.id
