const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

// Basic route to test server
router.get('/test', (req, res) => {
    res.json({ 
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Main simulation endpoint
router.post('/simulate-request', requestController.simulateRequest);

// HTTP/2 concurrent requests simulation
router.post('/simulate-http2', requestController.simulateHTTP2);

// Get mock resource
router.get('/resource/:id', requestController.getMockResource);

module.exports = router;