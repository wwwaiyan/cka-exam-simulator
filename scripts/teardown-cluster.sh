#!/bin/bash
set -e

CLUSTER_NAME="cka-simulator"

echo "Destroying kind cluster '${CLUSTER_NAME}'..."
kind delete cluster --name "${CLUSTER_NAME}" 2>/dev/null || true
echo "✅ Cluster destroyed"
