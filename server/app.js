const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Security middleware - Updated to allow images through API only
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// CRITICAL: Cookie parser must come before routes that use cookies
app.use(cookieParser());

// CORS configuration - Enhanced for image requests
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// REMOVED: Static file serving - All files now served through API only
// This ensures proper authentication, logging, and security controls

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'LocalFix API Server Running!',
        version: '1.0.0',
        status: 'OK'
    });
});

// API Routes - Upload routes first for file operations
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/worker', require('./routes/workerRoutes'));
app.use('/api/proofs', require('./routes/jobProofRoutes'));
app.use('/api/payments', require('./routes/paymentsRoutes'));
app.use('/api/config', require('./routes/configRoutes'));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

module.exports = app;