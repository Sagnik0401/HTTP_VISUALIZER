// Handle timeline visualization
class HTTPVisualizer {
    constructor() {
        this.timelineContainer = document.getElementById('timeline');
        this.totalTimeElement = document.getElementById('totalTime');
        this.colors = [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#43e97b',
            '#fa709a'
        ];
    }

    // Display request timeline
    displayTimeline(timeline, totalTime) {
        // Clear existing timeline
        this.timelineContainer.innerHTML = '';

        // Calculate max duration for scaling
        const maxDuration = Math.max(...timeline.map(stage => stage.duration));

        // Create timeline stages
        timeline.forEach((stage, index) => {
            const stageElement = this.createStageElement(stage, maxDuration, index);
            this.timelineContainer.appendChild(stageElement);
        });

        // Display total time
        this.totalTimeElement.textContent = `Total Time: ${totalTime} ms`;

        // Show timeline card
        document.getElementById('timelineCard').style.display = 'block';

        // Animate bars
        setTimeout(() => this.animateBars(), 100);
    }

    // Create individual stage element
    createStageElement(stage, maxDuration, index) {
        const stageDiv = document.createElement('div');
        stageDiv.className = 'timeline-stage';

        // Stage label
        const label = document.createElement('div');
        label.className = 'stage-label';
        label.textContent = stage.stage;

        // Bar container
        const barContainer = document.createElement('div');
        barContainer.className = 'stage-bar-container';

        // Bar
        const bar = document.createElement('div');
        bar.className = 'stage-bar';
        bar.style.width = '0%'; // Start at 0 for animation
        bar.style.backgroundColor = this.colors[index % this.colors.length];
        bar.dataset.width = `${(stage.duration / maxDuration) * 100}%`;
        bar.textContent = `${stage.duration} ms`;

        barContainer.appendChild(bar);
        stageDiv.appendChild(label);
        stageDiv.appendChild(barContainer);

        return stageDiv;
    }

