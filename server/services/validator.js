const { execSync } = require('child_process');

/**
 * Validates a question's answer by running kubectl commands against the cluster
 * and comparing output to expected values.
 */
class Validator {
    /**
     * Validate a single question.
     * @param {Object} question - Question object with validation array
     * @returns {Object} - { passed, score, maxScore, checks }
     */
    validateQuestion(question) {
        if (!question.validation || question.validation.length === 0) {
            return { passed: false, score: 0, maxScore: 0, checks: [] };
        }

        const results = question.validation.map((check) => {
            try {
                const result = this.runCheck(check);
                return result;
            } catch (err) {
                return {
                    description: check.description,
                    passed: false,
                    expected: check.expected,
                    actual: `Error: ${err.message}`,
                    points: 0,
                    maxPoints: check.points || 1,
                };
            }
        });

        const score = results.reduce((sum, r) => sum + r.points, 0);
        const maxScore = results.reduce((sum, r) => sum + r.maxPoints, 0);

        return {
            passed: score === maxScore,
            score,
            maxScore,
            checks: results,
        };
    }

    /**
     * Run a single validation check.
     */
    runCheck(check) {
        const { command, expected, check: checkType, description, points = 1 } = check;

        let actual;
        let commandExitCode = 0;

        try {
            actual = execSync(command, {
                encoding: 'utf-8',
                timeout: 10000,
                env: { ...process.env, KUBECONFIG: process.env.KUBECONFIG || `${require('os').homedir()}/.kube/config` },
            }).trim();
        } catch (err) {
            if (checkType === 'not-exists') {
                // Command failing is expected for not-exists checks
                return {
                    description,
                    passed: true,
                    expected: 'Resource should not exist',
                    actual: 'Resource does not exist',
                    points,
                    maxPoints: points,
                };
            }
            actual = '';
            commandExitCode = err.status || 1;
        }

        let passed = false;

        switch (checkType) {
            case 'equals':
                // Remove surrounding quotes if present
                const cleanActual = actual.replace(/^['"]|['"]$/g, '');
                const cleanExpected = expected.replace(/^['"]|['"]$/g, '');
                passed = cleanActual === cleanExpected;
                break;

            case 'contains':
                passed = actual.includes(expected);
                break;

            case 'exists':
                passed = actual.length > 0 && commandExitCode === 0;
                break;

            case 'not-exists':
                passed = commandExitCode !== 0 || actual.includes('not found') || actual.includes('NotFound');
                break;

            case 'json-match':
                try {
                    const actualJson = JSON.parse(actual);
                    const expectedJson = JSON.parse(expected);
                    passed = this.deepMatch(actualJson, expectedJson);
                } catch {
                    passed = false;
                }
                break;

            case 'greater-than':
                passed = parseFloat(actual) > parseFloat(expected);
                break;

            case 'regex':
                try {
                    passed = new RegExp(expected).test(actual);
                } catch {
                    passed = false;
                }
                break;

            default:
                passed = actual === expected;
        }

        return {
            description,
            passed,
            expected,
            actual: actual || '(empty)',
            points: passed ? points : 0,
            maxPoints: points,
        };
    }

    /**
     * Deep match: check if actual contains all keys/values from expected.
     */
    deepMatch(actual, expected) {
        if (typeof expected !== 'object' || expected === null) {
            return actual === expected;
        }

        for (const key of Object.keys(expected)) {
            if (!(key in actual)) return false;
            if (!this.deepMatch(actual[key], expected[key])) return false;
        }

        return true;
    }

    /**
     * Validate all questions and return a full exam result.
     */
    validateExam(questions) {
        const results = questions.map((q) => ({
            id: q.id,
            title: q.title,
            domain: q.domain,
            ...this.validateQuestion(q),
        }));

        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        // CKA passing score is 66%
        const passed = percentage >= 66;

        // Domain breakdown
        const domains = {};
        results.forEach((r) => {
            if (!domains[r.domain]) {
                domains[r.domain] = { score: 0, maxScore: 0, questions: 0, passed: 0 };
            }
            domains[r.domain].score += r.score;
            domains[r.domain].maxScore += r.maxScore;
            domains[r.domain].questions += 1;
            if (r.passed) domains[r.domain].passed += 1;
        });

        return {
            passed,
            totalScore,
            maxScore,
            percentage,
            passingPercentage: 66,
            domains,
            results,
        };
    }
}

module.exports = new Validator();
