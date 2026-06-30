// Azure Files Storage for SQLite database persistence

@description('Storage account name (must be globally unique, lowercase, no dashes)')
param name string

@description('Azure region')
param location string

@description('File share name')
param shareName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: name
  location: location
  sku: {
    name: 'Standard_LRS' // Locally redundant - cheapest, fine for POC
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
  tags: {
    project: 'aib-iaas'
    environment: 'poc'
    managedBy: 'bicep'
  }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource fileShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-01-01' = {
  parent: fileService
  name: shareName
  properties: {
    shareQuota: 1 // 1 GB - more than enough for SQLite POC data
    accessTier: 'Cool'
  }
}

output storageAccountName string = storageAccount.name
output storageAccountKey string = storageAccount.listKeys().keys[0].value
output fileShareName string = fileShare.name
