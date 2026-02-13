import React, { useState } from 'react';

function ExamPanel({
    question,
    questionNumber,
    totalQuestions,
    isFlagged,
    onFlag,
    onPrev,
    onNext,
    onValidate,
}) {
    const [showHints, setShowHints] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    if (!question) return null;

    const handleValidate = async () => {
        setIsValidating(true);
        const result = await onValidate(question.id);
        setValidationResult(result);
        setIsValidating(false);
    };

    // Simple markdown rendering for description
    const renderDescription = (text) => {
        // Handle code blocks
        const parts = text.split(/(```[\s\S]*?```)/g);
        return parts.map((part, i) => {
            if (part.startsWith('```')) {
                const code = part.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
                return <pre key={i}>{code}</pre>;
            }
            // Handle inline code
            const segments = part.split(/(`[^`]+`)/g);
            return (
                <span key={i}>
                    {segments.map((seg, j) => {
                        if (seg.startsWith('`') && seg.endsWith('`')) {
                            return <code key={j}>{seg.slice(1, -1)}</code>;
                        }
                        // Handle bold
                        return seg.split(/(\*\*[^*]+\*\*)/g).map((s, k) => {
                            if (s.startsWith('**') && s.endsWith('**')) {
                                return <strong key={k}>{s.slice(2, -2)}</strong>;
                            }
                            return s;
                        });
                    })}
                </span>
            );
        });
    };

    return (
        <div className="exam-panel">
            {/* Header */}
            <div className="question-header">
                <div className="question-meta">
                    <span className="question-number">Q{questionNumber}/{totalQuestions}</span>
                    <span className="question-domain">{question.domain}</span>
                    <span className={`difficulty-badge ${question.difficulty}`}>
                        {question.difficulty}
                    </span>
                </div>
                <span className="question-points">{question.points} pts</span>
            </div>

            {/* Body */}
            <div className="question-body">
                <h2 className="question-title">{question.title}</h2>

                {question.context && (
                    <div className="question-context">{question.context}</div>
                )}

                <div className="question-description">
                    {renderDescription(question.description)}
                </div>

                {/* Hints */}
                {question.hints && question.hints.length > 0 && (
                    <div className="hints-section">
                        <button className="hints-toggle" onClick={() => setShowHints(!showHints)}>
                            {showHints ? '▼' : '▶'} {showHints ? 'Hide Hints' : 'Show Hints'} ({question.hints.length})
                        </button>
                        {showHints && (
                            <ul className="hints-list">
                                {question.hints.map((hint, i) => (
                                    <li key={i}>{hint}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Validation Result */}
                {validationResult && (
                    <div className={`validation-result ${validationResult.passed ? 'pass' : 'fail'}`}>
                        <h4>
                            {validationResult.passed ? '✅ All checks passed!' : `❌ ${validationResult.score}/${validationResult.maxScore} checks passed`}
                        </h4>
                        {validationResult.checks?.map((check, i) => (
                            <div key={i} className="validation-check">
                                <span className="check-icon">{check.passed ? '✓' : '✗'}</span>
                                <span>{check.description}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="question-footer">
                <div className="footer-left">
                    <button
                        className={`btn btn-flag ${isFlagged ? 'flagged' : ''}`}
                        onClick={onFlag}
                    >
                        {isFlagged ? '🚩 Flagged' : '🏳️ Flag'}
                    </button>
                    <button
                        className="btn"
                        onClick={handleValidate}
                        disabled={isValidating}
                    >
                        {isValidating ? '⏳ Checking...' : '🔍 Check Answer'}
                    </button>
                </div>
                <div className="footer-right">
                    <button className="btn" onClick={onPrev} disabled={questionNumber <= 1}>
                        ← Prev
                    </button>
                    <button className="btn btn-primary" onClick={onNext} disabled={questionNumber >= totalQuestions}>
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ExamPanel;
