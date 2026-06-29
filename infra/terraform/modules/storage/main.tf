# AiB IAAS - Storage Module
# S3 for documents, RDS for structured data (production path)

variable "project_name" { default = "aib-iaas" }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }

# S3 Bucket for document storage
resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-${var.environment}-documents"

  tags = {
    Environment = var.environment
    Project     = var.project_name
    DataClass   = "sensitive"
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# RDS PostgreSQL (production path - NOT free tier beyond 12 months)
# For POC: use SQLite locally, this defines the production target
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db"
  subnet_ids = var.private_subnet_ids
}

resource "aws_db_instance" "main" {
  # NOTE: db.t3.micro is free-tier eligible for 12 months
  # After that, this incurs cost. For ongoing free POC, use SQLite + docker-compose.
  identifier     = "${var.project_name}-${var.environment}-db"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.environment == "fat" ? "db.t3.micro" : "db.t3.small"

  allocated_storage = 20
  storage_encrypted = true

  db_name  = "iaas"
  username = "iaas_admin"
  password = "CHANGE_ME_USE_SECRETS_MANAGER" # In production: aws_secretsmanager_secret

  db_subnet_group_name   = aws_db_subnet_group.main.name
  skip_final_snapshot    = var.environment != "prod"
  deletion_protection    = var.environment == "prod"

  tags = { Environment = var.environment }
}

output "s3_bucket_name" { value = aws_s3_bucket.documents.bucket }
output "s3_bucket_arn" { value = aws_s3_bucket.documents.arn }
output "db_endpoint" { value = aws_db_instance.main.endpoint }
