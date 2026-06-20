resource "aws_iam_role" "eks_cluster_role" {
  name = "oneclick-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_policy" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "eks_node_role" {
  name = "oneclick-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "worker_node_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "cni_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "ecr_read_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

data "tls_certificate" "eks_oidc" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks_oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_oidc.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name = "oneclick-eks-oidc"
  }
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name = "oneclick-cluster-autoscaler"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeImages",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeLaunchTemplateVersions",
        "ec2:GetInstanceTypesFromInstanceRequirements",
        "eks:DescribeNodegroup"
      ]
      Resource = ["*"]
    }]
  })
}

resource "aws_iam_role" "cluster_autoscaler_irsa" {
  name = "oneclick-cluster-autoscaler-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks_oidc.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler_attach" {
  role       = aws_iam_role.cluster_autoscaler_irsa.name
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
}

resource "aws_iam_policy" "eso_secretsmanager" {
  name = "oneclick-eso-secretsmanager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = "arn:aws:secretsmanager:${var.region}:*:secret:oneclick/*"
    }]
  })
}

resource "aws_iam_role" "eso_irsa" {
  name = "oneclick-eso-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks_oidc.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:sub" = "system:serviceaccount:external-secrets:external-secrets"
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eso_attach" {
  role       = aws_iam_role.eso_irsa.name
  policy_arn = aws_iam_policy.eso_secretsmanager.arn
}

resource "aws_iam_policy" "jenkins_ecr" {
  name = "oneclick-jenkins-ecr"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_policy" "jenkins_eks" {
  name = "oneclick-jenkins-eks"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "eks:DescribeCluster"
      ]
      Resource = aws_eks_cluster.main.arn
    }]
  })
}

resource "aws_iam_role" "jenkins_irsa" {
  name = "oneclick-jenkins-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks_oidc.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:sub" = "system:serviceaccount:jenkins:jenkins"
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_attach" {
  role       = aws_iam_role.jenkins_irsa.name
  policy_arn = aws_iam_policy.jenkins_ecr.arn
}

resource "aws_iam_role_policy_attachment" "jenkins_eks_attach" {
  role       = aws_iam_role.jenkins_irsa.name
  policy_arn = aws_iam_policy.jenkins_eks.arn
}

resource "aws_eks_access_entry" "jenkins" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.jenkins_irsa.arn
  user_name     = "jenkins-pipeline"
}

resource "aws_eks_access_policy_association" "jenkins_view" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.jenkins_irsa.arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy"

  access_scope {
    type = "cluster"
  }
}

resource "aws_iam_policy" "backend_app" {
  name = "oneclick-backend-app"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue"
      ]
      Resource = "arn:aws:secretsmanager:${var.region}:*:secret:oneclick/*"
    }]
  })
}

resource "aws_iam_role" "backend_irsa" {
  name = "oneclick-backend-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks_oidc.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:sub" = "system:serviceaccount:default:backend"
          "${replace(aws_iam_openid_connect_provider.eks_oidc.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backend_attach" {
  role       = aws_iam_role.backend_irsa.name
  policy_arn = aws_iam_policy.backend_app.arn
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions_ecr" {
  name = "oneclick-github-actions-ecr"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:vaishjp/Kobie_Hackathon_Project:*"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_ecr_attach" {
  role       = aws_iam_role.github_actions_ecr.name
  policy_arn = aws_iam_policy.jenkins_ecr.arn
}

resource "aws_iam_policy" "jenkins_secretsmanager" {
  name = "oneclick-jenkins-secretsmanager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = "arn:aws:secretsmanager:ap-south-1:*:secret:oneclick/github-pat*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_secretsmanager_attach" {
  role       = aws_iam_role.jenkins_irsa.name
  policy_arn = aws_iam_policy.jenkins_secretsmanager.arn
}

resource "aws_iam_policy" "jenkins_tfstate" {
  name = "oneclick-jenkins-tfstate"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::oneclick-tfstate-155734788051",
          "arn:aws:s3:::oneclick-tfstate-155734788051/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_tfstate_attach" {
  role       = aws_iam_role.jenkins_irsa.name
  policy_arn = aws_iam_policy.jenkins_tfstate.arn
}

resource "aws_iam_role_policy_attachment" "jenkins_readonly" {
  role       = aws_iam_role.jenkins_irsa.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_policy" "jenkins_secretsmanager_readall" {
  name = "oneclick-jenkins-secretsmanager-readall"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetResourcePolicy"
        ]
        Resource = "arn:aws:secretsmanager:ap-south-1:155734788051:secret:oneclick/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_secretsmanager_readall_attach" {
  role       = aws_iam_role.jenkins_irsa.name
  policy_arn = aws_iam_policy.jenkins_secretsmanager_readall.arn
}

resource "aws_iam_policy" "jenkins_bedrock" {
  name = "oneclick-jenkins-bedrock"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel"
      ]
      Resource = "arn:aws:bedrock:${var.region}::foundation-model/*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "jenkins_bedrock_attach" {
  role       = aws_iam_role.jenkins_irsa.name
  policy_arn = aws_iam_policy.jenkins_bedrock.arn
}