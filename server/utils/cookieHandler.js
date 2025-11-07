/**
 * Advanced HTTP Cookie Handler
 * Manages cookies with proper parsing, validation, and storage
 */

class CookieHandler {
    constructor() {
        // Cookie jar - stores cookies per domain
        this.cookieJar = new Map();
    }

    /**
     * Parse Set-Cookie header into cookie object
     */
    parseCookie(setCookieHeader) {
        if (!setCookieHeader) return null;

        const parts = setCookieHeader.split(';').map(p => p.trim());
        const [nameValue, ...attributes] = parts;
        const [name, value] = nameValue.split('=');

        const cookie = {
            name: name.trim(),
            value: value ? value.trim() : '',
            attributes: {},
            raw: setCookieHeader
        };

        // Parse attributes
        attributes.forEach(attr => {
            const [key, val] = attr.split('=');
            const attrName = key.trim().toLowerCase();

            switch (attrName) {
                case 'max-age':
                    cookie.attributes.maxAge = parseInt(val);
                    cookie.expiresAt = Date.now() + (parseInt(val) * 1000);
                    break;
                case 'expires':
                    cookie.attributes.expires = val;
                    cookie.expiresAt = new Date(val).getTime();
                    break;
                case 'domain':
                    cookie.attributes.domain = val;
                    break;
                case 'path':
                    cookie.attributes.path = val;
                    break;
                case 'samesite':
                    cookie.attributes.sameSite = val;
                    break;
                case 'secure':
                    cookie.attributes.secure = true;
                    break;
                case 'httponly':
                    cookie.attributes.httpOnly = true;
                    break;
            }
        });

        // Set default expiration if not specified (session cookie)
        if (!cookie.expiresAt) {
            cookie.attributes.session = true;
            cookie.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours default
        }

        return cookie;
    }

    /**
     * Store cookies from response
     */
    storeCookies(url, setCookieHeaders) {
        const domain = this.extractDomain(url);
        
        if (!this.cookieJar.has(domain)) {
            this.cookieJar.set(domain, new Map());
        }

        const domainCookies = this.cookieJar.get(domain);
        const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

        headers.forEach(header => {
            const cookie = this.parseCookie(header);
            if (cookie) {
                domainCookies.set(cookie.name, {
                    ...cookie,
                    createdAt: Date.now(),
                    domain: domain
                });
                console.log(`🍪 Stored cookie: ${cookie.name} for ${domain}`);
            }
        });

        return domainCookies.size;
    }

    /**
     * Get cookies for a request
     */
    getCookies(url, options = {}) {
        const domain = this.extractDomain(url);
        const now = Date.now();
        
        if (!this.cookieJar.has(domain)) {
            return [];
        }

        const domainCookies = this.cookieJar.get(domain);
        const validCookies = [];

        domainCookies.forEach((cookie, name) => {
            // Check if cookie is expired
            if (cookie.expiresAt && now > cookie.expiresAt) {
                domainCookies.delete(name);
                console.log(`🗑️  Expired cookie removed: ${name}`);
                return;
            }

            // Check path matching
            if (cookie.attributes.path) {
                const urlPath = new URL(url).pathname;
                if (!urlPath.startsWith(cookie.attributes.path)) {
                    return;
                }
            }

            // Check secure flag
            if (cookie.attributes.secure && !url.startsWith('https')) {
                return;
            }

            validCookies.push(cookie);
        });

        return validCookies;
    }

    /**
     * Generate Cookie header for request
     */
    getCookieHeader(url) {
        const cookies = this.getCookies(url);
        
        if (cookies.length === 0) {
            return null;
        }

        return cookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
    }

