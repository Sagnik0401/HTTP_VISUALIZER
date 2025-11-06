// Handle API communication with backend

class RequestHandler {
    constructor() {
        this.apiBaseUrl = 'https://http-visualizer.vercel.app/api';
    }

    // Send simulation request to backend
    async simulateRequest(requestData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/simulate-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            // Handle packet loss (status 0)
            if (response.status === 0) {
                throw new Error('Packet Lost');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }

    // Simulate HTTP/2 concurrent requests
    async simulateHTTP2(requests, delay) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/simulate-http2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requests, delay })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'HTTP/2 simulation failed');
            }

            return data;
        } catch (error) {
            console.error('HTTP/2 simulation error:', error);
            throw error;
        }
    }

    // Test API connection
    async testConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/test`);
            const data = await response.json();
            console.log('API Test:', data);
            return data;
        } catch (error) {
            console.error('API connection test failed:', error);
            return null;
        }
    }
}

// Export instance
const requestHandler = new RequestHandler();