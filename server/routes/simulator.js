const express = require('express');
const router = express.Router();
const mockResponse = require('../utils/mockResponse');
const realRequestHandler = require('../utils/realRequestHandler');
const cacheSimulator = require('../utils/cacheSimulator');
const cookieHandler = require('../utils/cookieHandler');

/**
 * Main simulation endpoint
 */
router.post('/simulate-request', async (req, res) => {
    try {
        const {
            url,
            method = 'GET',
            delay = 0,
            packetLoss = 0,
            connectionType = 'keep-alive',
            useCache = false,
            useCookies = false,
            useRealRequest = false
        } = req.body;

        console.log(`📬 Simulation request: ${method} ${url}`);

        // Simulate packet loss
        if (packetLoss > 0 && Math.random() * 100 < packetLoss) {
            return res.status(0).json({
                error: 'Packet Lost',
                message: `Simulated packet loss (${packetLoss}%)`
            });
        }

        // Simulate network delay
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        let response;
        let timeline = [];
        let totalTime = 0;
        let isReal = useRealRequest;

        // Check cache first (for both real and mock requests)
        if (useCache) {
            const cachedResult = cacheSimulator.retrieve(url, method);
            
            if (cachedResult.hit) {
                console.log(`✅ Cache HIT for ${url}`);
                
                // Build timeline for cached response
                timeline = [
                    { stage: 'Cache Lookup', duration: 5 },
                    { stage: 'Validation', duration: 3 },
                    { stage: 'Cache Hit', duration: 2 }
                ];
                totalTime = 10;

                response = {
                    statusCode: cachedResult.statusCode,
                    statusText: cachedResult.statusText,
                    headers: cachedResult.headers,
                    body: cachedResult.body,
                    cached: true,
                    cookies: []
                };

                return res.json({
                    timeline,
                    totalTime,
                    response,
                    connectionType,
                    real: isReal,
                    cacheInfo: {
                        hit: true,
                        age: cachedResult.cacheAge,
                        remainingTime: cachedResult.remainingTime
                    }
                });
            }
            
            console.log(`❌ Cache MISS for ${url} (${cachedResult.reason})`);
        }

        // Make request (real or mock)
        if (useRealRequest) {
            try {
                // Get cookies for this domain
                const cookieHeader = cookieHandler.getCookieHeader(url);
                
                const startTime = Date.now();
                const realResponse = await realRequestHandler.makeRealRequest(
                    url,
                    method,
                    10000,
                    { cookies: cookieHeader }
                );
                const endTime = Date.now();
                totalTime = endTime - startTime;

                if (!realResponse.success) {
                    return res.status(500).json({
                        error: realResponse.errorType,
                        message: realResponse.errorMessage,
                        troubleshooting: realResponse.troubleshooting,
                        details: realResponse
                    });
                }

                // Store cookies from response
                if (realResponse.cookies && realResponse.cookies.length > 0) {
                    cookieHandler.storeCookies(url, realResponse.cookies);
                }

                // Build timeline from real request timing
                timeline = [
                    { stage: 'DNS Lookup', duration: realResponse.timing.dns },
                    { stage: 'TCP Connection', duration: realResponse.timing.tcp },
                    { stage: 'TLS Handshake', duration: realResponse.timing.tls },
                    { stage: 'Request Sent', duration: realResponse.timing.request },
                    { stage: 'Waiting (TTFB)', duration: realResponse.timing.waiting },
                    { stage: 'Content Download', duration: realResponse.timing.download }
                ];

                response = {
                    statusCode: realResponse.statusCode,
                    statusText: realResponse.statusText,
                    headers: realResponse.headers,
                    body: realResponse.body,
                    cached: realResponse.cached,
                    cookies: realResponse.cookies || []
                };

                // Store in cache if successful and cacheable
                if (realResponse.statusCode === 200 && !realResponse.cached) {
                    const cacheControl = realResponse.headers['Cache-Control'] || 'max-age=3600';
                    cacheSimulator.store(url, method, response, cacheControl);
                }

            } catch (error) {
                console.error('Real request failed:', error);
                return res.status(500).json({
                    error: 'Request Failed',
                    message: error.message
                });
            }
        } else {
            // Mock request
            const startTime = Date.now();
            
            // Generate mock timeline
            timeline = [
                { stage: 'DNS Lookup', duration: 50 + Math.random() * 50 },
                { stage: 'TCP Connection', duration: 30 + Math.random() * 30 },
                { stage: 'TLS Handshake', duration: 80 + Math.random() * 40 },
                { stage: 'Request Sent', duration: 10 + Math.random() * 10 },
                { stage: 'Waiting (TTFB)', duration: 100 + Math.random() * 100 },
                { stage: 'Content Download', duration: 50 + Math.random() * 50 }
            ];
            
            totalTime = timeline.reduce((sum, stage) => sum + stage.duration, 0);
            
            // Generate mock response
            response = mockResponse.generateResponse(url, method, false, useCookies);
            
            // Store cookies if enabled
            if (useCookies && response.cookies) {
                cookieHandler.storeCookies(url, response.cookies);
            }

            // Store in cache if cache is enabled for future requests
            if (useCache) {
                cacheSimulator.store(url, method, response, 'max-age=3600');
            }
        }

        // Return simulation result
        res.json({
            timeline,
            totalTime: Math.round(totalTime),
            response,
            connectionType,
            real: isReal,
            cookieInfo: useCookies ? {
                stored: cookieHandler.getCookies(url).length,
                details: cookieHandler.getCookieDetails(url)
            } : null
        });

    } catch (error) {
        console.error('Simulation error:', error);
        res.status(500).json({
            error: 'Simulation Failed',
            message: error.message
        });
    }
});

