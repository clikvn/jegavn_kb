# 🛠️ Local Development Setup

## 📋 **Quick Start**

For local development and testing, you need to provide environment variables that are normally set in Vercel Dashboard.

## 🔐 **Step 1: Create Local Environment File**

Create a `.env` file in your project root (this file is gitignored for security):

```bash
# Create the .env file
touch .env
```

## 📝 **Step 2: Add Required Environment Variables**

Open `.env` file and add:

```bash
# Google Cloud Credentials (optional - uses jega-chatbot-service-key.json if available)
# GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}

# Bubble API Key (REQUIRED for local testing)
BUBBLE_API_KEY=d239ed5060b7336da248b35f16116a2b

# Optional: Force development endpoint
NODE_ENV=development
```

## 🗂️ **File Structure**

Your local development setup should look like:

```
jega_kb/
├── .env                              # ← Your local environment variables (gitignored)
├── jega-chatbot-service-key.json     # ← Google credentials (gitignored)
├── api/
│   └── index.py                      # ← Python API (loads .env automatically)
├── src/
└── package.json
```

## 🧪 **Testing Your Setup**

### **Option 1: Test Python API Directly**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run Python API locally
python api/index.py

# Test endpoint
curl http://localhost:8000/api/health
```

### **Option 2: Test Frontend Only**
```bash
# Start Docusaurus frontend
npm start

# Frontend will use Python API at /api/vertex-ai
# (API calls will go to Vercel production or local Python if running)
```

### **Option 3: Full Local Development**
```bash
# Terminal 1: Start Python API
python api/index.py

# Terminal 2: Start Frontend
npm start

# Frontend: http://localhost:3000
# API: http://localhost:8000
```

## 🔍 **Environment Loading Logic**

The Python API automatically detects the environment:

1. **Vercel Production**: Uses Vercel environment variables
2. **Local Development**: Loads from `.env` file
3. **Google Credentials**: Uses JSON file if available, fallback to env var

```python
# In api/index.py
if not os.getenv('VERCEL_ENV'):  # Local development
    load_dotenv()  # Load .env file

BUBBLE_API_KEY = os.getenv('BUBBLE_API_KEY')  # Required
```

## ⚠️ **Important Notes**

### **Security:**
- ✅ `.env` file is **gitignored** - never committed to repository
- ✅ Contains sensitive API keys - keep it private
- ✅ Different from Vercel environment variables

### **Google Credentials:**
- 🔑 **Primary**: Uses `jega-chatbot-service-key.json` if available
- 🔑 **Fallback**: Uses `GOOGLE_CLOUD_CREDENTIALS` environment variable
- 🔑 **Vercel**: Only uses environment variable

### **Bubble API Key:**
- 🔑 **Local**: Must be in `.env` file
- 🔑 **Vercel**: Must be in Vercel Dashboard environment variables
- 🔑 **Required**: API will fail without it

## 🚨 **Troubleshooting**

### **"BUBBLE_API_KEY environment variable must be set"**
1. Check `.env` file exists in project root
2. Verify `BUBBLE_API_KEY=d239ed5060b7336da248b35f16116a2b` is in `.env`
3. Restart Python application

### **"No Google Cloud credentials found"**
1. Check `jega-chatbot-service-key.json` exists in project root
2. Or add `GOOGLE_CLOUD_CREDENTIALS` to `.env` file

### **Python API not starting**
```bash
# Install dependencies
pip install -r requirements.txt

# Check Python version (3.9+ required)
python --version

# Test file syntax
python -m py_compile api/index.py
```

## ✅ **Ready for Local Development!**

With your `.env` file configured, you can now:
- 🔧 Test Python API locally
- 🧪 Debug chatbot functionality  
- 🚀 Develop new features
- 📝 Test configuration changes

All while keeping your API keys secure and separated from your code! 🔒 