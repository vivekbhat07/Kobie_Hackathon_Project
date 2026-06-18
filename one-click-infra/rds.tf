resource "aws_db_subnet_group" "main" {
  name = "db-subnet-group"

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  tags = {
    Name = "db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "oneclick-postgres"

  engine         = "postgres"
  engine_version = var.db_engine_version

  instance_class = var.db_instance_class

  allocated_storage = 20
  storage_type       = "gp3"

  multi_az = var.db_multi_az

  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  publicly_accessible  = false
  skip_final_snapshot  = true
  deletion_protection  = false

  tags = {
    Name = "oneclick-postgres"
  }
}