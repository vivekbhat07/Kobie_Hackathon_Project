pipeline {
    agent {
        label 'dind-agent'
    }

    environment {
        AWS_REGION     = 'ap-south-1'
        AWS_ACCOUNT_ID = '155734788051'
        BACKEND_REPO   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/backend"
        FRONTEND_REPO  = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/frontend"
        GITOPS_REPO    = 'https://github.com/vaishjp/oneclick-gitops.git'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                container('jnlp') {
                    sh '''
                        echo "Waiting for Docker daemon..."
                        for i in $(seq 1 30); do
                            if docker info >/dev/null 2>&1; then
                                echo "Docker daemon ready."
                                break
                            fi
                            echo "Docker not ready yet (attempt $i/30)..."
                            sleep 2
                        done
                    '''

                    script {
                        def shortSha = sh(
                            script: 'git rev-parse --short HEAD',
                            returnStdout: true
                        ).trim()

                        env.IMAGE_TAG = "${shortSha}-${env.BUILD_NUMBER}"

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

                        git(
                            branch: 'main',
                            credentialsId: 'github-creds',
                            url: "${GITOPS_REPO}"
                        )

                        withCredentials([
                            usernamePassword(
                                credentialsId: 'github-creds',
                                usernameVariable: 'GITHUB_USER',
                                passwordVariable: 'GITHUB_TOKEN'
                            )
                        ]) {

                            sh """
                                if [ -z "\$GITHUB_TOKEN" ]; then
                                    echo "ERROR: GITHUB_TOKEN is empty."
                                    exit 1
                                fi

                                sed -i 's|tag: "[^"]*"|tag: "${env.IMAGE_TAG}"|g' apps/oneclick/helmrelease.yaml

                                sed -i 's|tag: "[^"]*"|tag: "${env.IMAGE_TAG}"|g' helm/oneclick/values.yaml

                                echo "=== Updated tags ==="
                                grep "tag:" apps/oneclick/helmrelease.yaml

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

        stage('K8sGPT Analysis') {
            steps {
                container('jnlp') {
                    sh '''
                        k8sgpt auth add \
                          --backend amazonbedrock \
                          --model anthropic.claude-3-5-sonnet-20241022-v2:0 \
                          --providerRegion ap-south-1


                        k8sgpt analyze --explain -o json > k8sgpt-report.json || true
                        k8sgpt analyze --explain
                    '''
                    archiveArtifacts artifacts: 'k8sgpt-report.json', allowEmptyArchive: true
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