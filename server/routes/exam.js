const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { loadQuestions } = require('../questions');
const validator = require('../services/validator');

// In-memory exam sessions
const sessions = new Map();

/**
 * GET /api/exam/questions
 * Returns all questions (without validation details) for a new exam session.
 */
router.get('/questions', (req, res) => {
    try {
        const questions = loadQuestions();

        // Strip validation details — students shouldn't see the answers
        const safeQuestions = questions.map(q => ({
            id: q.id,
            domain: q.domain,
            title: q.title,
            difficulty: q.difficulty,
            points: q.points,
            description: q.description,
            hints: q.hints || [],
            context: q.context || null,
        }));

        res.json({
            total: safeQuestions.length,
            maxScore: questions.reduce((sum, q) => sum + q.points, 0),
            passingPercentage: 66,
            durationMinutes: 120,
            questions: safeQuestions,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/exam/start
 * Creates a new exam session with a timer.
 */
router.post('/start', (req, res) => {
    try {
        const sessionId = uuidv4();
        const questions = loadQuestions();

        const session = {
            id: sessionId,
            startedAt: new Date().toISOString(),
            durationMinutes: 120,
            questions: questions,
            submitted: false,
        };

        sessions.set(sessionId, session);

        // Return safe questions
        const safeQuestions = questions.map(q => ({
            id: q.id,
            domain: q.domain,
            title: q.title,
            difficulty: q.difficulty,
            points: q.points,
            description: q.description,
            hints: q.hints || [],
            context: q.context || null,
        }));

        res.json({
            sessionId,
            startedAt: session.startedAt,
            durationMinutes: session.durationMinutes,
            total: safeQuestions.length,
            maxScore: questions.reduce((sum, q) => sum + q.points, 0),
            questions: safeQuestions,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/exam/validate/:questionId
 * Validates a single question (for live checking).
 */
router.post('/validate/:questionId', (req, res) => {
    try {
        const questions = loadQuestions();
        const question = questions.find(q => q.id === req.params.questionId);

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const result = validator.validateQuestion(question);

        res.json({
            questionId: question.id,
            title: question.title,
            ...result,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/exam/submit
 * Validates all questions and returns the full exam result.
 */
router.post('/submit', (req, res) => {
    try {
        const questions = loadQuestions();
        const result = validator.validateExam(questions);

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
