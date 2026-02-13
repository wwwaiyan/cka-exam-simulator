#!/bin/bash
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[✅]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info "Resetting cluster to clean state..."

# Delete all non-system namespaces and recreate exam ones
SYSTEM_NS="default kube-system kube-public kube-node-lease local-path-storage"
ALL_NS=$(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}')

for ns in $ALL_NS; do
    if ! echo "$SYSTEM_NS" | grep -qw "$ns"; then
        log_info "Deleting namespace: $ns"
        kubectl delete namespace "$ns" --wait=false 2>/dev/null || true
    fi
done

# Wait a moment for deletions
sleep 3

# Clean default namespace
log_info "Cleaning default namespace..."
kubectl delete all --all -n default 2>/dev/null || true
kubectl delete configmaps --all -n default 2>/dev/null || true
kubectl delete secrets --field-selector type!=kubernetes.io/service-account-token --all -n default 2>/dev/null || true
kubectl delete pvc --all -n default 2>/dev/null || true
kubectl delete ingress --all -n default 2>/dev/null || true
kubectl delete networkpolicy --all -n default 2>/dev/null || true

# Delete cluster-scoped resources
log_info "Cleaning cluster-scoped resources..."
kubectl delete clusterrolebinding -l exam=true 2>/dev/null || true
kubectl delete clusterrole -l exam=true 2>/dev/null || true
kubectl delete pv --all 2>/dev/null || true

# Re-create exam namespaces
log_info "Recreating exam namespaces..."
NAMESPACES=("production" "development" "staging" "monitoring" "web" "backend" "data" "security")
for ns in "${NAMESPACES[@]}"; do
    kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1
done

# Re-create exam environment resources
log_info "Recreating exam resources..."

kubectl apply -f - > /dev/null 2>&1 <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: broken-web
  namespace: development
  labels:
    app: web
spec:
  containers:
  - name: web
    image: nginx:nonexistent-tag
    ports:
    - containerPort: 80
EOF

kubectl create configmap app-config \
    --from-literal=APP_ENV=production \
    --from-literal=LOG_LEVEL=info \
    --from-literal=DB_HOST=db.example.com \
    -n production --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1

kubectl create secret generic db-credentials \
    --from-literal=username=admin \
    --from-literal=password=secretpass123 \
    -n production --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1

log_ok "Cluster reset complete"
