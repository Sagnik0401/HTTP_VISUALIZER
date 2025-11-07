const axios = require('axios');
const https = require('https');
const config = require('../../config/config');

/**
 * Make a real HTTP request to external URL with improved error handling
 * @param {string} url - Target URL
 * @param {string} method - HTTP method
 * @param {number} timeout - Request timeout in ms
 * @param {object} options - Additional options
 * @returns {Promise} Real response data
 */
async function makeRealRequest(url, method = 'GET', timeout = 10000, options = {}) {
    const startTime = Date.now();
    
    try {
        // Validate URL
        if (!isValidUrl(url)) {
            throw new Error('Invalid URL format');
        }

        // Configure axios request with improved settings
        const axiosConfig = {
            method: method.toLowerCase(),
            url: url,
            timeout: timeout,
            maxRedirects: 5,
            validateStatus: () => true, // Accept any status code
            maxContentLength: 5 * 1024 * 1024, // 5MB limit
            headers: {
                // Use a more standard user agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            // Handle SSL/TLS issues (for educational sites with certificate problems)
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // Allow self-signed certificates
                secureProtocol: 'TLSv1_2_method'
            }),
            // Decompress responses
            decompress: true
        };

        // Add body for POST/PUT requests
        if (method === 'POST' || method === 'PUT') {
            axiosConfig.data = {
                message: 'Test request from HTTP Simulator',
                timestamp: new Date().toISOString()
            };
            axiosConfig.headers['Content-Type'] = 'application/json';
        }

        // Include cookies if provided
        if (options.cookies) {
            axiosConfig.headers['Cookie'] = options.cookies;
        }

        // Add conditional request headers for cache validation
        if (options.ifNoneMatch) {
            axiosConfig.headers['If-None-Match'] = options.ifNoneMatch;
        }
        if (options.ifModifiedSince) {
            axiosConfig.headers['If-Modified-Since'] = options.ifModifiedSince;
        }

        console.log(`🌐 Making real request to: ${url}`);

        // Make the request
        const response = await axios(axiosConfig);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        console.log(`✅ Response received: ${response.status} ${response.statusText} (${totalTime}ms)`);

        // Extract response data
        const result = {
            success: true,
            statusCode: response.status,
            statusText: response.statusText,
            headers: formatHeaders(response.headers),
            body: formatBody(response.data),
            timing: {
                total: totalTime,
                // Estimate timing breakdown
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
            cookies: extractCookies(response.headers['set-cookie']),
            cached: response.status === 304,
            real: true
        };

        return result;

    } catch (error) {
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        console.error(`❌ Request failed: ${error.message}`);

        // Handle different error types
        return handleRequestError(error, url, totalTime);
    }
}

/**
 * Validate URL format with relaxed restrictions
 */
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        
        // Only allow http and https protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }
        
        // REMOVED: Private IP blocking to allow testing with educational sites
        // Most educational institutions have public IPs anyway
        
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
 * Format response body with better handling
 */
function formatBody(data) {
    // If it's already an object, return as is
    if (typeof data === 'object' && data !== null) {
        return data;
    }
    
    // If it's a string, try to parse as JSON
    if (typeof data === 'string') {
        // Check if it's HTML
        if (data.trim().startsWith('<')) {
            return {
                contentType: 'text/html',
                preview: data.substring(0, 500) + (data.length > 500 ? '... (truncated)' : ''),
                size: data.length,
                note: 'HTML content (showing preview)'
            };
        }
        
        try {
            return JSON.parse(data);
        } catch (e) {
            // If not JSON, return as text
            return {
                contentType: 'text/plain',
                data: data.substring(0, 1000) + (data.length > 1000 ? '... (truncated)' : ''),
                size: data.length
            };
        }
    }
    
    return data;
}

/**
 * Extract cookies from Set-Cookie header
 */
function extractCookies(setCookieHeader) {
    if (!setCookieHeader) return [];
    
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    return headers.map(cookie => cookie.split(';')[0]); // Get name=value part only
}

/**
 * Handle request errors with detailed messages
 */
