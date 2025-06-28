# Environment-Based Bubble API Configuration

This project now supports automatic switching between development and production Bubble API endpoints based on the environment.

## How It Works

The system automatically detects whether you're running locally or in production:

- **Local Development**: Uses `https://sondn-31149.bubbleapps.io/version-test/api/1.1/obj/SystemPrompt`
- **Production (Vercel)**: Uses `https://sondn-31149.bubbleapps.io/api/1.1/obj/SystemPrompt`

## Environment Detection

The system detects the environment using:
1. `NODE_ENV` environment variable
2. Vercel-specific environment variables (`VERCEL`, `VERCEL_ENV`)
3. Manual override via `BUBBLE_ENDPOINT` environment variable

## Usage

### Local Development (Automatic)
When you run the project locally, it will automatically use the development endpoint:

```bash
# Start local API server (uses dev endpoint automatically)
node src/dev-api-server.js

# Start local frontend (uses dev endpoint automatically)
npm start
```

### Manual Override
You can manually specify which endpoint to use:

```bash
# Force production endpoint locally
BUBBLE_ENDPOINT=https://sondn-31149.bubbleapps.io/api/1.1/obj/SystemPrompt node src/dev-api-server.js

# Force development endpoint
BUBBLE_ENDPOINT=https://sondn-31149.bubbleapps.io/version-test/api/1.1/obj/SystemPrompt node src/dev-api-server.js
```

### Windows PowerShell
```powershell
# Set environment variable in PowerShell
$env:BUBBLE_ENDPOINT="https://sondn-31149.bubbleapps.io/version-test/api/1.1/obj/SystemPrompt"
node src/dev-api-server.js
```

## Verification

When the server starts, you'll see logs like:
```
🔧 Bubble API Configuration:
📍 Environment: DEVELOPMENT
📍 Endpoint: https://sondn-31149.bubbleapps.io/version-test/api/1.1/obj/SystemPrompt
📍 Local detection: true
```

## Testing Your Setup

1. **Test locally**: Your changes will affect the `/version-test/` database
2. **Deploy to Vercel**: Your changes will affect the production database
3. **No more accidental production updates** when testing locally!

## Files Updated

The following files now use the environment-based configuration:
- `api/config.js` - Main configuration API
- `api/vertex-ai.js` - AI chat API  
- `api/bubble-config.js` - Shared configuration module (new)

## Benefits

✅ **Separate dev/prod data** - No more accidentally updating production when testing locally
✅ **Automatic detection** - No manual configuration needed
✅ **Easy override** - Can manually specify endpoint when needed
✅ **Consistent across all APIs** - All endpoints use the same environment detection 