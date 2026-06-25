resource "null_resource" "bootstrap_bridge" {
  triggers = {
    cluster_endpoint  = aws_eks_cluster.main.endpoint
    node_group_status = aws_eks_node_group.main.id
  }

  depends_on = [
    aws_eks_node_group.main,
    aws_iam_openid_connect_provider.eks_oidc
  ]

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = <<-EOT
      set -euo pipefail

      # ── Update kubeconfig ──────────────────────────────────────────────────
      aws eks update-kubeconfig \
        --name ${aws_eks_cluster.main.name} \
        --region ${var.aws_region}

      # ── Wait for all nodes to be Ready ────────────────────────────────────
      echo "Waiting for nodes to be Ready..."
      for i in $(seq 1 30); do
        total=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
        ready=$(kubectl get nodes --no-headers 2>/dev/null | awk '$2=="Ready"' | wc -l)
        if [ "$total" -gt 0 ] && [ "$ready" -eq "$total" ]; then
          echo "All $total node(s) Ready."
          break
        fi
        echo "Nodes ready: $ready/$total (attempt $i/30)"
        sleep 10
      done

      # ── Install Flux CLI if missing ────────────────────────────────────────
      if ! command -v flux &>/dev/null; then
        echo "Flux CLI not found - installing..."
        curl -s https://fluxcd.io/install.sh | bash
        export PATH="$HOME/.local/bin:$PATH"
      fi

      # ── Bootstrap or reconcile FluxCD ─────────────────────────────────────
      flux_ns=$(kubectl get namespace flux-system 2>/dev/null || true)
      source_ctrl=$(kubectl get deployment -n flux-system source-controller 2>/dev/null || true)

      if [ -n "$flux_ns" ] && [ -n "$source_ctrl" ]; then
        echo "FluxCD already present - reconciling."
      else
        echo "FluxCD not found - bootstrapping."
        flux bootstrap github \
          --owner=vivekbhat07 \
          --repository=oneclick-gitops \
          --branch=main \
          --path=clusters/my-cluster \
          --personal
      fi

      # ── Create apps Kustomization if missing ──────────────────────────────
      apps_ks=$(kubectl get kustomization apps -n flux-system 2>/dev/null || true)
      if [ -z "$apps_ks" ]; then
        echo "apps Kustomization missing - creating it."
        flux create kustomization apps \
          --source=GitRepository/flux-system \
          --path="./apps" \
          --prune=true \
          --interval=5m \
          --namespace=flux-system
      else
        echo "apps Kustomization already exists."
      fi

      # ── Force reconcile source + apps ─────────────────────────────────────
      flux reconcile source git flux-system -n flux-system
      flux reconcile kustomization apps -n flux-system

      # ── Wait for required CRDs ─────────────────────────────────────────────
      echo "Waiting for CRDs (ServiceMonitor, ExternalSecret) to register..."
      for i in $(seq 1 30); do
        crd_sm=$(kubectl get crd servicemonitors.monitoring.coreos.com 2>/dev/null || true)
        crd_es=$(kubectl get crd externalsecrets.external-secrets.io 2>/dev/null || true)
        if [ -n "$crd_sm" ] && [ -n "$crd_es" ]; then
          echo "Required CRDs are registered."
          break
        fi
        echo "CRDs not ready yet (attempt $i/30)..."
        sleep 10
      done

      # ── Reconcile remaining Kustomizations ────────────────────────────────
      flux reconcile kustomization alerting              -n flux-system
      flux reconcile kustomization monitoring-config     -n flux-system
      flux reconcile kustomization external-secrets-config -n flux-system

      echo "bootstrap_bridge done."
    EOT
  }
}