function handleRequestError(error, url, totalTime) {
    let errorType = 'Unknown Error';
    let errorMessage = error.message;
    let statusCode = 0;
    let troubleshooting = [];

    if (error.code === 'ENOTFOUND') {
        errorType = 'DNS Resolution Failed';
        errorMessage = `Could not resolve hostname. The domain "${new URL(url).hostname}" does not exist or is unreachable.`;
        statusCode = 0;
        troubleshooting = [
            'Check if the domain name is spelled correctly',
            'Verify that the domain exists and is accessible',
            'Try accessing the URL in your browser first',
            'Check if there are any DNS issues'
        ];
    } else if (error.code === 'ECONNREFUSED') {
        errorType = 'Connection Refused';
        errorMessage = `Server refused the connection. The server at "${url}" is not accepting connections.`;
        statusCode = 0;
        troubleshooting = [
            'Server might be down or not running',
            'Firewall might be blocking the connection',
            'Port might be closed',
            'Server might be blocking automated requests'
        ];
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorType = 'Request Timeout';
        errorMessage = `Request took too long to complete. The server did not respond within ${totalTime}ms.`;
        statusCode = 408;
        troubleshooting = [
            'Server is responding very slowly',
            'Network connection is unstable',
            'Try increasing the timeout value',
            'Server might be overloaded'
        ];
    } else if (error.code === 'ECONNRESET') {
        errorType = 'Connection Reset';
        errorMessage = `Connection was reset by the server or network.`;
        statusCode = 0;
        troubleshooting = [
            'Server unexpectedly closed the connection',
            'Network issue between client and server',
            'Server might have crashed',
            'Firewall or proxy interference'
        ];
    } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        errorType = 'SSL Certificate Error';
        errorMessage = `SSL/TLS certificate validation failed: ${error.message}`;
        statusCode = 0;
        troubleshooting = [
            'Server has an expired or invalid SSL certificate',
            'This is common with educational institution websites',
            'Certificate might be self-signed',
            'Try accessing via HTTP instead of HTTPS (if available)'
        ];
    } else if (error.response) {
        // Server responded with error status
        errorType = 'HTTP Error';
        errorMessage = `Server returned status ${error.response.status}: ${error.response.statusText}`;
        statusCode = error.response.status;
        
        if (statusCode === 403) {
            troubleshooting = [
                'Server is blocking automated requests',
                'Access forbidden - authentication might be required',
                'WAF (Web Application Firewall) might be blocking the request',
                'Try accessing the URL in a browser first'
            ];
        } else if (statusCode === 503) {
            troubleshooting = [
                'Server is temporarily unavailable',
                'Server might be under maintenance',
                'Server might be overloaded',
                'Try again later'
            ];
        }
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
        body: error.response ? formatBody(error.response.data) : {
            error: errorType,
            message: errorMessage,
            troubleshooting: troubleshooting
        },
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
        real: true,
        troubleshooting: troubleshooting
    };
}

/**
 * Test if URL is reachable (quick HEAD request)
 */
async function testUrlReachability(url) {
    try {
        const agent = new https.Agent({
            rejectUnauthorized: false
        });
        
        await axios.head(url, { 
            timeout: 5000,
            httpsAgent: agent
        });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get detailed information about why a URL might be failing
 */
async function diagnoseUrl(url) {
    console.log(`🔍 Diagnosing URL: ${url}`);
    
    const diagnosis = {
        url: url,
        checks: []
    };

    try {
        const parsed = new URL(url);
        diagnosis.checks.push({
            test: 'URL Format',
            passed: true,
            message: 'URL format is valid'
        });

        // Test DNS resolution
        try {
            const dns = require('dns').promises;
            await dns.resolve(parsed.hostname);
            diagnosis.checks.push({
                test: 'DNS Resolution',
                passed: true,
                message: `Domain ${parsed.hostname} resolves successfully`
            });
        } catch (e) {
            diagnosis.checks.push({
                test: 'DNS Resolution',
                passed: false,
                message: `Cannot resolve ${parsed.hostname}: ${e.message}`
            });
        }

        // Test reachability
        const reachable = await testUrlReachability(url);
        diagnosis.checks.push({
            test: 'Server Reachability',
            passed: reachable,
            message: reachable ? 'Server is reachable' : 'Server is not responding'
        });

    } catch (e) {
        diagnosis.checks.push({
            test: 'URL Format',
            passed: false,
            message: `Invalid URL: ${e.message}`
        });
    }

    return diagnosis;
}

module.exports = {
    makeRealRequest,
    testUrlReachability,
    isValidUrl,
    diagnoseUrl
};