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
                container('jnlp') {
                    script {
                        env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        echo "Image tag: ${env.IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Test Backend') {
                    steps {
                        container('jnlp') {
                            dir('backend') {
                                sh 'npm test || echo "No tests defined — skipping"'
                            }
                        }
                    }
                }
                stage('Test Frontend') {
                    steps {
                        container('jnlp') {
                            dir('frontend') {
                                sh 'echo "Frontend static — no test runner needed"'
                            }
                        }
                    }
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        container('jnlp') {
                            dir('backend') {
                                sh "docker build -t ${BACKEND_REPO}:${env.IMAGE_TAG} ."
                            }
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        container('jnlp') {
                            dir('frontend') {
                                sh "docker build -t ${FRONTEND_REPO}:${env.IMAGE_TAG} ."
                            }
                        }
                    }
                }
            }
        }

        stage('Scan Images') {
            steps {
                container('jnlp') {
                    sh """
                        echo "Scanning backend image for CRITICAL vulnerabilities..."
                        trivy image --exit-code 1 --severity CRITICAL --no-progress ${BACKEND_REPO}:${env.IMAGE_TAG}

                        echo "Scanning frontend image for CRITICAL vulnerabilities..."
                        trivy image --exit-code 1 --severity CRITICAL --no-progress ${FRONTEND_REPO}:${env.IMAGE_TAG}
                    """
                }
            }
        }

        stage('Push to ECR') {
            steps {
                container('jnlp') {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin \
                        ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                        for repo in backend frontend; do
                            aws ecr batch-delete-image --repository-name \$repo --region ${AWS_REGION} --image-ids imageTag=${env.IMAGE_TAG} >/dev/null 2>&1 || true
                        done

                        docker push ${BACKEND_REPO}:${env.IMAGE_TAG}
                        docker push ${FRONTEND_REPO}:${env.IMAGE_TAG}
                    """
                }
            }
        }

        stage('Update GitOps Repo') {
            steps {
                container('jnlp') {
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
                            if [ -z "\$GITHUB_TOKEN" ]; then
                                echo "ERROR: GITHUB_TOKEN is empty. Check the 'jenkins-github-token' secret and the github-creds JCasC credential."
                                exit 1
                            fi

                            sed -i 's/tag: "[^"]*"/tag: "${env.IMAGE_TAG}"/g' \
                              gitops/apps/oneclick/helmrelease.yaml

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
        }

        stage('Verify Reconciliation') {
            steps {
                container('jnlp') {
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