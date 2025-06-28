/**
 * Bubble API Configuration
 * Automatically switches between development and production endpoints
 */

// Detect if we're running locally
const isLocal = process.env.NODE_ENV !== 'production' && 
                (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV);

// Environment-based endpoint configuration
const BUBBLE_ENDPOINTS = {
  production: 'https://sondn-31149.bubbleapps.io/api/1.1/obj/SystemPrompt',
  development: 'https://sondn-31149.bubbleapps.io/version-test/api/1.1/obj/SystemPrompt'
};

// Select endpoint based on environment
// Priority: ENV variable > automatic detection > fallback to production
const BUBBLE_API_URL = process.env.BUBBLE_ENDPOINT || 
                       (isLocal ? BUBBLE_ENDPOINTS.development : BUBBLE_ENDPOINTS.production);

const BUBBLE_API_KEY = 'd239ed5060b7336da248b35f16116a2b';

// Log which endpoint is being used
const environment = isLocal ? 'DEVELOPMENT' : 'PRODUCTION';
console.log(`🔧 Bubble API Configuration:`);
console.log(`📍 Environment: ${environment}`);
console.log(`📍 Endpoint: ${BUBBLE_API_URL}`);
console.log(`📍 Local detection: ${isLocal}`);
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`📍 VERCEL: ${process.env.VERCEL}`);
console.log(`📍 VERCEL_ENV: ${process.env.VERCEL_ENV}`);

module.exports = {
  BUBBLE_API_URL,
  BUBBLE_API_KEY,
  isLocal,
  environment,
  endpoints: BUBBLE_ENDPOINTS
}; 