const express = require('express');
const router = express.Router();
const clusterService = require('../services/cluster');

/**
 * GET /api/cluster/status
 */
router.get('/status', (req, res) => {
    const status = clusterService.getStatus();
    res.json(status);
});

/**
 * POST /api/cluster/setup
 */
router.post('/setup', async (req, res) => {
    const result = await clusterService.createCluster();
    res.json(result);
});

/**
 * POST /api/cluster/reset
 */
router.post('/reset', async (req, res) => {
    const result = await clusterService.resetCluster();
    res.json(result);
});

/**
 * POST /api/cluster/teardown
 */
router.post('/teardown', async (req, res) => {
    const result = await clusterService.deleteCluster();
    res.json(result);
});

module.exports = router;
