const fs = require('fs');
const path = require('path');

/**
 * Load questions from bank.json
 */
function loadQuestions() {
    const bankPath = path.join(__dirname, 'bank.json');
    const raw = fs.readFileSync(bankPath, 'utf-8');
    const bank = JSON.parse(raw);
    return bank.questions;
}

module.exports = { loadQuestions };
