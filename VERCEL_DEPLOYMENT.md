# 🚀 Vercel Deployment Guide

## 📋 **Required Environment Variables**

Set these in your Vercel dashboard under **Settings → Environment Variables**:

### 🔐 **1. Google Cloud Credentials** (REQUIRED)
```bash
GOOGLE_CLOUD_CREDENTIALS
```
**Value**: Your complete service account JSON (copy entire content from `jega-chatbot-service-key.json`)

**Example**:
```json
{
  "type": "service_account",
  "project_id": "gen-lang-client-0221178501",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 🔐 **2. Bubble API Key** (REQUIRED)
```bash
BUBBLE_API_KEY
```
**Value**: `[YOUR_BUBBLE_API_KEY_HERE]` *(Contact administrator for actual value)*

**CRITICAL**: This key is **completely removed** from source code for security. You **MUST** set this in Vercel Dashboard or deployment will fail.

### 🔐 **3. Environment Detection** (OPTIONAL)
```bash
VERCEL_ENV
```
**Value**: Automatically set by Vercel (`production`, `preview`, `development`)

## 🚀 **Deployment Steps**

### **Step 1: Set Environment Variables** (REQUIRED)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. **MUST ADD both variables** (deployment will fail without them):
   - `GOOGLE_CLOUD_CREDENTIALS`: Complete JSON from service account file
   - `BUBBLE_API_KEY`: `[YOUR_BUBBLE_API_KEY_HERE]` *(Contact administrator)*

⚠️ **WARNING**: Both variables are **required**. The Bubble API key is completely removed from source code for security.

### **Step 2: Deploy**
```bash
# Commit all changes
git add .
git commit -m "Complete Python migration with security fixes"
git push origin main

# Vercel will automatically deploy
```

### **Step 3: Verify Deployment**
1. Check Vercel build logs for any errors
2. Test API endpoint: `https://your-domain.vercel.app/api/vertex-ai`
3. Test frontend chatbot functionality

## 🔧 **Build Configuration**

### **Files Required**:
- ✅ `requirements.txt` - Python dependencies
- ✅ `vercel.json` - Vercel configuration  
- ✅ `api/index.py` - Main Python API
- ✅ Environment variables set in Vercel

### **Automatic Build Process**:
1. **Vercel detects** `requirements.txt`
2. **Installs dependencies**: `pip install -r requirements.txt`
3. **Builds Python function**: `api/index.py` → serverless function
4. **Deploys frontend**: Docusaurus build
5. **Routes API calls**: `/api/vertex-ai` → Python function

## 🧪 **Testing Checklist**

### **Local Testing** (Optional):
```bash
# Install dependencies
pip install -r requirements.txt

# Test Python API locally
python api/index.py

# Test frontend
npm start
```

### **Production Testing**:
- [ ] **API Health**: `GET /api/health` returns `200`
- [ ] **Chatbot Streaming**: Real-time text appears with 100 chars/sec
- [ ] **Four-Phase UX**: Processing → Thinking → Searching → Generating
- [ ] **Grounding Sources**: Links appear in responses
- [ ] **Error Handling**: Graceful error messages
- [ ] **Bubble Configuration**: Dynamic model/prompt loading

## 🔍 **Troubleshooting**

### **Build Failures**:
1. **Check Requirements**: Ensure all dependencies in `requirements.txt`
2. **Check Syntax**: Verify Python code with `python -m py_compile api/index.py`
3. **Check Environment Variables**: Ensure both required vars are set

### **Runtime Errors**:
1. **Credentials Error**: Verify `GOOGLE_CLOUD_CREDENTIALS` is valid JSON
2. **Bubble API Error**: Check `BUBBLE_API_KEY` is correct
3. **Import Errors**: Verify all packages in `requirements.txt`

### **Common Issues**:

**"GenAI client not available"**:
- → Check `GOOGLE_CLOUD_CREDENTIALS` environment variable
- → Verify service account has proper permissions

**"Config error"** or **"BUBBLE_API_KEY environment variable must be set"**:
- → Check `BUBBLE_API_KEY` environment variable is set in Vercel Dashboard
- → Verify the key value is correct (contact administrator for actual value)
- → Redeploy after setting the environment variable

**"Function timeout"**:
- → Check Vertex AI model availability
- → Verify network connectivity

## 📊 **Performance Expectations**

### **Cold Start**: ~2-3 seconds (first request)
### **Warm Requests**: ~100-500ms response time
### **Streaming**: Real-time 100 chars/sec
### **Timeout**: 30 seconds maximum

## ✅ **Success Indicators**

When deployment is successful, you should see:

1. **✅ Build Success**: No errors in Vercel build logs
2. **✅ API Health**: `GET /api/health` returns JSON response
3. **✅ Streaming Works**: Chatbot shows progressive phases
4. **✅ Sources Appear**: Grounding links in responses
5. **✅ Configuration Loads**: Dynamic model from Bubble

## 🔐 **Security Notes**

- ✅ **No hardcoded secrets** in source code
- ✅ **Environment variables** for all sensitive data
- ✅ **CORS configured** for production domains
- ✅ **HTTPS only** via Vercel
- ✅ **Service account** with minimal permissions

## 🚀 **Ready for Production!**

Your JEGA Knowledge Base is now fully configured for automatic Vercel deployment with proper security practices! 