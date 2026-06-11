output "vpc_id" {
  value = aws_vpc.main.id
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "jenkins_public_ip" {
  value = aws_instance.jenkins.public_ip
}