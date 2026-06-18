output "vpc_id" {
  value = aws_vpc.main.id
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_oidc_issuer" {
  value = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "cluster_autoscaler_role_arn" {
  value = aws_iam_role.cluster_autoscaler_irsa.arn
}

output "eso_role_arn" {
  value = aws_iam_role.eso_irsa.arn
}

output "jenkins_role_arn" {
  value = aws_iam_role.jenkins_irsa.arn
}

output "backend_role_arn" {
  value = aws_iam_role.backend_irsa.arn
}