    // Animate timeline bars
    animateBars() {
        const bars = document.querySelectorAll('.stage-bar');
        bars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.width = bar.dataset.width;
            }, index * 100);
        });
    }

    // Display response details - FIXED: Now accepts isReal parameter
    displayResponse(response, connectionType, isReal = false) {
        const { statusCode, statusText, headers, body, cached } = response;

        // Status badge
        const statusBadge = document.getElementById('statusBadge');
        const statusCodeElement = document.getElementById('statusCode');
        const statusTextElement = document.getElementById('statusText');

        statusCodeElement.textContent = statusCode;
        statusTextElement.textContent = ` ${statusText}`;

        // Color based on status
        statusBadge.className = 'status-badge';
        if (cached || statusCode === 304) {
            statusBadge.classList.add('cached');
        } else if (statusCode >= 200 && statusCode < 300) {
            statusBadge.classList.add('success');
        } else {
            statusBadge.classList.add('error');
        }

        // Display cache status
        this.displayCacheStatus(cached, headers);

        // Display connection type
        this.displayConnectionType(connectionType);
        
        // Display real vs mock indicator - FIXED: Pass the isReal parameter
        this.displayRequestType(isReal);

        // Headers
        const headersElement = document.getElementById('headers');
        const headersCopy = { ...headers, 'Connection': connectionType };
        headersElement.textContent = JSON.stringify(headersCopy, null, 2);

        // Display cookies if present
        if (response.cookies && response.cookies.length > 0) {
            // Check if cookies section exists
            let cookiesSection = document.querySelector('.response-cookies');
            if (!cookiesSection) {
                cookiesSection = document.createElement('div');
                cookiesSection.className = 'response-cookies';
                cookiesSection.innerHTML = '<h3>🍪 Cookies Set</h3><pre id="cookies"></pre>';
                document.querySelector('.response-headers').after(cookiesSection);
            }
            
            const cookiesElement = document.getElementById('cookies');
            cookiesElement.textContent = response.cookies.map((cookie, index) => 
                `Cookie ${index + 1}: ${cookie}`
            ).join('\n\n');
            cookiesSection.style.display = 'block';
        } else {
            const cookiesSection = document.querySelector('.response-cookies');
            if (cookiesSection) {
                cookiesSection.style.display = 'none';
            }
        }

        // Body
        const bodyElement = document.getElementById('responseBody');
        if (body) {
            bodyElement.textContent = JSON.stringify(body, null, 2);
        } else {
            bodyElement.textContent = '(No body - Cached response)';
        }

        // Show response card
        document.getElementById('responseCard').style.display = 'block';
    }

    // Display cache status with expiry information
    displayCacheStatus(cached, headers) {
        // Check if cache status section exists, if not create it
        let cacheStatusSection = document.querySelector('.cache-status-container');
        if (!cacheStatusSection) {
            cacheStatusSection = document.createElement('div');
            cacheStatusSection.className = 'cache-status-container';
            // Insert after status badge
            document.querySelector('.response-status').appendChild(cacheStatusSection);
        }

        if (cached) {
            const maxAge = this.extractMaxAge(headers['Cache-Control']);
            const lastModified = headers['Last-Modified'];
            
            cacheStatusSection.innerHTML = `
                <div class="cache-status cached">
                    <div class="cache-icon">✅</div>
                    <div class="cache-details">
                        <strong>Resource Cached</strong>
                        <small>Content served from cache (304 Not Modified)</small>
                        ${maxAge ? `
                            <div class="cache-expiry">
                                <div>Cache expires in: <strong>${maxAge} seconds</strong></div>
                                <div>Last Modified: <strong>${lastModified || 'Unknown'}</strong></div>
                                <div class="cache-expiry-bar">
                                    <div class="cache-expiry-fill" style="width: 75%"></div>
                                </div>
                                <small style="display: block; margin-top: 5px;">Cache is fresh (75% remaining)</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            const cacheControl = headers['Cache-Control'];
            const hasCache = cacheControl && !cacheControl.includes('no-cache');
            
            cacheStatusSection.innerHTML = `
                <div class="cache-status not-cached">
                    <div class="cache-icon">📥</div>
                    <div class="cache-details">
                        <strong>Fresh Content Downloaded</strong>
                        <small>${hasCache ? 'Content can be cached for future requests' : 'Caching disabled (no-cache)'}</small>
                        ${hasCache ? `
                            <div class="cache-expiry">
                                <div>Cache-Control: <strong>${cacheControl}</strong></div>
                                <div>ETag: <strong>${headers['ETag'] || 'None'}</strong></div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }

    // Display connection type indicator
    displayConnectionType(connectionType) {
        // Check if connection indicator exists
        let connectionIndicator = document.querySelector('.connection-indicator');
        if (!connectionIndicator) {
            connectionIndicator = document.createElement('div');
            connectionIndicator.className = 'connection-indicator';
            document.querySelector('.response-status').appendChild(connectionIndicator);
        }

        const isKeepAlive = connectionType === 'keep-alive';
        
        connectionIndicator.innerHTML = `
            <div class="cache-status ${isKeepAlive ? 'cached' : 'not-cached'}">
                <div class="cache-icon">${isKeepAlive ? '🔗' : '⚡'}</div>
                <div class="cache-details">
                    <strong>Connection: ${connectionType.toUpperCase()}</strong>
                    <small>${isKeepAlive ? 
                        'Connection remains open for subsequent requests (persistent connection)' : 
                        'Connection closes after this request (non-persistent connection)'
                    }</small>
                </div>
            </div>
        `;
    }

    // Extract max-age from Cache-Control header
    extractMaxAge(cacheControl) {
        if (!cacheControl) return null;
        const match = cacheControl.match(/max-age=(\d+)/);
        return match ? match[1] : null;
    }

    // Display error
    displayError(errorMessage) {
        const errorCard = document.getElementById('errorCard');
        const errorMessageElement = document.getElementById('errorMessage');

        errorMessageElement.textContent = errorMessage;
        errorCard.style.display = 'block';

        // Hide other cards
        document.getElementById('timelineCard').style.display = 'none';
        document.getElementById('responseCard').style.display = 'none';
    }

    // Clear all displays
    clearDisplay() {
        document.getElementById('timelineCard').style.display = 'none';
        document.getElementById('responseCard').style.display = 'none';
        document.getElementById('errorCard').style.display = 'none';
    }

    // Display HTTP/2 comparison
    displayHTTP2Comparison(http1Results, http2Results) {
        // Create comparison card if it doesn't exist
        let comparisonCard = document.getElementById('http2ComparisonCard');
        if (!comparisonCard) {
            comparisonCard = document.createElement('div');
            comparisonCard.id = 'http2ComparisonCard';
            comparisonCard.className = 'card';
            comparisonCard.innerHTML = '<h2>⚡ HTTP/1.1 vs HTTP/2 Comparison</h2><div id="comparisonContent"></div>';
            document.querySelector('.results-section').appendChild(comparisonCard);
        }

        const comparisonContent = document.getElementById('comparisonContent');
        
        // Create comparison containers
        comparisonContent.innerHTML = `
            <div class="comparison-container">
                <div class="protocol-section http1">
                    <h3>🐢 HTTP/1.1 (Sequential)</h3>
                    <div id="http1Requests"></div>
                    <div class="total-time">Total: ${http1Results.totalTime}ms</div>
                </div>
                <div class="protocol-section http2">
                    <h3>🚀 HTTP/2 (Parallel)</h3>
                    <div id="http2Requests"></div>
                    <div class="total-time">Total: ${http2Results.totalTime}ms</div>
                </div>
            </div>
            <div class="comparison-summary">
                <h4>📊 Performance Summary</h4>
                <p>HTTP/1.1 Total Time: <strong>${http1Results.totalTime}ms</strong></p>
                <p>HTTP/2 Total Time: <strong>${http2Results.totalTime}ms</strong></p>
                <p>Speed Improvement: <strong>${Math.round(((http1Results.totalTime - http2Results.totalTime) / http1Results.totalTime) * 100)}%</strong>
                    <span class="winner-badge">HTTP/2 Wins! 🏆</span>
                </p>
            </div>
        `;

        // Animate HTTP/1.1 requests (sequential)
        this.animateHTTP1Requests(http1Results.requests);

        // Animate HTTP/2 requests (parallel)
        this.animateHTTP2Requests(http2Results.requests);

        comparisonCard.style.display = 'block';
    }

    // Animate HTTP/1.1 sequential requests
    animateHTTP1Requests(requests) {
        const container = document.getElementById('http1Requests');
        let delay = 0;

        requests.forEach((request, index) => {
            setTimeout(() => {
                const requestBar = this.createRequestBar(request, index + 1);
                container.appendChild(requestBar);

                // Animate progress bar
                setTimeout(() => {
                    const progressBar = requestBar.querySelector('.request-progress-bar');
                    progressBar.style.width = '100%';
                }, 100);
            }, delay);
            delay += request.time;
        });
    }

    // Animate HTTP/2 parallel requests
    animateHTTP2Requests(requests) {
        const container = document.getElementById('http2Requests');

        requests.forEach((request, index) => {
            setTimeout(() => {
                const requestBar = this.createRequestBar(request, index + 1);
                container.appendChild(requestBar);

                // Animate progress bar
                setTimeout(() => {
                    const progressBar = requestBar.querySelector('.request-progress-bar');
                    progressBar.style.width = '100%';
                }, 100);
            }, index * 50); // Small stagger for visual effect
        });
    }

    // Create request bar element
    createRequestBar(request, number) {
        const div = document.createElement('div');
        div.className = 'request-bar';
        div.innerHTML = `
            <div class="request-number">${number}</div>
            <div class="request-progress">
                <div class="request-progress-bar"></div>
            </div>
            <div class="request-time">${Math.round(request.time)}ms</div>
        `;
        return div;
    }

    // Display request type indicator (Real vs Mock) - FIXED
    displayRequestType(isReal) {
        let requestTypeIndicator = document.querySelector('.request-type-indicator');
        if (!requestTypeIndicator) {
            requestTypeIndicator = document.createElement('div');
            requestTypeIndicator.className = 'request-type-indicator';
            document.querySelector('.response-status').appendChild(requestTypeIndicator);
        }

        requestTypeIndicator.innerHTML = `
            <div class="cache-status ${isReal ? 'cached' : 'not-cached'}">
                <div class="cache-icon">${isReal ? '🌐' : '🎭'}</div>
                <div class="cache-details">
                    <strong>Request Type: ${isReal ? 'REAL' : 'MOCK'}</strong>
                    <small>${isReal ? 
                        'Actual HTTP request made to external server' : 
                        'Simulated response generated locally for demonstration'
                    }</small>
                </div>
            </div>
        `;
    }
}

// Export instance
const httpVisualizer = new HTTPVisualizer();