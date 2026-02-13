#!/bin/bash
set -e

# ============================================================
# CKA Exam Simulator — Prerequisite Checker & Installer
# Auto-detects and installs: Docker, kind, kubectl, Node.js
# Supports: Ubuntu/Debian
# ============================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Flag to track if Docker needs sudo (fresh install, user not in group yet)
export DOCKER_NEEDS_SUDO=false

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[✅]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[⚠️]${NC} $1"; }
log_error() { echo -e "${RED}[❌]${NC} $1"; }

check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_info "This script requires sudo access for installing packages."
        sudo true
    fi
}

# Wrapper: run docker with sudo if needed
run_docker() {
    if [ "$DOCKER_NEEDS_SUDO" = true ]; then
        sudo docker "$@"
    else
        docker "$@"
    fi
}

# Wrapper: run kind with correct Docker access
run_kind() {
    if [ "$DOCKER_NEEDS_SUDO" = true ]; then
        sudo kind "$@"
    else
        kind "$@"
    fi
}

# ---- Docker ----
install_docker() {
    if command -v docker &>/dev/null; then
        DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        log_ok "Docker is installed (v${DOCKER_VERSION})"
        
        # Check if Docker daemon is running
        if ! docker info &>/dev/null 2>&1; then
            # Could be daemon not running or permission issue
            if sudo docker info &>/dev/null 2>&1; then
                log_warn "Docker works with sudo but not as current user"
                log_info "Adding $USER to docker group..."
                sudo usermod -aG docker "$USER" 2>/dev/null || true
                export DOCKER_NEEDS_SUDO=true
                log_warn "Using sudo for Docker in this session. Log out and back in for passwordless Docker access."
            else
                log_warn "Docker daemon is not running. Starting..."
                sudo systemctl start docker
                sudo systemctl enable docker
                log_ok "Docker daemon started"
                
                # Re-check permission
                if ! docker info &>/dev/null 2>&1; then
                    export DOCKER_NEEDS_SUDO=true
                    sudo usermod -aG docker "$USER" 2>/dev/null || true
                    log_warn "Using sudo for Docker in this session."
                fi
            fi
        fi
    else
        log_info "Installing Docker..."
        check_sudo

        # Remove old versions
        sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

        # Install prerequisites
        sudo apt-get update -y
        sudo apt-get install -y ca-certificates curl gnupg lsb-release

        # Add Docker GPG key
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
        sudo chmod a+r /etc/apt/keyrings/docker.gpg

        # Add Docker repo
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        # Start Docker
        sudo systemctl start docker
        sudo systemctl enable docker

        # Add current user to docker group
        sudo usermod -aG docker "$USER"

        # Docker was just installed — user group not active in current shell
        export DOCKER_NEEDS_SUDO=true

        log_ok "Docker installed successfully"
        echo ""
        log_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_warn "Docker group change requires re-login to take effect."
        log_warn "For THIS session: setup will use 'sudo docker' automatically."
        log_warn "For FUTURE sessions: log out and log back in, then Docker"
        log_warn "will work without sudo."
        log_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    fi
}

# ---- kind ----
install_kind() {
    if command -v kind &>/dev/null; then
        KIND_VERSION=$(kind --version | grep -oP 'v[\d.]+' | head -1)
        log_ok "kind is installed (${KIND_VERSION})"
    else
        log_info "Installing kind..."
        check_sudo

        # Detect architecture
        ARCH=$(dpkg --print-architecture)
        if [ "$ARCH" = "amd64" ]; then
            KIND_ARCH="amd64"
        elif [ "$ARCH" = "arm64" ]; then
            KIND_ARCH="arm64"
        else
            log_error "Unsupported architecture: $ARCH"
            exit 1
        fi

        curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v0.24.0/kind-linux-${KIND_ARCH}"
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/kind

        log_ok "kind installed successfully (v0.24.0)"
    fi
}

# ---- kubectl ----
install_kubectl() {
    if command -v kubectl &>/dev/null; then
        KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | grep -oP 'v[\d.]+' || kubectl version --client -o json 2>/dev/null | grep -oP '"gitVersion":\s*"v[\d.]+"' | grep -oP 'v[\d.]+' || echo "unknown")
        log_ok "kubectl is installed (${KUBECTL_VERSION})"
    else
        log_info "Installing kubectl..."
        check_sudo

        # Detect architecture
        ARCH=$(dpkg --print-architecture)

        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/kubectl

        log_ok "kubectl installed successfully"
    fi
}

# ---- Node.js ----
install_nodejs() {
    if command -v node &>/dev/null; then
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo "$NODE_VERSION" | grep -oP '\d+' | head -1)
        if [ "$NODE_MAJOR" -ge 18 ]; then
            log_ok "Node.js is installed (${NODE_VERSION})"
        else
            log_warn "Node.js ${NODE_VERSION} is too old. Need v18+. Upgrading..."
            install_nodejs_via_nodesource
        fi
    else
        log_info "Installing Node.js..."
        install_nodejs_via_nodesource
    fi
}

install_nodejs_via_nodesource() {
    check_sudo
    
    # Install Node.js 20.x via NodeSource
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg 2>/dev/null || true

    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | \
        sudo tee /etc/apt/sources.list.d/nodesource.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y nodejs

    # Install build essentials for native modules (node-pty)
    sudo apt-get install -y build-essential python3 make g++

    log_ok "Node.js $(node --version) installed successfully"
}

# ---- Build tools (required for node-pty native module) ----
install_build_tools() {
    if command -v make &>/dev/null && command -v g++ &>/dev/null; then
        log_ok "Build tools (make, g++) are installed"
    else
        log_info "Installing build tools (required for native Node.js modules)..."
        check_sudo
        sudo apt-get update -y
        sudo apt-get install -y build-essential python3 make g++
        log_ok "Build tools installed"
    fi
}

# ---- Run all checks ----
echo -e "${BOLD}Checking prerequisites...${NC}"
echo ""

install_docker
install_kind
install_kubectl
install_nodejs
install_build_tools

echo ""
echo -e "${GREEN}${BOLD}All prerequisites are ready!${NC}"
