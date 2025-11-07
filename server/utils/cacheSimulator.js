/**
 * Advanced HTTP Cache Simulator
 * Handles cache storage, validation, and expiration
 */

class CacheSimulator {
    constructor() {
        // In-memory cache storage
        this.cache = new Map();
        this.cacheMetadata = new Map();
    }

    /**
     * Generate cache key from URL and method
     */
    generateCacheKey(url, method = 'GET') {
        return `${method}:${url}`;
    }

    /**
     * Store response in cache
     */
    store(url, method, response, cacheControl) {
        const key = this.generateCacheKey(url, method);
        const now = Date.now();
        
        // Parse cache-control directives
        const directives = this.parseCacheControl(cacheControl);
        
        // Calculate expiration time
        const maxAge = directives['max-age'] || 3600; // Default 1 hour
        const expiresAt = now + (maxAge * 1000);
        
        // Generate ETag if not present
        const etag = response.headers.ETag || this.generateETag(response.body);
        
        // Store cache entry
        this.cache.set(key, {
            response: {
                ...response,
                headers: {
                    ...response.headers,
                    'ETag': etag
                }
            },
            storedAt: now,
            expiresAt: expiresAt,
            etag: etag,
            lastModified: response.headers['Last-Modified'] || new Date(now).toUTCString(),
            accessCount: 0,
            lastAccessed: now
        });

        // Store metadata
        this.cacheMetadata.set(key, {
            url,
            method,
            size: JSON.stringify(response.body).length,
            maxAge: maxAge,
            directives: directives
        });

        console.log(`✅ Cached: ${key} (expires in ${maxAge}s)`);
        
        return etag;
    }

    /**
     * Retrieve from cache with validation
     */
    retrieve(url, method, requestHeaders = {}) {
        const key = this.generateCacheKey(url, method);
        const cached = this.cache.get(key);
        
        if (!cached) {
            return { hit: false, reason: 'not-found' };
        }

        const now = Date.now();
        
        // Check if cache is expired
        if (now > cached.expiresAt) {
            this.cache.delete(key);
            this.cacheMetadata.delete(key);
            return { hit: false, reason: 'expired', expiredAt: cached.expiresAt };
        }

        // Validate conditional requests
        const ifNoneMatch = requestHeaders['If-None-Match'];
        const ifModifiedSince = requestHeaders['If-Modified-Since'];

        // ETag validation
        if (ifNoneMatch && ifNoneMatch === cached.etag) {
            // Update access stats
            cached.accessCount++;
            cached.lastAccessed = now;
            this.cache.set(key, cached);

            return {
                hit: true,
                type: 'conditional',
                statusCode: 304,
                statusText: 'Not Modified',
                headers: {
                    'Cache-Control': this.cacheMetadata.get(key).directives.original || 'max-age=3600',
                    'ETag': cached.etag,
                    'Last-Modified': cached.lastModified,
                    'Age': Math.floor((now - cached.storedAt) / 1000),
                    'X-Cache': 'HIT',
                    'X-Cache-Lookup': 'HIT from cache'
                },
                body: null, // 304 responses have no body
                cached: true,
                cacheAge: now - cached.storedAt,
                remainingTime: cached.expiresAt - now
            };
        }

        // Last-Modified validation
        if (ifModifiedSince) {
            const modifiedDate = new Date(cached.lastModified).getTime();
            const sinceDate = new Date(ifModifiedSince).getTime();
            
            if (modifiedDate <= sinceDate) {
                cached.accessCount++;
                cached.lastAccessed = now;
                this.cache.set(key, cached);

                return {
                    hit: true,
                    type: 'conditional',
                    statusCode: 304,
                    statusText: 'Not Modified',
                    headers: {
                        'Cache-Control': this.cacheMetadata.get(key).directives.original || 'max-age=3600',
                        'Last-Modified': cached.lastModified,
                        'Age': Math.floor((now - cached.storedAt) / 1000),
                        'X-Cache': 'HIT',
                        'X-Cache-Lookup': 'HIT from cache'
                    },
                    body: null,
                    cached: true,
                    cacheAge: now - cached.storedAt,
                    remainingTime: cached.expiresAt - now
                };
            }
        }

        // Full cache hit - return complete response
        cached.accessCount++;
        cached.lastAccessed = now;
        this.cache.set(key, cached);

        return {
            hit: true,
            type: 'full',
            statusCode: 200,
            statusText: 'OK',
            headers: {
                ...cached.response.headers,
                'Age': Math.floor((now - cached.storedAt) / 1000),
                'X-Cache': 'HIT',
                'X-Cache-Lookup': 'HIT from cache'
            },
            body: cached.response.body,
            cached: true,
            cacheAge: now - cached.storedAt,
            remainingTime: cached.expiresAt - now
        };
    }

    /**
     * Check if resource should be revalidated
     */
    shouldRevalidate(url, method) {
        const key = this.generateCacheKey(url, method);
        const cached = this.cache.get(key);
        
        if (!cached) return false;
        
        const now = Date.now();
        const age = now - cached.storedAt;
        const maxAge = this.cacheMetadata.get(key).maxAge * 1000;
        
        // Revalidate if more than 80% of max-age has passed
        return age > (maxAge * 0.8);
    }

    /**
     * Parse Cache-Control header
     */
    parseCacheControl(cacheControl) {
        const directives = { original: cacheControl };
        
        if (!cacheControl) return directives;
        
        const parts = cacheControl.split(',').map(p => p.trim());
        
        parts.forEach(part => {
            if (part.includes('=')) {
                const [key, value] = part.split('=');
                directives[key.trim()] = parseInt(value.trim()) || value.trim();
            } else {
                directives[part] = true;
            }
        });
        
        return directives;
    }

    /**
     * Generate ETag from response body
     */
    generateETag(body) {
        const content = JSON.stringify(body);
        let hash = 0;
        
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return `"${Math.abs(hash).toString(36)}"`;
    }

    /**
     * Invalidate cache entry
     */
    invalidate(url, method = 'GET') {
        const key = this.generateCacheKey(url, method);
        const deleted = this.cache.delete(key);
        this.cacheMetadata.delete(key);
        
        if (deleted) {
            console.log(`🗑️  Cache invalidated: ${key}`);
        }
        
        return deleted;
    }

    /**
     * Clear all cache
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.cacheMetadata.clear();
        console.log(`🗑️  Cleared ${size} cache entries`);
        return size;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const stats = {
            totalEntries: this.cache.size,
            totalSize: 0,
            entries: []
        };

        this.cache.forEach((cached, key) => {
            const metadata = this.cacheMetadata.get(key);
            const now = Date.now();
            
            stats.totalSize += metadata.size;
            stats.entries.push({
                key,
                url: metadata.url,
                method: metadata.method,
                size: metadata.size,
                age: Math.floor((now - cached.storedAt) / 1000),
                remainingTime: Math.max(0, Math.floor((cached.expiresAt - now) / 1000)),
                accessCount: cached.accessCount,
                lastAccessed: new Date(cached.lastAccessed).toISOString()
            });
        });

        return stats;
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        this.cache.forEach((cached, key) => {
            if (now > cached.expiresAt) {
                this.cache.delete(key);
                this.cacheMetadata.delete(key);
                cleaned++;
            }
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
        }

        return cleaned;
    }
}

// Export singleton instance
module.exports = new CacheSimulator();