# AiB IAAS - Compute Module (ECS Fargate)
# NOTE: ECS Fargate is NOT free tier. For free-tier POC, use docker-compose locally.
# This module defines the production-ready path.

variable "project_name" { default = "aib-iaas" }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "alb_security_group_id" { type = string }
variable "ecs_security_group_id" { type = string }
variable "container_image_tag" { default = "latest" }
variable "cpu" { default = 256 }
variable "memory" { default = 512 }

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# ALB
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  tags = { Environment = var.environment }
}

resource "aws_lb_target_group" "api_gateway" {
  name        = "${var.project_name}-${var.environment}-api"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_gateway.arn
  }
}

# ECS Task Definition for API Gateway (example - replicate pattern for each service)
resource "aws_ecs_task_definition" "api_gateway" {
  family                   = "${var.project_name}-${var.environment}-api-gateway"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name  = "api-gateway"
    image = "${aws_ecr_repository.services["api-gateway"].repository_url}:${var.container_image_tag}"
    portMappings = [{ containerPort = 3001, protocol = "tcp" }]
    environment = [
      { name = "PORT", value = "3001" },
      { name = "NODE_ENV", value = var.environment },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}/${var.environment}/api-gateway"
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# ECR Repositories
resource "aws_ecr_repository" "services" {
  for_each = toset(["api-gateway", "recommendation-service", "document-service", "integration-orchestrator", "payment-service", "audit-service", "mock-integrations"])

  name                 = "${var.project_name}/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration { scan_on_push = true }
}

# IAM Role for ECS
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_region" "current" {}

output "alb_dns_name" { value = aws_lb.main.dns_name }
output "cluster_name" { value = aws_ecs_cluster.main.name }
