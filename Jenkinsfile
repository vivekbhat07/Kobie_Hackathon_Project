
pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '155734788051'

        BACKEND_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/backend"
        FRONTEND_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/frontend"
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
                    bat "docker build -t %BACKEND_REPO%:${BUILD_NUMBER} ."
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    bat "docker build -t %FRONTEND_REPO%:${BUILD_NUMBER} ."
                }
            }
        }

        stage('Login to ECR') {
            steps {
                bat """
                aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com
                """
            }
        }

        stage('Push Images to ECR') {
            steps {
                bat "docker push %BACKEND_REPO%:${BUILD_NUMBER}"
                bat "docker push %FRONTEND_REPO%:${BUILD_NUMBER}"
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
                powershell '''
                (Get-Content gitops\\helm\\oneclick\\values.yaml) `
                -replace 'tag: latest','tag: ${env:BUILD_NUMBER}' |
                Set-Content gitops\\helm\\oneclick\\values.yaml
                '''
            }
        }

        stage('Commit and Push') {
            steps {
                dir('gitops') {

                    bat 'git config user.email "vaishjp2005@gmail.com"'
                    bat 'git config user.name "Jenkins"'

                    bat 'git add .'

                    bat """
                    git commit -m "Update image tags to ${BUILD_NUMBER}" || exit 0
                    """

                    withCredentials([
                        usernamePassword(
                            credentialsId: 'github-creds',
                            usernameVariable: 'GIT_USERNAME',
                            passwordVariable: 'GIT_PASSWORD'
                        )
                    ]) {

                        bat """
                        git push https://%GIT_USERNAME%:%GIT_PASSWORD%@github.com/vaishjp/oneclick-gitops.git main
                        """
                    }
                }
            }
        }
    }
}

