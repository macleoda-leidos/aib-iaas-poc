# AiB IAAS - FAT (Functional Acceptance Testing) Environment
# Smallest viable deployment for automated testing

terraform {
  backend "s3" {
    bucket = "aib-iaas-terraform-state"
    key    = "fat/terraform.tfstate"
    region = "eu-west-2"
  }
}

provider "aws" {
  region = "eu-west-2" # London

  default_tags {
    tags = {
      Project     = "aib-iaas"
      Environment = "fat"
      ManagedBy   = "terraform"
      CostCentre  = "aib-digital"
    }
  }
}

module "networking" {
  source      = "../../modules/networking"
  environment = "fat"
  vpc_cidr    = "10.1.0.0/16"
}

module "compute" {
  source                = "../../modules/compute"
  environment           = "fat"
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  ecs_security_group_id = module.networking.ecs_security_group_id
  cpu                   = 256
  memory                = 512
}

module "storage" {
  source             = "../../modules/storage"
  environment        = "fat"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
}

output "alb_url" { value = "http://${module.compute.alb_dns_name}" }