/**
 * HTTP/2 comparison endpoint
 */
router.post('/simulate-http2', async (req, res) => {
    try {
        const { requests, delay } = req.body;

        // Simulate HTTP/2 parallel requests
        const startTime = Date.now();
        
        // All requests start at the same time (parallel)
        const maxDelay = Math.max(...requests.map(() => delay));
        
        await new Promise(resolve => setTimeout(resolve, maxDelay));
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        const http2Requests = requests.map((req, index) => ({
            id: index + 1,
            url: req.url,
            method: req.method,
            time: delay
        }));

        res.json({
            requests: http2Requests,
            totalTime: Math.round(totalTime)
        });

    } catch (error) {
        res.status(500).json({
            error: 'HTTP/2 simulation failed',
            message: error.message
        });
    }
});

/**
 * Cache management endpoints
 */
router.get('/cache/stats', (req, res) => {
    const stats = cacheSimulator.getStats();
    res.json(stats);
});

router.post('/cache/clear', (req, res) => {
    const cleared = cacheSimulator.clear();
    res.json({
        message: `Cleared ${cleared} cache entries`,
        cleared
    });
});

router.delete('/cache/:url', (req, res) => {
    const url = decodeURIComponent(req.params.url);
    const method = req.query.method || 'GET';
    const deleted = cacheSimulator.invalidate(url, method);
    
    res.json({
        message: deleted ? 'Cache entry deleted' : 'Cache entry not found',
        deleted
    });
});

/**
 * Cookie management endpoints
 */
router.get('/cookies/stats', (req, res) => {
    const stats = cookieHandler.getStats();
    res.json(stats);
});

router.get('/cookies/:domain', (req, res) => {
    const domain = req.params.domain;
    const url = `https://${domain}`;
    const cookies = cookieHandler.getCookieDetails(url);
    
    res.json({
        domain,
        count: cookies.length,
        cookies
    });
});

router.post('/cookies/clear', (req, res) => {
    const { domain } = req.body;
    const cleared = cookieHandler.clearCookies(domain);
    
    res.json({
        message: domain ? `Cleared cookies for ${domain}` : 'Cleared all cookies',
        cleared
    });
});

/**
 * URL diagnostics endpoint
 */
router.post('/diagnose', async (req, res) => {
    try {
        const { url } = req.body;
        const diagnosis = await realRequestHandler.diagnoseUrl(url);
        res.json(diagnosis);
    } catch (error) {
        res.status(500).json({
            error: 'Diagnosis failed',
            message: error.message
        });
    }
});

/**
 * Test endpoint
 */
router.get('/test', (req, res) => {
    res.json({
        message: 'HTTP Simulator API is running! 🚀',
        version: '2.0.0',
        features: [
            'Real HTTP requests',
            'Mock responses',
            'Advanced caching',
            'Cookie management',
            'HTTP/2 comparison',
            'URL diagnostics'
        ],
        endpoints: {
            simulate: '/api/simulate-request',
            http2: '/api/simulate-http2',
            cache: '/api/cache/*',
            cookies: '/api/cookies/*',
            diagnose: '/api/diagnose'
        }
    });
});

module.exports = router;