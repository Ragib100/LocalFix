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

// CORS configuration - Enhanced for image requests and multiple origins
const allowedOrigins = [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Alternative local port
    process.env.CLIENT_URL    // Production URL (Vercel)
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list or matches Vercel preview pattern
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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

// Email proxy route - Forward email requests to VM
app.post('/api/send-email', async (req, res) => {
    try {
        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:5001';
        
        console.log(`📧 Proxying email request to: ${emailServiceUrl}/send-email`);
        console.log('Request body:', req.body);
        
        const response = await fetch(`${emailServiceUrl}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        console.log('Email service response:', data);
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Error proxying email request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send email',
            error: error.message 
        });
    }
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