import React, { useState, useEffect, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import ExamPanel from './components/ExamPanel';
import Terminal from './components/Terminal';
import Timer from './components/Timer';
import QuestionNav from './components/QuestionNav';
import ScoreBoard from './components/ScoreBoard';
import ClusterStatus from './components/ClusterStatus';

const API_BASE = '/api';

function App() {
    const [screen, setScreen] = useState('start'); // 'start' | 'exam' | 'results'
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [flagged, setFlagged] = useState(new Set());
    const [examResult, setExamResult] = useState(null);
    const [durationMinutes, setDurationMinutes] = useState(120);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clusterStatus, setClusterStatus] = useState(null);
    const [terminalKey, setTerminalKey] = useState(0);

    // Check cluster status periodically
    useEffect(() => {
        const checkCluster = async () => {
            try {
                const res = await fetch(`${API_BASE}/cluster/status`);
                const data = await res.json();
                setClusterStatus(data);
            } catch {
                setClusterStatus({ status: 'error', message: 'Cannot connect to server' });
            }
        };

        checkCluster();
        const interval = setInterval(checkCluster, 30000);
        return () => clearInterval(interval);
    }, []);

    const startExam = async () => {
        try {
            const res = await fetch(`${API_BASE}/exam/start`, { method: 'POST' });
            const data = await res.json();
            setQuestions(data.questions);
            setDurationMinutes(data.durationMinutes);
            setCurrentQuestionIndex(0);
            setFlagged(new Set());
            setExamResult(null);
            setTerminalKey(prev => prev + 1);
            setScreen('exam');
        } catch (err) {
            alert('Failed to start exam: ' + err.message);
        }
    };

    const submitExam = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/exam/submit`, { method: 'POST' });
            const data = await res.json();
            setExamResult(data);
            setScreen('results');
        } catch (err) {
            alert('Failed to submit exam: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting]);

    const validateQuestion = async (questionId) => {
        try {
            const res = await fetch(`${API_BASE}/exam/validate/${questionId}`, { method: 'POST' });
            return await res.json();
        } catch {
            return null;
        }
    };

    const toggleFlag = (index) => {
        setFlagged(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const resetExam = () => {
        setScreen('start');
        setQuestions([]);
        setExamResult(null);
    };

    if (screen === 'start') {
        return (
            <StartScreen
                clusterStatus={clusterStatus}
                onStart={startExam}
            />
        );
    }

    if (screen === 'results') {
        return (
            <ScoreBoard
                result={examResult}
                onRestart={resetExam}
            />
        );
    }

    // Exam screen
    return (
        <div className="exam-layout">
            {/* Top Bar */}
            <header className="exam-header">
                <div className="header-left">
                    <div className="logo">
                        <span className="logo-icon">☸</span>
                        <span className="logo-text">CKA Simulator</span>
                    </div>
                </div>
                <div className="header-center">
                    <Timer
                        durationMinutes={durationMinutes}
                        onTimeout={submitExam}
                    />
                </div>
                <div className="header-right">
                    <ClusterStatus status={clusterStatus} />
                    <button
                        className="btn btn-submit"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to submit the exam? This action cannot be undone.')) {
                                submitExam();
                            }
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="exam-body">
                {/* Left: Question Nav + Question */}
                <div className="exam-left">
                    <QuestionNav
                        questions={questions}
                        currentIndex={currentQuestionIndex}
                        flagged={flagged}
                        onSelect={setCurrentQuestionIndex}
                    />
                    <ExamPanel
                        question={questions[currentQuestionIndex]}
                        questionNumber={currentQuestionIndex + 1}
                        totalQuestions={questions.length}
                        isFlagged={flagged.has(currentQuestionIndex)}
                        onFlag={() => toggleFlag(currentQuestionIndex)}
                        onPrev={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        onNext={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                        onValidate={validateQuestion}
                    />
                </div>

                {/* Right: Terminal */}
                <div className="exam-right">
                    <Terminal key={terminalKey} />
                </div>
            </div>
        </div>
    );
}

export default App;
