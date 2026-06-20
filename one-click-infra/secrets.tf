resource "aws_secretsmanager_secret" "github_pat" {
  name                    = "oneclick/github-pat"
  recovery_window_in_days = 0   # instant delete so re-apply doesn't conflict
}
resource "aws_secretsmanager_secret_version" "github_pat" {
  secret_id     = aws_secretsmanager_secret.github_pat.id
  secret_string = jsonencode({
    token = var.github_pat
  })
}
resource "aws_secretsmanager_secret" "jenkins_admin" {
  name                    = "oneclick/jenkins-admin"
  recovery_window_in_days = 0
}
resource "aws_secretsmanager_secret_version" "jenkins_admin" {
  secret_id     = aws_secretsmanager_secret.jenkins_admin.id
  secret_string = jsonencode({
    password = var.jenkins_admin_password
  })
}
variable "groq_api_key" {
  type      = string
  sensitive = true
}
resource "aws_secretsmanager_secret" "groq_key" {
  name                    = "oneclick/groq-key"
  recovery_window_in_days = 0
}
resource "aws_secretsmanager_secret_version" "groq_key" {
  secret_id = aws_secretsmanager_secret.groq_key.id
  secret_string = jsonencode({
    key = var.groq_api_key
  })
}