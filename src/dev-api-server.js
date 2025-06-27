const express = require('express');
const cors = require('cors');
const path = require('path');

// Import the Vertex AI function
const vertexAIHandler = require('../api/vertex-ai.js');
// Import the Config handler
const configHandler = require('../api/config.js');

/**
 * Development API Server for JEGA Knowledge Base
 * 
 * This server provides a local development environment for testing the Vertex AI
 * integration without deploying to production. It mimics the Vercel serverless
 * function behavior for consistent development experience.
 */

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Enhanced JSON parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Development API server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version
  });
});

// Vertex AI API endpoint
app.post('/api/vertex-ai', async (req, res) => {
  try {
    console.log('🤖 Processing Vertex AI request...');
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request body',
        message: 'Request body must be a valid JSON object'
      });
    }

    // Create a mock Vercel request/response object
    const mockReq = {
      method: 'POST',
      body: req.body,
      headers: req.headers
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`✅ Vertex AI response: ${code}`);
          res.status(code).json(data);
        },
        end: () => {
          console.log(`✅ Vertex AI response: ${code}`);
          res.status(code).end();
        }
      }),
      setHeader: (name, value) => {
        console.log(`📋 Setting header: ${name} = ${value}`);
        res.setHeader(name, value);
      },
      json: (data) => {
        console.log('✅ Vertex AI response: 200');
        res.json(data);
      }
    };

    // Call the Vertex AI handler
    await vertexAIHandler(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Dev API Server Error:', error);
    
    // Determine appropriate error response
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('credentials')) {
      statusCode = 503;
      errorMessage = 'Vertex AI service unavailable - credentials not configured';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      statusCode = 503;
      errorMessage = 'Vertex AI service temporarily unavailable';
    } else if (error.message.includes('validation')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Config API endpoint
app.use('/api/config', async (req, res) => {
  try {
    console.log('🔧 Processing Config request...');
    
    // Create a mock Vercel request/response object
    const mockReq = {
      method: req.method,
      body: req.body,
      headers: req.headers
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`✅ Config response: ${code}`);
          res.status(code).json(data);
        },
        end: () => {
          console.log(`✅ Config response: ${code}`);
          res.status(code).end();
        }
      }),
      setHeader: (name, value) => {
        console.log(`📋 Setting header: ${name} = ${value}`);
        res.setHeader(name, value);
      },
      json: (data) => {
        console.log('✅ Config response: 200');
        res.json(data);
      }
    };

    // Call the Config handler
    await configHandler(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Config API Error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler for undefined routes
app.use('/api/*', (req, res) => {
  console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/vertex-ai',
      'GET /api/config',
      'POST /api/config'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Server configuration
const PORT = process.env.API_PORT || 3001;
const HOST = process.env.API_HOST || 'localhost';

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 Development API server started');
  console.log(`📍 Server running at: http://${HOST}:${PORT}`);
  console.log(`📡 Vertex AI endpoint: http://${HOST}:${PORT}/api/vertex-ai`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('─'.repeat(50));
});

// Server error handling
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port or stop the existing process.`);
    console.log(`💡 You can set a different port using: API_PORT=3002 npm run start:api`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

module.exports = app; 