#!/bin/bash
set -e

# ============================================================
# CKA Exam Simulator — One-Command Setup
# Installs all prerequisites and creates the kind cluster
# Supports: Ubuntu/Debian
# ============================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[✅]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[⚠️]${NC} $1"; }
log_error() { echo -e "${RED}[❌]${NC} $1"; }
log_step()  { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}"; }

# ---- Step 1: Prerequisites ----
log_step "Step 1/5: Checking & Installing Prerequisites"
source "${SCRIPT_DIR}/scripts/prereqs.sh"

# ---- Step 2: Install Node.js dependencies ----
log_step "Step 2/5: Installing Node.js Dependencies"
cd "${SCRIPT_DIR}"
if [ ! -d "node_modules" ]; then
    log_info "Running npm install..."
    npm install
    log_ok "Node.js dependencies installed"
else
    log_ok "Node.js dependencies already installed"
fi

# ---- Step 3: Build React frontend ----
log_step "Step 3/5: Building Frontend"
cd "${SCRIPT_DIR}/client"
if [ ! -d "node_modules" ]; then
    log_info "Installing client dependencies..."
    npm install
fi
log_info "Building React app..."
npx vite build
log_ok "Frontend built successfully"

# ---- Step 4: Create kind cluster ----
log_step "Step 4/5: Setting Up Kubernetes Cluster"
cd "${SCRIPT_DIR}"
source scripts/setup-cluster.sh

# ---- Step 5: Final status ----
log_step "Step 5/5: Final Verification"

echo ""
kubectl cluster-info 2>/dev/null && log_ok "Kubernetes cluster is healthy" || log_error "Cluster health check failed"
echo ""

# Get VM IP
VM_IP=$(hostname -I | awk '{print $1}')

echo -e "${BOLD}${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🎉 CKA Exam Simulator is Ready!               ║"
echo "║                                                            ║"
echo "║  Start the app:                                            ║"
echo "║    ./start.sh                                              ║"
echo "║                                                            ║"
echo "║  Then open in your browser:                                ║"
echo "║    http://${VM_IP}:3000                                    ║"
echo "║                                                            ║"
echo "║  Useful commands:                                          ║"
echo "║    npm run cluster:reset    - Reset cluster to clean state ║"
echo "║    npm run cluster:teardown - Destroy the cluster          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Post-install Docker notice
if [ "${DOCKER_NEEDS_SUDO}" = "true" ]; then
    echo -e "${YELLOW}${BOLD}"
    echo "┌──────────────────────────────────────────────────────────────┐"
    echo "│  ⚠️  IMPORTANT: Docker was installed in this session.       │"
    echo "│                                                            │"
    echo "│  For best experience, please:                              │"
    echo "│    1. Log out:   exit                                      │"
    echo "│    2. Log back in:  ssh user@${VM_IP}                      │"
    echo "│    3. Then start:   cd $(basename ${SCRIPT_DIR}) && ./start.sh │"
    echo "│                                                            │"
    echo "│  This activates Docker group permissions so everything     │"
    echo "│  works without sudo.                                      │"
    echo "└──────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
fi
