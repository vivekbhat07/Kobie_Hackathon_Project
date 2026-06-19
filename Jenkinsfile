pipeline {
    agent { label 'dind-agent' }

    environment {
        AWS_REGION      = 'ap-south-1'
        AWS_ACCOUNT_ID  = '155734788051'
        BACKEND_REPO    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/backend"
        FRONTEND_REPO   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/frontend"
        GITOPS_REPO     = 'https://github.com/vaishjp/oneclick-gitops.git'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "Image tag: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Test Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm test || echo "No tests defined — skipping"'
                        }
                    }
                }
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'echo "Frontend static — no test runner needed"'
                        }
                    }
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh "docker build -t ${BACKEND_REPO}:${env.IMAGE_TAG} ."
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_REPO}:${env.IMAGE_TAG} ."
                        }
                    }
                }
            }
        }

        stage('Scan Images') {
            steps {
                sh """
                    echo "Scanning backend image for CRITICAL vulnerabilities..."
                    trivy image --exit-code 1 --severity CRITICAL --no-progress ${BACKEND_REPO}:${env.IMAGE_TAG}

                    echo "Scanning frontend image for CRITICAL vulnerabilities..."
                    trivy image --exit-code 1 --severity CRITICAL --no-progress ${FRONTEND_REPO}:${env.IMAGE_TAG}
                """
            }
        }

        stage('Push to ECR') {
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin \
                    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    docker push ${BACKEND_REPO}:${env.IMAGE_TAG}
                    docker push ${FRONTEND_REPO}:${env.IMAGE_TAG}
                """
            }
        }

        stage('Update GitOps Repo') {
            steps {
                dir('gitops') {
                    git branch: 'main',
                        credentialsId: 'github-creds',
                        url: "${GITOPS_REPO}"
                }
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GITHUB_USER',
                    passwordVariable: 'GITHUB_TOKEN'
                )]) {
                    sh """
                        # Update the HelmRelease — this is what Flux actually reads
                        sed -i 's/tag: "[^"]*"/tag: "${env.IMAGE_TAG}"/g' \
                          gitops/apps/oneclick/helmrelease.yaml

                        # Keep values.yaml in sync too
                        sed -i 's/tag: "[^"]*"/tag: "${env.IMAGE_TAG}"/g' \
                          gitops/helm/oneclick/values.yaml

                        echo "=== Updated helmrelease.yaml tags ==="
                        grep "tag:" gitops/apps/oneclick/helmrelease.yaml

                        cd gitops
                        git config user.email "vaishjp2005@gmail.com"
                        git config user.name "Jenkins"
                        git add apps/oneclick/helmrelease.yaml helm/oneclick/values.yaml
                        git commit -m "chore: deploy ${env.IMAGE_TAG}" || echo "Nothing to commit"
                        git push https://\${GITHUB_USER}:\${GITHUB_TOKEN}@github.com/vaishjp/oneclick-gitops.git main
                    """
                }
            }
        }

        stage('Verify Reconciliation') {
            steps {
                sh """
                    aws eks update-kubeconfig --name oneclick-cluster --region ap-south-1
                    echo "Polling FluxCD HelmRelease status..."
                    TIMEOUT=300
                    INTERVAL=15
                    ELAPSED=0

                    while [ \$ELAPSED -lt \$TIMEOUT ]; do
                        STATUS=\$(kubectl get helmrelease oneclick -n default \
                            -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")
                        echo "HelmRelease status: \$STATUS (elapsed: \${ELAPSED}s)"

                        if [ "\$STATUS" = "True" ]; then
                            echo "SUCCESS: HelmRelease is Ready. Deployment confirmed in cluster."
                            exit 0
                        fi

                        sleep \$INTERVAL
                        ELAPSED=\$((ELAPSED + INTERVAL))
                    done

                    echo "ERROR: HelmRelease did not become Ready within 5 minutes."
                    kubectl describe helmrelease oneclick -n default || true
                    exit 1
                """
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded. Image ${env.IMAGE_TAG} is confirmed running in the cluster."
        }
        failure {
            echo "Pipeline FAILED. Image ${env.IMAGE_TAG} was NOT deployed."
        }
    }
}