    /**
     * Generate mock cookies for demonstration
     */
    generateMockCookies(domain = 'example.com') {
        const sessionId = this.generateRandomString(32);
        const userId = Math.floor(Math.random() * 100000);
        const csrfToken = this.generateRandomString(40);

        return [
            `sessionId=${sessionId}; Path=/; HttpOnly; Secure; Max-Age=3600; SameSite=Strict`,
            `userId=${userId}; Path=/; Max-Age=86400; SameSite=Lax`,
            `theme=dark; Path=/; Max-Age=2592000`,
            `language=en; Path=/; Max-Age=31536000`,
            `csrf_token=${csrfToken}; Path=/; Secure; SameSite=Strict`,
            `preferences={"notifications":true,"autoplay":false}; Path=/; Max-Age=604800`
        ];
    }

    /**
     * Get detailed cookie information
     */
    getCookieDetails(url) {
        const cookies = this.getCookies(url);
        const now = Date.now();

        return cookies.map(cookie => {
            const age = now - cookie.createdAt;
            const remaining = cookie.expiresAt ? cookie.expiresAt - now : null;

            return {
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.attributes.path || '/',
                secure: cookie.attributes.secure || false,
                httpOnly: cookie.attributes.httpOnly || false,
                sameSite: cookie.attributes.sameSite || 'None',
                session: cookie.attributes.session || false,
                age: Math.floor(age / 1000),
                remainingTime: remaining ? Math.floor(remaining / 1000) : null,
                expiresAt: cookie.expiresAt ? new Date(cookie.expiresAt).toISOString() : 'Session',
                size: cookie.raw.length,
                raw: cookie.raw
            };
        });
    }

    /**
     * Clear cookies for domain
     */
    clearCookies(domain) {
        if (domain) {
            const deleted = this.cookieJar.delete(domain);
            if (deleted) {
                console.log(`🗑️  Cleared cookies for ${domain}`);
            }
            return deleted;
        } else {
            const count = this.cookieJar.size;
            this.cookieJar.clear();
            console.log(`🗑️  Cleared all cookies (${count} domains)`);
            return count;
        }
    }

    /**
     * Get cookie statistics
     */
    getStats() {
        const stats = {
            totalDomains: this.cookieJar.size,
            totalCookies: 0,
            domains: []
        };

        this.cookieJar.forEach((cookies, domain) => {
            stats.totalCookies += cookies.size;
            stats.domains.push({
                domain,
                cookieCount: cookies.size,
                cookies: Array.from(cookies.keys())
            });
        });

        return stats;
    }

    /**
     * Cleanup expired cookies
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        this.cookieJar.forEach((domainCookies, domain) => {
            domainCookies.forEach((cookie, name) => {
                if (cookie.expiresAt && now > cookie.expiresAt) {
                    domainCookies.delete(name);
                    cleaned++;
                }
            });

            // Remove domain if no cookies left
            if (domainCookies.size === 0) {
                this.cookieJar.delete(domain);
            }
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired cookies`);
        }

        return cleaned;
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            const parsed = new URL(url);
            return parsed.hostname;
        } catch (e) {
            return 'localhost';
        }
    }

    /**
     * Generate random string for cookie values
     */
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Validate cookie against security best practices
     */
    validateCookie(cookie) {
        const warnings = [];
        const recommendations = [];

        // Check for sensitive cookies without Secure flag
        if (['session', 'token', 'auth'].some(word => cookie.name.toLowerCase().includes(word))) {
            if (!cookie.attributes.secure) {
                warnings.push('Sensitive cookie should have Secure flag');
            }
            if (!cookie.attributes.httpOnly) {
                warnings.push('Sensitive cookie should have HttpOnly flag');
            }
            if (!cookie.attributes.sameSite) {
                recommendations.push('Consider adding SameSite attribute');
            }
        }

        // Check expiration
        if (!cookie.expiresAt && !cookie.attributes.session) {
            recommendations.push('Consider setting expiration time');
        }

        return {
            valid: warnings.length === 0,
            warnings,
            recommendations
        };
    }
}

// Export singleton instance
module.exports = new CookieHandler();