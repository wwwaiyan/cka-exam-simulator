# CKA Exam Simulator 🎯

A **web-based Certified Kubernetes Administrator (CKA) Exam Simulator** with a real Kubernetes cluster, live terminal, and automated answer validation.

## Features

- ☸ **Real Kubernetes Cluster** — kind cluster with 3 nodes (1 control-plane + 2 workers)
- 💻 **Live Terminal** — Full xterm.js terminal for `kubectl` and shell commands
- 📝 **25 CKA Questions** — Across all 5 exam domains with real-world scenarios
- ✅ **Automated Validation** — Checks cluster state to score your answers
- ⏱ **Exam Timer** — 2-hour countdown matching the real CKA exam
- 📊 **Detailed Scoring** — Domain breakdown, per-question results, pass/fail (66%)

## Quick Start (on Ubuntu VM)

```bash
# 1. Clone/copy the project to your VM
scp -r . user@your-vm-ip:~/cka-simulator

# 2. SSH into your VM
ssh user@your-vm-ip
cd ~/cka-simulator

# 3. One-command setup (installs Docker, kind, kubectl, Node.js + creates cluster)
chmod +x setup.sh start.sh
./setup.sh

# 4. Start the simulator
./start.sh

# 5. Open in your browser
# http://your-vm-ip:3000
```

## Prerequisites (auto-installed by setup.sh)

- Docker
- kind (Kubernetes in Docker)
- kubectl
- Node.js 18+

## Exam Domains

| Domain | Weight | Questions |
|--------|--------|-----------|
| Cluster Architecture, Installation & Configuration | 25% | 6 |
| Workloads & Scheduling | 15% | 4 |
| Services & Networking | 20% | 5 |
| Storage | 10% | 3 |
| Troubleshooting | 30% | 7 |

## Useful Commands

```bash
# Reset cluster (clean state for new exam)
npm run cluster:reset

# Tear down cluster
npm run cluster:teardown

# Recreate cluster
npm run cluster:setup
```

## Architecture

```
Browser (your PC) → HTTP/WebSocket → Node.js Server (VM) → kind Cluster (VM)
```

- **Frontend**: React + xterm.js
- **Backend**: Node.js + Express + WebSocket + node-pty
- **Cluster**: kind with 3 nodes
