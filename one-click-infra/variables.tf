variable "region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "oneclick-cluster"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "node_instance_types" {
  description = "EC2 instance types for the EKS managed node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes (Cluster Autoscaler floor)"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes (Cluster Autoscaler ceiling)"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "17.5"
}

variable "db_multi_az" {
  description = "Whether RDS runs Multi-AZ for high availability"
  type        = bool
  default     = false
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS — pass via TF_VAR_db_password env var, never commit to .tfvars"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "github_owner" {
  type    = string
  default = "vaishjp"
}

variable "gitops_repo_name" {
  type    = string
  default = "oneclick-gitops"
}

variable "gitops_branch" {
  type    = string
  default = "main"
}

variable "gitops_path" {
  type    = string
  default = "./clusters/my-cluster"
}

variable "github_pat" {
  description = "GitHub PAT for Jenkins GitOps pushes — pass via TF_VAR_github_pat env var, never commit"
  type        = string
  sensitive   = true
}