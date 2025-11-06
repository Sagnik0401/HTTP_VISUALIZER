const axios = require('axios');
const config = require('../../config/config');

/**
 * Make a real HTTP request to external URL
 * @param {string} url - Target URL
 * @param {string} method - HTTP method
 * @param {number} timeout - Request timeout in ms
 * @returns {Promise} Real response data
 */
async function makeRealRequest(url, method = 'GET', timeout = 10000) {
    const startTime = Date.now();
    
    try {
        // Validate URL
        if (!isValidUrl(url)) {
            throw new Error('Invalid URL format');
        }

        // Configure axios request
        const axiosConfig = {
            method: method.toLowerCase(),
            url: url,
            timeout: timeout,
            maxRedirects: 5,
            validateStatus: () => true, // Accept any status code
            maxContentLength: 5 * 1024 * 1024, // 5MB limit
            headers: {
                'User-Agent': 'HTTP-Simulator/1.0 (Educational Tool)',
                'Accept': '*/*'
            }
        };

        // Add body for POST/PUT requests
        if (method === 'POST' || method === 'PUT') {
            axiosConfig.data = {
                message: 'Test request from HTTP Simulator',
                timestamp: new Date().toISOString()
            };
            axiosConfig.headers['Content-Type'] = 'application/json';
        }

        // Make the request
        const response = await axios(axiosConfig);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Extract response data
        const result = {
            success: true,
            statusCode: response.status,
            statusText: response.statusText,
            headers: formatHeaders(response.headers),
            body: formatBody(response.data),
            timing: {
                total: totalTime,
                // We can't measure exact DNS/TCP separately with axios
                // So we'll estimate proportionally
                dns: Math.floor(totalTime * 0.1),
                tcp: Math.floor(totalTime * 0.15),
                tls: Math.floor(totalTime * 0.15),
                request: Math.floor(totalTime * 0.1),
                waiting: Math.floor(totalTime * 0.3),
                download: Math.floor(totalTime * 0.2)
            },
            url: response.config.url,
            redirected: response.request.res?.responseUrl !== url,
            finalUrl: response.request.res?.responseUrl || url,
            contentType: response.headers['content-type'] || 'unknown',
            contentLength: response.headers['content-length'] || 'unknown',
            real: true
        };

        return result;

    } catch (error) {
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Handle different error types
        return handleRequestError(error, url, totalTime);
    }
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }
        // Block localhost and private IPs for security (optional)
        const hostname = parsed.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') || hostname.startsWith('10.') ||
            hostname.startsWith('172.16.')) {
            return false; // Comment this out if you want to allow local testing
        }
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Format response headers for display
 */
function formatHeaders(headers) {
    const formatted = {};
    Object.keys(headers).forEach(key => {
        // Capitalize header names for better display
        const capitalizedKey = key.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');
        formatted[capitalizedKey] = headers[key];
    });
    return formatted;
}

/**
 * Format response body
 */
function formatBody(data) {
    // If it's already an object, return as is
    if (typeof data === 'object' && data !== null) {
        return data;
    }
    
    // If it's a string, try to parse as JSON
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            // If not JSON, return as text
            return {
                contentType: 'text/plain',
                data: data.substring(0, 1000) + (data.length > 1000 ? '... (truncated)' : '')
            };
        }
    }
    
    return data;
}

/**
 * Handle request errors with detailed messages
 */
function handleRequestError(error, url, totalTime) {
    let errorType = 'Unknown Error';
    let errorMessage = error.message;
    let statusCode = 0;

    if (error.code === 'ENOTFOUND') {
        errorType = 'DNS Resolution Failed';
        errorMessage = `Could not resolve hostname. The domain "${url}" does not exist or is unreachable.`;
        statusCode = 0;
    } else if (error.code === 'ECONNREFUSED') {
        errorType = 'Connection Refused';
        errorMessage = `Server refused the connection. The server at "${url}" is not accepting connections.`;
        statusCode = 0;
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorType = 'Request Timeout';
        errorMessage = `Request took too long to complete. The server did not respond within the timeout period.`;
        statusCode = 408;
    } else if (error.code === 'ECONNRESET') {
        errorType = 'Connection Reset';
        errorMessage = `Connection was reset by the server.`;
        statusCode = 0;
    } else if (error.response) {
        // Server responded with error status
        errorType = 'HTTP Error';
        errorMessage = `Server returned status ${error.response.status}: ${error.response.statusText}`;
        statusCode = error.response.status;
    }

    return {
        success: false,
        error: true,
        errorType: errorType,
        errorMessage: errorMessage,
        errorCode: error.code,
        statusCode: statusCode,
        statusText: errorType,
        headers: error.response ? formatHeaders(error.response.headers) : {},
        body: error.response ? formatBody(error.response.data) : null,
        timing: {
            total: totalTime,
            dns: 0,
            tcp: 0,
            tls: 0,
            request: 0,
            waiting: 0,
            download: 0
        },
        url: url,
        real: true
    };
}

/**
 * Test if URL is reachable (quick HEAD request)
 */
async function testUrlReachability(url) {
    try {
        await axios.head(url, { timeout: 5000 });
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    makeRealRequest,
    testUrlReachability,
    isValidUrl
};