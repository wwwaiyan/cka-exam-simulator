const fs = require('fs');
const path = require('path');

/**
 * Load questions from bank.json
 */
function loadQuestions() {
    const bankPath = path.join(__dirname, 'bank.json');
    const raw = fs.readFileSync(bankPath, 'utf-8');
    const bank = JSON.parse(raw);
    // bank.json is a flat array of questions
    const questions = Array.isArray(bank) ? bank : (bank.questions || []);
    if (!questions.length) {
        console.warn('[Questions] Warning: No questions loaded from bank.json');
    }
    return questions;
}

module.exports = { loadQuestions };
