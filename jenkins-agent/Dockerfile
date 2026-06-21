FROM jenkins/inbound-agent:latest
USER root
# ---- Versions (pin everything explicitly so builds are reproducible) ----
ARG KUBECTL_VERSION=v1.30.0
ARG TRIVY_VERSION=0.71.1
ARG NODE_MAJOR=20
ARG K8SGPT_VERSION=0.4.4
# ---- Base deps used by multiple steps below ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release unzip tar && \
    rm -rf /var/lib/apt/lists/*
# ---- Docker CLI ----
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
        | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*
# ---- AWS CLI v2 ----
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip && \
    unzip -q /tmp/awscliv2.zip -d /tmp && \
    /tmp/aws/install && \
    rm -rf /tmp/awscliv2.zip /tmp/aws && \
    aws --version
# ---- kubectl (pinned version, no extra curl-in-curl) ----
RUN curl -fL -o /usr/local/bin/kubectl \
    "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    chmod +x /usr/local/bin/kubectl && \
    kubectl version --client
# ---- Terraform (pinned version) ----
ARG TERRAFORM_VERSION=1.15.6
RUN curl -fL -o /tmp/terraform.zip \
    "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" && \
    unzip -q /tmp/terraform.zip -d /usr/local/bin && \
    rm -f /tmp/terraform.zip && \
    terraform -version
# ---- Trivy (direct release asset, pinned, verbose on failure) ----
RUN curl -fL -o /tmp/trivy.tar.gz \
    "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" && \
    tar -zxf /tmp/trivy.tar.gz -C /usr/local/bin trivy && \
    rm -f /tmp/trivy.tar.gz && \
    trivy --version
# ---- Node.js (for npm test stage) ----
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    node --version

USER jenkins