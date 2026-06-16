
pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '155734788051'

        BACKEND_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/backend"
        FRONTEND_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/frontend"

        IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh """
                    docker build -t ${BACKEND_REPO}:${IMAGE_TAG} .
                    """
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh """
                    docker build -t ${FRONTEND_REPO}:${IMAGE_TAG} .
                    """
                }
            }
        }

        stage('Login to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_KEY')
                ]) {

                    sh """
                    export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY}
                    export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_KEY}

                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    """
                }
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh """
                docker push ${BACKEND_REPO}:${IMAGE_TAG}
                docker push ${FRONTEND_REPO}:${IMAGE_TAG}
                """
            }
        }

        stage('Clone GitOps Repo') {
            steps {
                dir('gitops') {
                    git branch: 'main',
                        credentialsId: 'github-creds',
                        url: 'https://github.com/vaishjp/oneclick-gitops.git'
                }
            }
        }

        stage('Update values.yaml') {
            steps {
                sh """
                yq e '.backend.image.tag = "${IMAGE_TAG}"' -i gitops/helm/oneclick/values.yaml
                yq e '.frontend.image.tag = "${IMAGE_TAG}"' -i gitops/helm/oneclick/values.yaml

                echo "Updated values.yaml:"
                cat gitops/helm/oneclick/values.yaml
                """
            }
        }

        stage('Commit and Push') {
            steps {
                dir('gitops') {

                    sh """
                    git config user.email "vaishjp2005@gmail.com"
                    git config user.name "Jenkins"
                    """

                    withCredentials([
                        usernamePassword(
                            credentialsId: 'github-creds',
                            usernameVariable: 'GITHUB_USER',
                            passwordVariable: 'GITHUB_TOKEN'
                        )
                    ]) {

                        sh """
                        git add .
                        git commit -m "Update image tag to ${IMAGE_TAG}" || true

                        git push https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/vaishjp/oneclick-gitops.git main
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully'
        }

        failure {
            echo 'Pipeline failed'
        }
    }
}

