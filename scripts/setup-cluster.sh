#!/bin/bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[✅]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[⚠️]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_NAME="cka-simulator"

# kind needs Docker access — use sudo if Docker was just installed
KIND_CMD="kind"
if [ "${DOCKER_NEEDS_SUDO}" = "true" ]; then
    KIND_CMD="sudo kind"
    log_warn "Using 'sudo kind' because Docker group is not active yet (re-login to fix)"
fi

# Check if cluster already exists
if $KIND_CMD get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    log_ok "kind cluster '${CLUSTER_NAME}' already exists"
    
    # Set kubeconfig
    $KIND_CMD export kubeconfig --name "${CLUSTER_NAME}" 2>/dev/null
    log_ok "Kubeconfig exported"
else
    log_info "Creating kind cluster '${CLUSTER_NAME}' (1 control-plane + 2 workers)..."
    
    $KIND_CMD create cluster \
        --name "${CLUSTER_NAME}" \
        --config "${SCRIPT_DIR}/kind-config.yaml" \
        --wait 120s

    log_ok "kind cluster created successfully"
    
    # If using sudo kind, export kubeconfig to the current user's home
    if [ "${DOCKER_NEEDS_SUDO}" = "true" ]; then
        sudo kind export kubeconfig --name "${CLUSTER_NAME}"
        # Fix kubeconfig ownership
        sudo chown "$USER:$USER" "$HOME/.kube/config" 2>/dev/null || true
    fi
fi

# Wait for nodes to be ready
log_info "Waiting for all nodes to be Ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=120s
log_ok "All nodes are Ready"

# Create exam namespaces
log_info "Setting up exam namespaces..."
NAMESPACES=("production" "development" "staging" "monitoring" "web" "backend" "data" "security")
for ns in "${NAMESPACES[@]}"; do
    kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1
done
log_ok "Exam namespaces created: ${NAMESPACES[*]}"

# Install metrics-server (needed for resource monitoring questions)
log_info "Installing metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml > /dev/null 2>&1 || true

# Patch metrics-server for kind (disable TLS verification)
kubectl patch deployment metrics-server -n kube-system \
    --type='json' \
    -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]' > /dev/null 2>&1 || true

log_ok "metrics-server installed"

# Pre-create some resources for troubleshooting questions
log_info "Setting up exam environment resources..."

# Create a broken pod for troubleshooting
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

# Create a configmap for reference
kubectl create configmap app-config \
    --from-literal=APP_ENV=production \
    --from-literal=LOG_LEVEL=info \
    --from-literal=DB_HOST=db.example.com \
    -n production --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1

# Create a secret for reference
kubectl create secret generic db-credentials \
    --from-literal=username=admin \
    --from-literal=password=secretpass123 \
    -n production --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1

log_ok "Exam environment resources created"

echo ""
echo -e "${GREEN}${BOLD}Kubernetes cluster is ready for CKA practice!${NC}"
echo -e "  Cluster: ${CLUSTER_NAME}"
echo -e "  Nodes:   $(kubectl get nodes --no-headers | wc -l)"
echo -e "  Context: $(kubectl config current-context)"
