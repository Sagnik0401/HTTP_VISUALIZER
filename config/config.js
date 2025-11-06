module.exports = {
    PORT: process.env.PORT || 3000,
    
    // Default simulation settings
    DEFAULT_DELAY: 100, // milliseconds
    MAX_DELAY: 5000,
    MIN_DELAY: 0,
    
    DEFAULT_PACKET_LOSS: 0, // percentage
    MAX_PACKET_LOSS: 100,
    
    // HTTP settings
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    
    // Response simulation
    MOCK_RESPONSES: {
        SUCCESS: {
            statusCode: 200,
            statusText: 'OK'
        },
        NOT_FOUND: {
            statusCode: 404,
            statusText: 'Not Found'
        },
        SERVER_ERROR: {
            statusCode: 500,
            statusText: 'Internal Server Error'
        },
        CACHED: {
            statusCode: 304,
            statusText: 'Not Modified'
        }
    },
    
    // Default headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Server': 'HTTP-Simulator/1.0',
        'X-Powered-By': 'Node.js'
    }
};