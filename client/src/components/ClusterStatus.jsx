import React from 'react';

function ClusterStatus({ status }) {
    if (!status) {
        return (
            <div className="cluster-badge">
                <span className="cluster-dot loading"></span>
                <span>Checking...</span>
            </div>
        );
    }

    const dotClass = status.status === 'running' ? 'running' : 'error';

    return (
        <div className="cluster-badge">
            <span className={`cluster-dot ${dotClass}`}></span>
            <span>
                {status.status === 'running'
                    ? `${status.nodes?.ready || '?'}/${status.nodes?.total || '?'} nodes`
                    : 'Cluster Error'}
            </span>
        </div>
    );
}

export default ClusterStatus;
