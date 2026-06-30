// Azure Container Apps - Hosts the consolidated API (free tier)
// Free tier: 180,000 vCPU-seconds and 360,000 GiB-seconds per month

@description('Container Apps Environment name')
param environmentName string

@description('Azure region')
param location string

@description('API container image')
param apiImage string

@description('Storage account name for Azure Files mount')
param storageAccountName string

@description('Storage account key')
@secure()
param storageAccountKey string

@description('File share name')
param shareName string

// Log Analytics Workspace (required by Container Apps)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
  tags: {
    project: 'aib-iaas'
    environment: 'poc'
  }
}

// Mount Azure Files as storage for SQLite databases
resource storageMount 'Microsoft.App/managedEnvironments/storages@2023-05-01' = {
  parent: containerAppEnv
  name: 'iaas-data'
  properties: {
    azureFile: {
      accountName: storageAccountName
      accountKey: storageAccountKey
      shareName: shareName
      accessMode: 'ReadWrite'
    }
  }
}

// Container App - Consolidated API
resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${environmentName}-api'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: apiImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'PORT', value: '3001' }
            { name: 'NODE_ENV', value: 'production' }
            { name: 'DATABASE_PATH', value: '/data/iaas.db' }
            { name: 'MOCK_LATENCY_MIN_MS', value: '50' }
            { name: 'MOCK_LATENCY_MAX_MS', value: '150' }
            { name: 'MOCK_FAILURE_RATE', value: '0' }
            { name: 'UPLOAD_PATH', value: '/data/uploads' }
            { name: 'SCANNER_MODE', value: 'placeholder' }
          ]
          volumeMounts: [
            {
              volumeName: 'data'
              mountPath: '/data'
            }
          ]
        }
      ]
      volumes: [
        {
          name: 'data'
          storageName: 'iaas-data'
          storageType: 'AzureFile'
        }
      ]
      scale: {
        minReplicas: 0 // Scale to zero when idle (saves free tier budget)
        maxReplicas: 1
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: [storageMount]
  tags: {
    project: 'aib-iaas'
    service: 'consolidated-api'
  }
}

output apiUrl string = 'https://${apiApp.properties.configuration.ingress.fqdn}'
output environmentId string = containerAppEnv.id
