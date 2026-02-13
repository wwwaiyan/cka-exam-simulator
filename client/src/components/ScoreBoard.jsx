import React, { useState } from 'react';

function ScoreBoard({ result, onRestart }) {
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    if (!result) return null;

    const domainNames = {
        'cluster-architecture': 'Cluster Architecture',
        'workloads': 'Workloads & Scheduling',
        'networking': 'Services & Networking',
        'storage': 'Storage',
        'troubleshooting': 'Troubleshooting',
    };

    return (
        <div className="score-screen">
            <div className="score-card">
                {/* Header */}
                <div className="score-header">
                    <div className="score-status">
                        {result.passed ? '🎉' : '📚'}
                    </div>
                    <h1 className={`score-title ${result.passed ? 'pass' : 'fail'}`}>
                        {result.passed ? 'PASSED!' : 'NOT YET — KEEP PRACTICING'}
                    </h1>
                    <div className={`score-percentage ${result.passed ? 'pass' : 'fail'}`}>
                        {result.percentage}%
                    </div>
                    <p className="score-detail">
                        {result.totalScore} / {result.maxScore} points
                        &nbsp;&nbsp;•&nbsp;&nbsp;
                        Passing: {result.passingPercentage}%
                    </p>
                </div>

                <div className="score-divider"></div>

                {/* Domain Breakdown */}
                <div className="domain-section">
                    <h3>📊 Domain Breakdown</h3>
                    {Object.entries(result.domains).map(([domain, data]) => {
                        const pct = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
                        let barClass = 'good';
                        if (pct < 50) barClass = 'bad';
                        else if (pct < 75) barClass = 'ok';

                        return (
                            <div key={domain} className="domain-row">
                                <span className="domain-name">
                                    {domainNames[domain] || domain}
                                </span>
                                <div className="domain-bar-bg">
                                    <div
                                        className={`domain-bar-fill ${barClass}`}
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                                <span className="domain-score">
                                    {data.score}/{data.maxScore}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="score-divider"></div>

                {/* Per-Question Results */}
                <div className="results-section">
                    <h3>📋 Question Results</h3>
                    {result.results.map((q, index) => (
                        <React.Fragment key={q.id}>
                            <div
                                className="result-item"
                                onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                            >
                                <span className="result-icon">
                                    {q.passed ? '✅' : '❌'}
                                </span>
                                <div className="result-info">
                                    <div className="result-title">{q.title}</div>
                                    <div className="result-domain">
                                        {domainNames[q.domain] || q.domain}
                                    </div>
                                </div>
                                <span className={`result-score ${q.passed ? 'pass' : 'fail'}`}>
                                    {q.score}/{q.maxScore}
                                </span>
                            </div>

                            {expandedQuestion === index && q.checks && (
                                <div className="result-checks">
                                    {q.checks.map((check, ci) => (
                                        <div key={ci} className="result-check">
                                            <span>{check.passed ? '✓' : '✗'}</span>
                                            <span>{check.description}</span>
                                            {!check.passed && (
                                                <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 'auto' }}>
                                                    expected: {check.expected}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="score-actions">
                    <button className="btn btn-primary btn-lg" onClick={onRestart}>
                        🔄 Take Another Exam
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ScoreBoard;
