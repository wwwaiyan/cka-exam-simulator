import React from 'react';

function StartScreen({ clusterStatus, onStart }) {
    const isClusterReady = clusterStatus?.status === 'running';

    return (
        <div className="start-screen">
            <div className="start-card">
                <div className="start-logo">☸</div>
                <h1 className="start-title">CKA Exam Simulator</h1>
                <p className="start-subtitle">
                    Certified Kubernetes Administrator — Practice Exam
                </p>

                <div className="start-info">
                    <div className="info-card">
                        <div className="info-label">Questions</div>
                        <div className="info-value">25</div>
                    </div>
                    <div className="info-card">
                        <div className="info-label">Duration</div>
                        <div className="info-value">2 Hours</div>
                    </div>
                    <div className="info-card">
                        <div className="info-label">Passing Score</div>
                        <div className="info-value">66%</div>
                    </div>
                    <div className="info-card">
                        <div className="info-label">Environment</div>
                        <div className="info-value">Live Cluster</div>
                    </div>
                </div>

                <div className="cluster-indicator">
                    <span className={`cluster-dot ${isClusterReady ? 'running' : clusterStatus ? 'error' : 'loading'}`}></span>
                    <span style={{ flex: 1, textAlign: 'left' }}>
                        {!clusterStatus && 'Checking cluster status...'}
                        {clusterStatus?.status === 'running' && `Cluster ready — ${clusterStatus.nodes?.total || '?'} nodes (${clusterStatus.nodes?.ready || '?'} ready)`}
                        {clusterStatus?.status === 'not-found' && 'Cluster not found. Run ./setup.sh first.'}
                        {clusterStatus?.status === 'error' && `Error: ${clusterStatus.message}`}
                    </span>
                </div>

                <button
                    className="btn btn-primary btn-lg"
                    onClick={onStart}
                    disabled={!isClusterReady}
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {isClusterReady ? '🚀 Start Exam' : '⏳ Waiting for Cluster...'}
                </button>

                <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                    <p>This simulator provides a real Kubernetes environment.</p>
                    <p>Use the terminal to run kubectl and shell commands.</p>
                </div>
            </div>
        </div>
    );
}

export default StartScreen;
