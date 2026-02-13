import React from 'react';

function QuestionNav({ questions, currentIndex, flagged, onSelect }) {
    return (
        <div className="question-nav">
            {questions.map((q, i) => {
                let className = 'qnav-btn';
                if (i === currentIndex) className += ' active';
                if (flagged.has(i)) className += ' flagged';

                return (
                    <button
                        key={q.id}
                        className={className}
                        onClick={() => onSelect(i)}
                        title={`${q.title} (${q.difficulty})`}
                    >
                        {i + 1}
                    </button>
                );
            })}
        </div>
    );
}

export default QuestionNav;
