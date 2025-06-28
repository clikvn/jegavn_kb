# 🚀 JEGA Chatbot Deployment Guide

## 📋 Overview

This guide explains how to deploy your JEGA Knowledge Base with the integrated chatbot using **only one port** for both development and production.

## 🏗️ Architecture

### **Development (localhost)**
- **Port 3000**: Docusaurus + Chatbot UI
- **Port 3002**: Local Vertex AI Proxy (optional for testing)

### **Production (Vercel)**
- **Single Domain**: Everything runs on your main domain
- **Serverless Function**: `/api/vertex-ai` handles Vertex AI requests
- **No separate ports needed!**

## 🔧 Development Setup

### 1. **Local Development**
```bash
# Start Docusaurus (includes chatbot)
npm start
# Runs on http://localhost:3000

# Optional: Start Vertex AI proxy for testing
node vertex-ai-proxy-fixed.js
# Runs on http://localhost:3002
```

### 2. **Environment Detection**
The chatbot automatically detects the environment:
- **Development**: Uses `localhost:3002` if available, falls back to Gemini API
- **Production**: Uses `/api/vertex-ai` serverless function

## 🌐 Production Deployment on Vercel

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Add chatbot with single-port architecture"
git push origin main
```

### 2. **Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will automatically detect it's a Docusaurus project

### 3. **Configure Environment Variables**
In Vercel dashboard, add these environment variables:

```bash
# Google Cloud Credentials (required for Vertex AI)
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"gen-lang-client-0221178501",...}
```

**To get the credentials:**
1. Copy the content of `jega-chatbot-service-key.json`
2. Minify it (remove all spaces and newlines)
3. Paste as environment variable value

### 4. **Vercel Configuration**
Create `vercel.json` in your project root:

```json
{
  "functions": {
    "api/index.py": {
      "runtime": "python3.9",
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/vertex-ai",
      "destination": "/api/index.py"
    }
  ],
  "env": {
    "PYTHONPATH": "/var/task"
  }
}
```

## 📁 File Structure

```
jega_kb/
├── api/
│   ├── __init__.py               # Python package
│   └── index.py                  # Python Vercel serverless function
├── src/
│   └── theme/
│       └── ChatBot/
│           ├── index.js          # Chatbot component
│           └── styles.module.css # Chatbot styles
├── requirements.txt              # Python dependencies
├── vercel.json                   # Vercel configuration (Python)
└── package.json                  # Frontend dependencies only
```

## 🔄 How It Works

### **Environment Detection Logic**
```javascript
const getApiEndpoints = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost';
  
  if (isDevelopment) {
    return {
      vertexAI: 'http://localhost:3002/api/chat',  // Local proxy
      fallback: 'https://generativelanguage.googleapis.com/...' // Direct API
    };
  } else {
    return {
      vertexAI: '/api/vertex-ai',  // Vercel serverless function
      fallback: 'https://generativelanguage.googleapis.com/...' // Direct API
    };
  }
};
```

### **Request Flow**
1. **User sends message** → Chatbot UI
2. **Environment check** → Development or Production?
3. **Try Vertex AI endpoint** → Local proxy OR Vercel function
4. **Fallback if needed** → Direct Gemini API
5. **Return response** → With or without sources

## ✅ Benefits of Single-Port Architecture

### **Development**
- ✅ **Simple setup**: Just run `npm start`
- ✅ **Optional proxy**: Vertex AI proxy only needed for testing grounding
- ✅ **Fast iteration**: No need to manage multiple servers

### **Production**
- ✅ **Single domain**: Everything on one URL
- ✅ **No CORS issues**: Same-origin requests
- ✅ **Serverless scaling**: Automatic scaling with Vercel
- ✅ **Easy deployment**: Just push to Git

### **Maintenance**
- ✅ **Simpler architecture**: One deployment, one domain
- ✅ **Environment parity**: Same code works in dev and prod
- ✅ **Graceful fallback**: Always works even if Vertex AI is down

## 🔐 Security Considerations

### **Environment Variables**
- ✅ **Never commit credentials** to Git
- ✅ **Use Vercel environment variables** for production
- ✅ **Local `.env` files** for development (add to `.gitignore`)

### **API Keys**
- ⚠️ **Gemini API key**: Currently hardcoded (consider moving to env vars)
- ✅ **Google Cloud credentials**: Properly handled via environment variables

## 🧪 Testing

### **Development Testing**
```bash
# Test with Vertex AI proxy
node vertex-ai-proxy-fixed.js &
npm start
# Ask: "Sử Dụng Bộ Lọc Cảnh"

# Test without proxy (fallback only)
npm start
# Ask any question
```

### **Production Testing**
1. Deploy to Vercel
2. Test both scenarios:
   - With Google Cloud credentials → Should use Vertex AI
   - Without credentials → Should fall back to Gemini API

## 🚨 Troubleshooting

### **Common Issues**

1. **"Vertex AI service unavailable"**
   - Check Google Cloud credentials in Vercel environment variables
   - Verify service account permissions

2. **CORS errors in production**
   - Should not happen with this architecture (same-origin)
   - If it does, check Vercel function configuration

3. **Slow responses**
   - Vertex AI can be slower than direct API
   - Consider increasing timeout in `vercel.json`

## 📈 Monitoring

### **Logs**
- **Development**: Check browser console and terminal
- **Production**: Check Vercel function logs in dashboard

### **Performance**
- **Fallback success rate**: Monitor how often Vertex AI vs Gemini API is used
- **Response times**: Track both endpoints
- **Error rates**: Monitor for API failures

## 🎯 Next Steps

1. **Deploy to Vercel** using this guide
2. **Test both environments** (dev and prod)
3. **Monitor performance** and adjust as needed
4. **Consider moving Gemini API key** to environment variables
5. **Add analytics** to track chatbot usage

---

**Result**: Single port deployment with automatic environment detection and graceful fallback! 🎉 