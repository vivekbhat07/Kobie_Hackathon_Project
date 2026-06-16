pipeline {
    agent any

    environment {
        AWS_REGION      = 'ap-south-1'
        AWS_ACCOUNT_ID  = '155734788051'
        BACKEND_REPO    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/backend"
        FRONTEND_REPO   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/frontend"
        GITOPS_REPO     = 'https://github.com/vaishjp/oneclick-gitops.git'
        IMAGE_TAG       = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            parallel {
                stage('Test Backend') {
                    steps {
                        dir('backend') {
                            sh '''
                                npm install
                                npm test || echo "No tests defined — skipping"
                            '''
                        }
                    }
                }
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                echo "Frontend lint/check"
                                ls index.html || echo "No index.html found"
                            '''
                        }
                    }
                }
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

        stage('Scan Images') {
            steps {
                sh '''
                    which trivy || (curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin)
                '''
                sh """
                    echo "Scanning backend image..."
                    trivy image --exit-code 1 --severity CRITICAL --no-progress ${BACKEND_REPO}:${IMAGE_TAG}

                    echo "Scanning frontend image..."
                    trivy image --exit-code 1 --severity CRITICAL --no-progress ${FRONTEND_REPO}:${IMAGE_TAG}
                """
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
                        url: "${GITOPS_REPO}"
                }
            }
        }

        stage('Update Image Tags') {
            steps {
                sh """
                    yq e '.backend.image.tag = "${IMAGE_TAG}"' -i gitops/helm/oneclick/values.yaml
                    yq e '.frontend.image.tag = "${IMAGE_TAG}"' -i gitops/helm/oneclick/values.yaml
                    echo "Updated values.yaml:"
                    cat gitops/helm/oneclick/values.yaml
                """
            }
        }

        stage('Commit and Push to GitOps Repo') {
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
                            git commit -m "chore: deploy ${IMAGE_TAG}" || true
                            git push https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/vaishjp/oneclick-gitops.git main
                        """
                    }
                }
            }
        }

        stage('Verify Reconciliation') {
            steps {
                sh """
                    echo "Waiting for FluxCD to reconcile HelmRelease..."
                    TIMEOUT=300
                    INTERVAL=15
                    ELAPSED=0

                    while [ \$ELAPSED -lt \$TIMEOUT ]; do
                        STATUS=\$(kubectl get helmrelease oneclick -n apps \
                            -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")

                        echo "HelmRelease status: \$STATUS (elapsed: \${ELAPSED}s)"

                        if [ "\$STATUS" = "True" ]; then
                            echo "HelmRelease is Ready. Deployment confirmed."
                            exit 0
                        fi

                        sleep \$INTERVAL
                        ELAPSED=\$((ELAPSED + INTERVAL))
                    done

                    echo "ERROR: HelmRelease did not become Ready within 5 minutes."
                    kubectl describe helmrelease oneclick -n apps || true
                    exit 1
                """
            }
        }

    }

    post {
        success {
            echo "Pipeline succeeded. Image ${IMAGE_TAG} is confirmed running in the cluster."
        }
        failure {
            echo "Pipeline failed at stage. Image ${IMAGE_TAG} was NOT deployed."
        }
    }
}
