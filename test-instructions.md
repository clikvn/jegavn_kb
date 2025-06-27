# Test Instructions for Bubble Config

## Method 1: Browser Test (Easiest)

1. **Open your browser** and go to: `http://localhost:3001/api/config`
2. **You should see JSON response** like:
   ```json
   {
     "config": {
       "systemPrompt": "...",
       "modelParameters": {
         "temperature": 0.7,
         "topP": 0.8,
         "maxOutputTokens": 2048
       }
     },
     "source": "bubble-database",
     "timestamp": "..."
   }
   ```

## Method 2: PowerShell Test

1. **Open PowerShell** in your project folder
2. **Run this command:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/api/config" -Method GET
   ```

## Method 3: Chat Test

1. **Open your chatbot** in the browser
2. **Send any message** (like "Hello")
3. **Check the terminal** where you started the API server
4. **Look for logs** like:
   ```
   🔄 [CHAT] Fetching Bubble config for this chat request...
   🔧 [BUBBLE] Starting configuration fetch from Bubble database...
   📦 [BUBBLE] Raw API Response: { ... }
   ✅ [CHAT] Successfully using configuration from Bubble database
   ```

## What to Look For:

✅ **Success indicators:**
- JSON response with config data
- `"source": "bubble-database"`
- Server logs showing `[BUBBLE]` tags
- Config values (temperature, topP, etc.)

❌ **Failure indicators:**
- Connection refused errors
- No `[BUBBLE]` logs in terminal
- `"source": "static"` or missing source
- Error messages about Bubble API

## If Test Fails:

1. **Check if API server is running** on port 3001
2. **Check Bubble API credentials** in `api/vertex-ai.js`
3. **Check network connectivity** to Bubble
4. **Look at server logs** for detailed error messages 