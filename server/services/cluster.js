const { execSync } = require('child_process');

/**
 * Manages the kind cluster lifecycle.
 */
class ClusterService {
    constructor() {
        this.clusterName = 'cka-simulator';
    }

    /**
     * Check if the cluster is running and healthy.
     */
    getStatus() {
        try {
            // Check if kind cluster exists
            const clusters = execSync('kind get clusters', { encoding: 'utf-8' }).trim();
            const exists = clusters.split('\n').includes(this.clusterName);

            if (!exists) {
                return { status: 'not-found', message: 'Cluster does not exist' };
            }

            // Check cluster health
            const clusterInfo = execSync('kubectl cluster-info', {
                encoding: 'utf-8',
                timeout: 10000,
            }).trim();

            // Get node count
            const nodes = execSync('kubectl get nodes --no-headers', {
                encoding: 'utf-8',
                timeout: 10000,
            }).trim().split('\n').filter(Boolean);

            const readyNodes = nodes.filter(n => n.includes('Ready')).length;

            return {
                status: 'running',
                message: 'Cluster is healthy',
                nodes: {
                    total: nodes.length,
                    ready: readyNodes,
                },
                clusterName: this.clusterName,
            };
        } catch (err) {
            return {
                status: 'error',
                message: err.message,
            };
        }
    }

    /**
     * Create the kind cluster.
     */
    async createCluster() {
        try {
            const existing = this.getStatus();
            if (existing.status === 'running') {
                return { success: true, message: 'Cluster already running' };
            }

            execSync('bash scripts/setup-cluster.sh', {
                cwd: process.cwd(),
                stdio: 'inherit',
                timeout: 300000, // 5 min timeout
            });

            return { success: true, message: 'Cluster created successfully' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Reset the cluster to clean state.
     */
    async resetCluster() {
        try {
            execSync('bash scripts/reset-cluster.sh', {
                cwd: process.cwd(),
                stdio: 'inherit',
                timeout: 120000,
            });

            return { success: true, message: 'Cluster reset successfully' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Delete the cluster.
     */
    async deleteCluster() {
        try {
            execSync(`kind delete cluster --name ${this.clusterName}`, {
                encoding: 'utf-8',
                timeout: 60000,
            });

            return { success: true, message: 'Cluster deleted' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
}

module.exports = new ClusterService();
