terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "oneclick-tfstate-155734788051"
    key            = "oneclick/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "oneclick-tfstate-lock"
    encrypt        = true
  }

  backend "s3" {
    bucket         = "oneclick-tfstate-155734788051"
    key            = "oneclick/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "oneclick-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
<<<<<<< HEAD
  region = "ap-south-1"
}
=======
  region = var.region
}
>>>>>>> ee3be57 (Update Terraform infrastructure configuration)
