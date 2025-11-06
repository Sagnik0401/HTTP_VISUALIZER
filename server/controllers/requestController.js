const config = require('../../config/config');
const responseGenerator = require('../utils/responseGenerator');
const realRequestHandler = require('../utils/realRequestHandler');

// Simulate a single HTTP request
exports.simulateRequest = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const {
            url,
            method = 'GET',
            delay = config.DEFAULT_DELAY,
            packetLoss = 0,
            connectionType = 'keep-alive',
            useCache = false,
            useCookies = false,
            useRealRequest = true  // NEW: Toggle for real vs mock
        } = req.body;

        // Validate inputs
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Simulate packet loss BEFORE making request
        if (Math.random() * 100 < packetLoss) {
            return res.status(200).json({
                success: false,
                error: true,
                packetLoss: true,
                errorType: 'Packet Lost',
                errorMessage: `Request failed due to ${packetLoss}% packet loss simulation`,
                statusCode: 0,
                timeline: [],
                totalTime: 0
            });
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, delay));

        let mockResponse;
        let realResponse;
        let timeline;
        let totalTime;
        let isReal = false;

        // Decide: Real request or Mock?
        if (useRealRequest && realRequestHandler.isValidUrl(url)) {
            try {
                // Make REAL HTTP request
                console.log(`📡 Making real request to: ${url}`);
                realResponse = await realRequestHandler.makeRealRequest(url, method, 10000);
                isReal = true;

                if (realResponse.success) {
                    // Use real response data
                    totalTime = Date.now() - startTime;
                    
                    // Generate timeline from real timing
                    timeline = generateTimelineFromReal(realResponse.timing, delay);

                    // Format response
                    const response = {
                        success: true,
                        real: true,
                        request: {
                            url,
                            method,
                            timestamp: new Date(startTime).toISOString()
                        },
                        response: {
                            statusCode: realResponse.statusCode,
                            statusText: realResponse.statusText,
                            headers: {
                                ...realResponse.headers,
                                'Connection': connectionType,
                                'X-Real-Request': 'true',
                                'X-Simulated-Delay': `${delay}ms`
                            },
                            body: realResponse.body,
                            cached: false,
                            cookies: useCookies ? responseGenerator.generateResponse(url, method, false, true).cookies : []
                        },
                        timeline,
                        totalTime,
                        connectionType,
                        cached: false,
                        contentType: realResponse.contentType,
                        contentLength: realResponse.contentLength,
                        redirected: realResponse.redirected,
                        finalUrl: realResponse.finalUrl
                    };

                    return res.json(response);

                } else {
                    // Real request failed - return error details
                    totalTime = Date.now() - startTime;
                    
                    return res.json({
                        success: false,
                        real: true,
                        error: true,
                        errorType: realResponse.errorType,
                        errorMessage: realResponse.errorMessage,
                        errorCode: realResponse.errorCode,
                        statusCode: realResponse.statusCode,
                        request: {
                            url,
                            method,
                            timestamp: new Date(startTime).toISOString()
                        },
                        response: {
                            statusCode: realResponse.statusCode,
                            statusText: realResponse.statusText,
                            headers: realResponse.headers,
                            body: realResponse.body
                        },
                        timeline: realResponse.timing ? generateTimelineFromReal(realResponse.timing, delay) : [],
                        totalTime
                    });
                }

            } catch (error) {
                console.error('❌ Real request error:', error.message);
                // Fall back to mock if real request fails completely
                isReal = false;
            }
        }

        // Use MOCK response (fallback or if useRealRequest = false)
        if (!isReal) {
            console.log(`🎭 Using mock response for: ${url}`);
            mockResponse = responseGenerator.generateResponse(url, method, useCache, useCookies);
            totalTime = Date.now() - startTime;
            timeline = generateTimeline(startTime, delay);

            const response = {
                success: true,
                real: false,
                request: {
                    url,
                    method,
                    timestamp: new Date(startTime).toISOString()
                },
                response: mockResponse,
                timeline,
                totalTime,
                connectionType,
                cached: useCache && mockResponse.statusCode === 304
            };

            return res.json(response);
        }

    } catch (error) {
        console.error('❌ Simulation error:', error);
        res.status(500).json({
            error: 'Simulation Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Simulate HTTP/2 concurrent requests
exports.simulateHTTP2 = async (req, res) => {
    const { requests = [], delay = config.DEFAULT_DELAY, useRealRequest = true } = req.body;
    
    const startTime = Date.now();
    
    try {
        // Simulate concurrent requests
        const results = await Promise.all(
            requests.map(async (request, index) => {
                // Add small delay for visual effect
                await new Promise(resolve => setTimeout(resolve, delay));
                
                if (useRealRequest && realRequestHandler.isValidUrl(request.url)) {
                    try {
                        // Make real concurrent request
                        const realResp = await realRequestHandler.makeRealRequest(
                            request.url, 
                            request.method || 'GET',
                            5000
                        );
                        
                        return {
                            id: index + 1,
                            url: request.url,
                            method: request.method || 'GET',
                            statusCode: realResp.statusCode,
                            time: realResp.timing.total,
                            real: true,
                            success: realResp.success
                        };
                    } catch (error) {
                        return {
                            id: index + 1,
                            url: request.url,
                            method: request.method || 'GET',
                            statusCode: 0,
                            time: delay,
                            real: false,
                            error: true
                        };
                    }
                } else {
                    // Mock response
                    return {
                        id: index + 1,
                        url: request.url,
                        method: request.method || 'GET',
                        statusCode: 200,
                        time: delay + Math.random() * 100,
                        real: false
                    };
                }
            })
        );

        const totalTime = Date.now() - startTime;

        res.json({
            success: true,
            protocol: 'HTTP/2',
            requests: results,
            totalTime,
            concurrent: true,
            real: useRealRequest
        });

    } catch (error) {
        console.error('❌ HTTP/2 simulation error:', error);
        res.status(500).json({
            error: 'HTTP/2 Simulation Error',
            message: error.message
        });
    }
};

// Get mock resource
exports.getMockResource = (req, res) => {
    const { id } = req.params;
    
    res.json({
        id,
        data: `Mock resource data for ID: ${id}`,
        timestamp: new Date().toISOString(),
        real: false
    });
};

// Helper function to generate timeline (MOCK)
function generateTimeline(startTime, delay) {
    const dnsTime = Math.floor(delay * 0.1);
    const tcpTime = Math.floor(delay * 0.15);
    const tlsTime = Math.floor(delay * 0.15);
    const requestTime = Math.floor(delay * 0.1);
    const waitingTime = Math.floor(delay * 0.3);
    const downloadTime = Math.floor(delay * 0.2);

    return [
        {
            stage: 'DNS Lookup',
            duration: dnsTime,
            startTime: 0
        },
        {
            stage: 'TCP Connection',
            duration: tcpTime,
            startTime: dnsTime
        },
        {
            stage: 'TLS Handshake',
            duration: tlsTime,
            startTime: dnsTime + tcpTime
        },
        {
            stage: 'Request Sent',
            duration: requestTime,
            startTime: dnsTime + tcpTime + tlsTime
        },
        {
            stage: 'Waiting (TTFB)',
            duration: waitingTime,
            startTime: dnsTime + tcpTime + tlsTime + requestTime
        },
        {
            stage: 'Content Download',
            duration: downloadTime,
            startTime: dnsTime + tcpTime + tlsTime + requestTime + waitingTime
        }
    ];
}

// Helper function to generate timeline from REAL request timing
function generateTimelineFromReal(timing, simulatedDelay) {
    // Add simulated delay to each stage proportionally
    const totalReal = timing.total;
    const delayPerStage = simulatedDelay / 6;

    return [
        {
            stage: 'DNS Lookup',
            duration: timing.dns + Math.floor(delayPerStage),
            startTime: 0
        },
        {
            stage: 'TCP Connection',
            duration: timing.tcp + Math.floor(delayPerStage),
            startTime: timing.dns + Math.floor(delayPerStage)
        },
        {
            stage: 'TLS Handshake',
            duration: timing.tls + Math.floor(delayPerStage),
            startTime: timing.dns + timing.tcp + Math.floor(delayPerStage * 2)
        },
        {
            stage: 'Request Sent',
            duration: timing.request + Math.floor(delayPerStage),
            startTime: timing.dns + timing.tcp + timing.tls + Math.floor(delayPerStage * 3)
        },
        {
            stage: 'Waiting (TTFB)',
            duration: timing.waiting + Math.floor(delayPerStage),
            startTime: timing.dns + timing.tcp + timing.tls + timing.request + Math.floor(delayPerStage * 4)
        },
        {
            stage: 'Content Download',
            duration: timing.download + Math.floor(delayPerStage),
            startTime: timing.dns + timing.tcp + timing.tls + timing.request + timing.waiting + Math.floor(delayPerStage * 5)
        }
    ];
}