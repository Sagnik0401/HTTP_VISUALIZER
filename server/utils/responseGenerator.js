const config = require('../../config/config');

// Generate mock HTTP response
// Generate mock HTTP response
exports.generateResponse = (url, method, useCache = false, useCookies = false) => {
    // If cache is enabled, return 304
    if (useCache) {
        return {
            statusCode: 304,
            statusText: 'Not Modified',
            headers: {
                ...config.DEFAULT_HEADERS,
                'Cache-Control': 'max-age=3600',
                'ETag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
                'Last-Modified': new Date(Date.now() - 3600000).toUTCString()
            },
            body: null,
            cached: true,
            cookies: useCookies ? generateCookies() : []
        };
    }

    // Determine status based on URL patterns
    let statusCode = 200;
    let statusText = 'OK';
    let body = {};

    if (url.includes('404') || url.includes('notfound')) {
        statusCode = 404;
        statusText = 'Not Found';
        body = { error: 'Resource not found' };
    } else if (url.includes('500') || url.includes('error')) {
        statusCode = 500;
        statusText = 'Internal Server Error';
        body = { error: 'Server error occurred' };
    } else if (url.includes('403') || url.includes('forbidden')) {
        statusCode = 403;
        statusText = 'Forbidden';
        body = { error: 'Access denied' };
    } else {
        // Success response
        body = generateMockData(method, url);
    }

    // Generate response headers
    const headers = {
        ...config.DEFAULT_HEADERS,
        'Content-Length': JSON.stringify(body).length.toString(),
        'Date': new Date().toUTCString(),
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'ETag': generateETag(),
        'X-Response-Time': Math.floor(Math.random() * 100) + 'ms'
    };

    // Add Set-Cookie headers if cookies enabled
    const cookies = useCookies ? generateCookies() : [];
    if (cookies.length > 0) {
        headers['Set-Cookie'] = cookies;
    }

    return {
        statusCode,
        statusText,
        headers,
        body,
        cached: false,
        cookies
    };
};

// Generate mock cookies
function generateCookies() {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const userId = Math.floor(Math.random() * 10000);
    
    return [
        `sessionId=${sessionId}; Path=/; HttpOnly; Secure; Max-Age=3600`,
        `userId=${userId}; Path=/; Max-Age=86400`,
        `theme=dark; Path=/; Max-Age=2592000`,
        `language=en; Path=/; Max-Age=31536000`
    ];
}

// Generate mock data based on method and URL
function generateMockData(method, url) {
    const timestamp = new Date().toISOString();
    
    switch (method) {
        case 'GET':
            return {
                message: 'Data retrieved successfully',
                data: {
                    id: Math.floor(Math.random() * 1000),
                    url: url,
                    timestamp: timestamp,
                    items: generateItems(5)
                },
                method: 'GET'
            };
        
        case 'POST':
            return {
                message: 'Resource created successfully',
                data: {
                    id: Math.floor(Math.random() * 1000),
                    created: timestamp,
                    url: url
                },
                method: 'POST'
            };
        
        case 'PUT':
            return {
                message: 'Resource updated successfully',
                data: {
                    id: Math.floor(Math.random() * 1000),
                    updated: timestamp,
                    url: url
                },
                method: 'PUT'
            };
        
        case 'DELETE':
            return {
                message: 'Resource deleted successfully',
                data: {
                    id: Math.floor(Math.random() * 1000),
                    deleted: timestamp
                },
                method: 'DELETE'
            };
        
        default:
            return {
                message: 'Request processed',
                timestamp: timestamp
            };
    }
}

// Generate random items for GET responses
function generateItems(count) {
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push({
            id: i + 1,
            name: `Item ${i + 1}`,
            value: Math.floor(Math.random() * 100)
        });
    }
    return items;
}

// Generate ETag
function generateETag() {
    return `"${Math.random().toString(36).substring(2, 15)}"`;
}