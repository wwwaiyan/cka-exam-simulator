#!/bin/bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if cluster is running
if ! kubectl cluster-info &>/dev/null; then
    echo -e "${RED}[❌] Kubernetes cluster is not running.${NC}"
    echo "Run ./setup.sh first to set up the cluster."
    exit 1
fi

echo -e "${GREEN}[✅] Cluster is running${NC}"

VM_IP=$(hostname -I | awk '{print $1}')

echo -e "${BOLD}${CYAN}"
echo "Starting CKA Exam Simulator..."
echo "Access at: http://${VM_IP}:3000"
echo -e "${NC}"

cd "${SCRIPT_DIR}"

if [ "$NODE_ENV" = "production" ] || [ -d "client/dist" ]; then
    NODE_ENV=production node server/index.js
else
    npx concurrently \
        "node server/index.js" \
        "cd client && npx vite --host 0.0.0.0"
fi
