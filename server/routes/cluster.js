const express = require('express');
const router = express.Router();
const clusterService = require('../services/cluster');

/**
 * GET /api/cluster/status
 */
router.get('/status', (req, res) => {
    try {
        const status = clusterService.getStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/cluster/setup
 */
router.post('/setup', async (req, res) => {
    try {
        const result = await clusterService.createCluster();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/cluster/reset
 */
router.post('/reset', async (req, res) => {
    try {
        const result = await clusterService.resetCluster();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/cluster/teardown
 */
router.post('/teardown', async (req, res) => {
    try {
        const result = await clusterService.deleteCluster();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
