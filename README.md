# HTTP Request-Response Simulator

A comprehensive web-based educational tool for visualizing and understanding HTTP client-server communication patterns, built with Node.js, Express, and vanilla JavaScript.

![HTTP Simulator](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Technologies Used](#technologies-used)
- [Educational Value](#educational-value)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Simulation Capabilities
- **Multiple HTTP Methods**: Full support for GET, POST, PUT, and DELETE requests
- **Network Condition Simulation**: 
  - Adjustable network delay (0-5000ms) for latency simulation
  - Configurable packet loss percentage (0-100%)
- **Connection Management**:
  - Keep-Alive persistent connections
  - Close non-persistent connections
- **Request Modes**:
  - Real HTTP requests to actual servers
  - Mock simulation mode for offline learning

### Visualization Features
- **Detailed Request Timeline**:
  - DNS Lookup phase
  - TCP Connection establishment
  - TLS Handshake for secure connections
  - Request transmission
  - Server processing time (TTFB - Time To First Byte)
  - Content download phase
- **Comprehensive Response Display**:
  - HTTP status codes with color-coded indicators
  - Complete response headers
  - Response body with formatted JSON
  - Total request duration metrics

### Advanced Features
- **HTTP Caching Simulation**:
  - 304 Not Modified responses
  - Cache-Control header demonstration
  - ETag-based validation
  - Visual cache status indicators
- **Cookie Management**:
  - Session and persistent cookie handling
  - HttpOnly and Secure flag demonstration
  - Cookie lifecycle visualization
- **Protocol Comparison**:
  - HTTP/1.1 vs HTTP/2 performance analysis
  - Sequential vs parallel request handling
  - Real-time performance metrics
  - Visual animation of protocol differences

## Installation

### Prerequisites
- Node.js version 14.0.0 or higher
- npm (Node Package Manager)

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd http-simulator
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

4. **Access the application**
```
Navigate to: http://localhost:3000
```

## Usage

### Performing a Basic Request Simulation

1. Enter the target URL in the input field
2. Select the desired HTTP method (GET, POST, PUT, DELETE)
3. Configure network conditions using the sliders:
   - Network Delay: Simulates latency
   - Packet Loss: Simulates unreliable connections
4. Choose connection type from the dropdown (Keep-Alive or Close)
5. Enable optional features:
   - Use Cache: Demonstrates 304 Not Modified responses
   - Include Cookies: Shows cookie handling
   - Use Real Request: Toggles between real and mock modes
6. Click "Send Request" to execute

### HTTP/2 Performance Comparison

1. Navigate to the HTTP/2 Comparison section
2. Specify the number of concurrent requests (2-10)
3. Set the artificial delay for demonstration
4. Click "Compare HTTP/1.1 vs HTTP/2"
5. Observe the animated side-by-side comparison
6. Review performance metrics and speed improvements

### Understanding Results

#### Timeline Visualization
Each stage displays:
- Stage name and description
- Duration in milliseconds
- Color-coded progress bar
- Percentage of total request time

#### Response Information
- Status code with semantic color coding
- Cache status indicator
- Connection type badge
- Complete HTTP headers
- Cookie details
- Formatted response body

## Project Structure
```
CNPROJ/
├── server.js                    # Main application entry point
├── index.html                   # Root HTML file
│
├── .vscode/
│   └── settings.json           # VS Code configuration
│
├── client/
│   ├── js/
│   │   ├── about.js            # About page logic
│   │   ├── app.js              # Main application logic
│   │   ├── developers.js       # Developer page logic
│   │   ├── help.js             # Help page logic
│   │   ├── httpVisualizer.js   # Timeline visualization
│   │   └── requestHandler.js   # HTTP request handling
│   │
│   └── public/
│       ├── images/             # Application images
│       ├── styles/
│       │   ├── about.css       # About page styles
│       │   ├── developers.css  # Developer page styles
│       │   ├── help.css        # Help page styles
│       │   └── main.css        # Main application styles
│       │
│       ├── about.html          # About page
│       ├── developers.html     # Developer information page
│       └── help.html           # Help documentation page
│
├── config/
│   └── config.js               # Application configuration
│
├── server/
│   ├── controllers/
│   │   └── requestController.js    # Request handling logic
│   ├── routes/
│   │   └── simulator.js            # API route definitions
│   └── utils/
│       ├── cacheSimulator.js       # Cache simulation logic
│       ├── realRequestHandler.js   # Real HTTP request handling
│       └── responseGenerator.js    # Mock response generation
│
├── package.json                # Project dependencies
├── package-lock.json          # Dependency lock file
└── README.md                  # Project documentation
```

## API Endpoints

### POST /api/simulate-request
Simulates a single HTTP request with configurable parameters.

**Request Body:**
```json
{
  "url": "https://example.com/api/data",
  "method": "GET",
  "delay": 500,
  "packetLoss": 0,
  "connectionType": "keep-alive",
  "useCache": false,
  "useCookies": false,
  "useRealRequest": false
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "url": "https://example.com/api/data",
    "method": "GET",
    "headers": {},
    "timestamp": "2025-11-06T12:00:00.000Z"
  },
  "response": {
    "status": 200,
    "statusText": "OK",
    "headers": {},
    "body": {},
    "cached": false
  },
  "timeline": [
    { "stage": "DNS Lookup", "duration": 50 },
    { "stage": "TCP Connection", "duration": 75 }
  ],
  "totalTime": 500,
  "connectionType": "keep-alive"
}
```

### POST /api/simulate-http2
Simulates concurrent HTTP/2 requests for protocol comparison.

**Request Body:**
```json
{
  "requests": [
    { "url": "https://example.com/resource1", "method": "GET" },
    { "url": "https://example.com/resource2", "method": "GET" }
  ],
  "delay": 300,
  "protocol": "http2"
}
```

**Response:**
```json
{
  "protocol": "http2",
  "results": [],
  "totalTime": 450,
  "averageTime": 225
}
```

### GET /api/test
Health check endpoint for API connectivity verification.

**Response:**
```json
{
  "message": "API is working",
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### GET /api/resource/:id
Retrieves a mock resource by ID for testing purposes.

**Response:**
```json
{
  "id": "123",
  "data": "Mock resource data",
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

## Technologies Used

### Backend Stack
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Axios**: HTTP client for real requests
- **CORS**: Cross-Origin Resource Sharing middleware

### Frontend Stack
- **HTML5**: Semantic markup structure
- **CSS3**: Advanced styling with Grid, Flexbox, animations
- **Vanilla JavaScript**: Pure ES6+ implementation
- **Fetch API**: Modern HTTP request handling

### Development Tools
- **Nodemon**: Development server with auto-restart
- **VS Code**: Recommended IDE with configuration

## Educational Value

This simulator serves as an educational tool demonstrating:

### Networking Concepts
- HTTP protocol fundamentals and request-response cycle
- Client-server architecture patterns
- Network latency and its impact on performance
- Packet loss and connection reliability
- DNS resolution process
- TCP three-way handshake
- TLS/SSL secure connections

### Web Development Concepts
- RESTful API design principles
- HTTP methods and their semantic meanings
- Status codes and their appropriate usage
- HTTP headers and their purposes
- Caching strategies and cache validation
- Cookie management and security flags
- Connection management (persistent vs non-persistent)

### Performance Optimization
- HTTP/1.1 limitations and workarounds
- HTTP/2 multiplexing benefits
- Caching for performance improvement
- Connection reuse strategies
- Request parallelization

### Programming Skills
- Asynchronous JavaScript (Promises, async/await)
- DOM manipulation and event handling
- CSS animations and transitions
- Modular code organization
- API development and consumption

## Contributing

Contributions are welcome and appreciated. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/NewFeature`
3. Commit your changes: `git commit -m 'Add NewFeature'`
4. Push to the branch: `git push origin feature/NewFeature`
5. Open a Pull Request with a detailed description

### Contribution Guidelines
- Follow existing code style and conventions
- Write clear commit messages
- Update documentation for new features
- Test thoroughly before submitting
- Keep pull requests focused and atomic

## Future Enhancements

Planned features for future releases:

- WebSocket support for real-time communication
- GraphQL query simulation
- Request/Response header customization interface
- Export simulation results (JSON, CSV)
- Request history and replay functionality
- Compression algorithm comparison (gzip, brotli)
- Response size and bandwidth visualization
- Custom mock data configuration
- Request authentication methods (Bearer, Basic, OAuth)
- Advanced error simulation (timeouts, connection refused)

## Research and Development

This project was developed through extensive research into:

- HTTP/1.1 and HTTP/2 protocol specifications (RFC 7230-7235, RFC 7540)
- Network simulation methodologies
- Web performance optimization techniques
- Browser caching mechanisms (RFC 7234)
- Cookie specifications (RFC 6265)
- Modern web development practices

### Resources Consulted
- MDN Web Docs: HTTP protocol documentation
- W3C specifications for web standards
- IETF RFCs for protocol specifications
- Academic papers on network simulation
- Industry best practices for web performance

## Tools and Resources Used

### CSS Grid Generators
- CSS Grid Generator (cssgrid-generator.netlify.app): Interactive grid layout tool
- Grid Layoutit (grid.layoutit.com): Visual grid builder with code export
- CSS-Tricks Complete Guide: Comprehensive CSS Grid reference

### AI Assistance
- ChatGPT: Documentation generation and technical explanations
- Code review and optimization suggestions

### Development Resources
- Node.js official documentation
- Express.js framework guides
- Axios HTTP client documentation
- MDN Web Docs for web APIs

### Design Tools
- Coolors: Color palette generation
- CSS3 gradient generators
- Animation timing function visualizers

## License

MIT License

Copyright (c) 2025 Sagnik Mitra

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Authors

**Sagnik Mitra**
- Email: sagnik.mitra2024@vitstudent.ac.in
- Institution: VIT University

**Abhik Sinha**
- Email: abhik.sinha2024@vitstudent.ac.in
- Institution: VIT University

## Acknowledgments

This project was developed as an educational tool for understanding computer networking concepts. Special thanks to:

- **Professor Swaminathan A** - Computer Networks course instructor at VIT University, for guidance, mentorship, and valuable insights throughout the project development
- The open-source community for excellent tools and libraries
- Browser DevTools teams for inspiration
- All contributors and users providing feedback

---
