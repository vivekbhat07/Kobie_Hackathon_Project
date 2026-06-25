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
    interpreter = ["PowerShell", "-Command"]
    command     = <<-EOT
      aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}

      $ready = $false
      for ($i = 1; $i -le 30; $i++) {
        $total = (kubectl get nodes --no-headers 2>$null | Measure-Object -Line).Lines
        $readyCount = (kubectl get nodes --no-headers 2>$null | Select-String " Ready ").Count
        if ($total -gt 0 -and $readyCount -eq $total) { $ready = $true; break }
        Write-Host "nodes ready: $readyCount/$total (attempt $i/30)"
        Start-Sleep -Seconds 10
      }

      $fluxNs = kubectl get namespace flux-system 2>$null
      $sourceCtrl = kubectl get deployment -n flux-system source-controller 2>$null
      if ($fluxNs -and $sourceCtrl) {
        Write-Host "FluxCD already present - reconciling."
      } else {
        Write-Host "FluxCD not found - bootstrapping."
        flux bootstrap github --owner=vivekbhat07 --repository=oneclick-gitops --branch=main --path=./clusters/my-cluster --personal
      }

      $appsKustomization = kubectl get kustomization apps -n flux-system 2>$null
      if (-not $appsKustomization) {
        Write-Host "apps Kustomization missing - creating it."
        flux create kustomization apps --source=GitRepository/flux-system --path="./apps" --prune=true --interval=5m --namespace=flux-system
      } else {
        Write-Host "apps Kustomization already exists."
      }

      flux reconcile source git flux-system -n flux-system
      flux reconcile kustomization apps -n flux-system

      Write-Host "Waiting for CRDs from apps HelmReleases (prometheus, external-secrets) to register..."
      for ($i = 1; $i -le 30; $i++) {
        $crdReady = kubectl get crd servicemonitors.monitoring.coreos.com 2>$null
        $esoCrdReady = kubectl get crd externalsecrets.external-secrets.io 2>$null
        if ($crdReady -and $esoCrdReady) {
          Write-Host "Required CRDs are registered."
          break
        }
        Write-Host "CRDs not ready yet (attempt $i/30)..."
        Start-Sleep -Seconds 10
      }

      flux reconcile kustomization alerting -n flux-system
      flux reconcile kustomization monitoring-config -n flux-system
      flux reconcile kustomization external-secrets-config -n flux-system

      Write-Host "bootstrap_bridge done."
    EOT
  }
}