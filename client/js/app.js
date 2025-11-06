// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('simulatorForm');
    const urlInput = document.getElementById('url');
    const methodSelect = document.getElementById('method');
    const delaySlider = document.getElementById('delay');
    const delayValue = document.getElementById('delayValue');
    const packetLossSlider = document.getElementById('packetLoss');
    const packetLossValue = document.getElementById('packetLossValue');
    const connectionTypeSelect = document.getElementById('connectionType');
    const useCacheCheckbox = document.getElementById('useCache');
    const simulateBtn = document.getElementById('simulateBtn');

    // Update slider values in real-time
    delaySlider.addEventListener('input', (e) => {
        delayValue.textContent = e.target.value;
    });

    packetLossSlider.addEventListener('input', (e) => {
        packetLossValue.textContent = e.target.value;
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable button during request
        simulateBtn.disabled = true;
        simulateBtn.textContent = '⏳ Sending...';

        // Clear previous results
        httpVisualizer.clearDisplay();

        // Collect form data
        const requestData = {
            url: urlInput.value.trim(),
            method: methodSelect.value,
            delay: parseInt(delaySlider.value),
            packetLoss: parseInt(packetLossSlider.value),
            connectionType: connectionTypeSelect.value,
            useCache: useCacheCheckbox.checked,
            useCookies: document.getElementById('useCookies').checked,
            useRealRequest: document.getElementById('useRealRequest').checked
        };

        try {
            // Send request to backend
            const result = await requestHandler.simulateRequest(requestData);
            console.log('Simulation result:', result);

            // Display timeline
            httpVisualizer.displayTimeline(result.timeline, result.totalTime);

            // Display response - FIXED: Pass the isReal flag from the result object
            httpVisualizer.displayResponse(
                result.response, 
                result.connectionType, 
                result.real || false  // Pass the real flag from result
            );

        } catch (error) {
            console.error('Simulation failed:', error);
            
            // Check if it's packet loss
            if (error.message === 'Packet Lost' || requestData.packetLoss > 0) {
                httpVisualizer.displayError(
                    `❌ Packet Lost! The request failed due to ${requestData.packetLoss}% packet loss simulation.`
                );
            } else {
                httpVisualizer.displayError(
                    `Request failed: ${error.message}`
                );
            }
        } finally {
            // Re-enable button
            simulateBtn.disabled = false;
            simulateBtn.textContent = '🚀 Send Request';
        }
    });

    // Test API connection on load
    requestHandler.testConnection().then(result => {
        if (result) {
            console.log('✅ Connected to API successfully!');
        } else {
            console.warn('⚠️ Could not connect to API');
        }
    });

    console.log('🌐 HTTP Simulator initialized!');

    // HTTP/2 Comparison functionality
    const http2DelaySlider = document.getElementById('http2Delay');
    const http2DelayValue = document.getElementById('http2DelayValue');
    const concurrentRequestsInput = document.getElementById('concurrentRequests');
    const compareBtn = document.getElementById('compareBtn');

    // Update HTTP/2 delay value
    http2DelaySlider.addEventListener('input', (e) => {
        http2DelayValue.textContent = e.target.value;
    });

    // Compare button click
    compareBtn.addEventListener('click', async () => {
        compareBtn.disabled = true;
        compareBtn.textContent = '⏳ Comparing...';

        const numRequests = parseInt(concurrentRequestsInput.value);
        const delay = parseInt(http2DelaySlider.value);

        // Create request array
        const requests = [];
        for (let i = 1; i <= numRequests; i++) {
            requests.push({
                url: `https://example.com/api/resource/${i}`,
                method: 'GET'
            });
        }

        try {
            // Simulate HTTP/1.1 (sequential)
            const http1Start = Date.now();
            const http1Requests = requests.map((req, index) => ({
                id: index + 1,
                url: req.url,
                method: req.method,
                time: delay
            }));

            const http1TotalTime = delay * numRequests;
            const http1Results = {
                requests: http1Requests,
                totalTime: http1TotalTime
            };

            // Simulate HTTP/2 (parallel) using backend
            const http2Results = await requestHandler.simulateHTTP2(requests, delay);

            // Display comparison
            httpVisualizer.displayHTTP2Comparison(http1Results, http2Results);

            console.log('HTTP/1.1:', http1Results);
            console.log('HTTP/2:', http2Results);

        } catch (error) {
            console.error('Comparison failed:', error);
            httpVisualizer.displayError(`Comparison failed: ${error.message}`);
        } finally {
            compareBtn.disabled = false;
            compareBtn.textContent = '⚡ Compare HTTP/1.1 vs HTTP/2';
        }
    });

    // Navigation button handlers - REPLACE THE EXISTING ONES
    document.getElementById('developersBtn').addEventListener('click', () => {
        window.location.href = '/developers.html';
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
        window.location.href = '/help.html';
    });

    document.getElementById('aboutBtn').addEventListener('click', () => {
        window.location.href = '/about.html';
    });
});