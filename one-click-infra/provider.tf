terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
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
  region = "ap-south-1"
}
