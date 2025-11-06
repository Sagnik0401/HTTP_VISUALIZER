const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');  // Changed from '../config/config'

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client/public
app.use(express.static(path.join(__dirname, 'client/public')));  // Removed '../'
app.use('/js', express.static(path.join(__dirname, 'client/js')));  // Removed '../'

// Routes
const simulatorRoutes = require('./server/routes/simulator');  // Changed from './routes/simulator'
app.use('/api', simulatorRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // Changed to root index.html
});

// Start server
app.listen(config.PORT, () => {
    console.log(`🚀 HTTP Simulator Server running on http://localhost:${config.PORT}`);
    console.log(`📊 Access the simulator at http://localhost:${config.PORT}`);
});

module.exports = app;