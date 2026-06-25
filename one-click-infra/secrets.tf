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
variable "grafana_password" {
  type      = string
  sensitive = true
}

resource "aws_secretsmanager_secret" "grafana_password" {
  name                    = "oneclick/grafana-password"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "grafana_password" {
  secret_id     = aws_secretsmanager_secret.grafana_password.id
  secret_string = jsonencode({
    password = var.grafana_password
  })
}

resource "aws_secretsmanager_secret" "infracost_api" {
  name                    = "oneclick/infracost-api-key"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "infracost_api" {
  secret_id     = aws_secretsmanager_secret.infracost_api.id   # ← need .id
  secret_string = jsonencode({                                  # ← jsonencode not jsondecode
    password = "ico-6MABJGZ3wSdAW4pdkxixQVR7hnpRubVZ"         # ← value must be a string
  })
}