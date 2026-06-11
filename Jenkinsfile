pipeline {
agent any

```
environment {
    AWS_REGION = "ap-south-1"
    AWS_ACCOUNT_ID = "155734788051"

    BACKEND_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/backend"
    FRONTEND_REPO = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/frontend"

    IMAGE_TAG = "${BUILD_NUMBER}"
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
                sh "docker build -t ${BACKEND_REPO}:${IMAGE_TAG} ."
            }
        }
    }

    stage('Build Frontend Image') {
        steps {
            dir('frontend') {
                sh "docker build -t ${FRONTEND_REPO}:${IMAGE_TAG} ."
            }
        }
    }

    stage('Login to ECR') {
        steps {
            sh """
            aws ecr get-login-password --region ${AWS_REGION} \
            | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
            """
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
            sed -i '0,/tag:.*/s/tag:.*/tag: ${IMAGE_TAG}/' gitops/helm/oneclick/values.yaml
            sed -i '0,/tag:.*/s/tag:.*/tag: ${IMAGE_TAG}/2' gitops/helm/oneclick/values.yaml
            """
        }
    }

    stage('Commit and Push') {
        steps {
            dir('gitops') {

                sh '''
                git config user.email "vaishjp2005@gmail.com"
                git config user.name "Jenkins"
                '''

                withCredentials([
                    usernamePassword(
                        credentialsId: 'github-creds',
                        usernameVariable: 'GIT_USERNAME',
                        passwordVariable: 'GIT_PASSWORD'
                    )
                ]) {

                    sh '''
                    git add .
                    git commit -m "Update image tags to ${BUILD_NUMBER}" || true

                    git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/vaishjp/oneclick-gitops.git main
                    '''
                }
            }
        }
    }
}

post {
    success {
        echo "Pipeline completed successfully"
    }

    failure {
        echo "Pipeline failed"
    }
}
```

}
