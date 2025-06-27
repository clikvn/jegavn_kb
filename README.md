# JEGA Knowledge Base

A comprehensive documentation site for JEGA/AiHouse interior design software, featuring an AI-powered chatbot assistant built with Docusaurus and Google Vertex AI.

## 🚀 Features

- **📚 Complete Documentation**: Comprehensive guides for JEGA/AiHouse software
- **🤖 AI Assistant**: Powered by Google Gemini 2.5 Pro with Vertex AI Search
- **🌐 Vietnamese Support**: Full Vietnamese language support
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🎨 Modern UI**: Clean, professional interface inspired by Mintlify
- **🔍 Smart Search**: Contextual responses based on JEGA knowledge base
- **📖 Source Attribution**: Automatic linking to relevant documentation

## 🛠️ Tech Stack

- **Frontend**: React 18, Docusaurus 3.8.0
- **Backend**: Express.js API server
- **AI**: Google Vertex AI (Gemini 2.5 Pro)
- **Styling**: CSS Modules with OKLCH color system
- **Deployment**: Vercel-ready configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **Google Cloud Platform** account with Vertex AI enabled
- **JEGA service account key** for API access

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jega/knowledge-base.git
cd knowledge-base
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Google Cloud Credentials

You have two options for authentication:

#### Option A: Service Account Key File (Recommended for Development)

1. Download your Google Cloud service account key JSON file
2. Rename it to `jega-chatbot-service-key.json`
3. Place it in the project root directory
4. Add it to `.gitignore` (already included)

#### Option B: Environment Variables (Recommended for Production)

Set the `GOOGLE_CLOUD_CREDENTIALS` environment variable:

```bash
export GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account",...}'
```

### 4. Start Development Servers

#### Option A: Start Both Frontend and API (Recommended)

   ```bash
npm run dev
   ```

This will start:
- Frontend: http://localhost:3000
- API Server: http://localhost:3001

#### Option B: Start Servers Separately

   ```bash
# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start frontend
npm run dev:frontend
```

### 5. Verify Installation

1. **Frontend**: Visit http://localhost:3000
2. **API Health Check**: Visit http://localhost:3001/api/health
3. **ChatBot**: Click the chat icon in the bottom-right corner

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and API servers |
| `npm run dev:api` | Start API server only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build for production |
| `npm run serve` | Serve production build locally |
| `npm run clean` | Clear build cache |
| `npm run health` | Check API server health |
| `npm run typecheck` | Run TypeScript type checking |

## 🔍 Testing the ChatBot

1. **Open the application**: Navigate to http://localhost:3000
2. **Access the chatbot**: Click the chat icon in the bottom-right corner
3. **Test with sample questions**:
   - "Làm sao để tạo thiết kế mới?"
   - "Cách xuất file render?"
   - "Khắc phục lỗi khi import file?"
   - "Hướng dẫn sử dụng AI Lighting?"

## 🏗️ Project Structure

```
jega-kb/
├── api/                          # API endpoints
│   └── vertex-ai.js             # Vertex AI integration
├── src/
│   ├── components/              # React components
│   │   └── ChatBotPanel/        # Chat panel component
│   ├── theme/                   # Docusaurus theme
│   │   ├── ChatBot/            # Main chatbot component
│   │   └── Root.js             # Root layout component
│   ├── css/                     # Global styles
│   ├── pages/                   # Custom pages
│   └── dev-api-server.js        # Development API server
├── docs/                        # Documentation content
├── static/                      # Static assets
├── docusaurus.config.js         # Docusaurus configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLOUD_CREDENTIALS` | Google Cloud service account JSON | None |
| `API_PORT` | API server port | 3001 |
| `API_HOST` | API server host | localhost |
| `NODE_ENV` | Environment mode | development |

### Google Cloud Setup

1. **Enable APIs**:
   - Vertex AI API
   - Vertex AI Search API

2. **Create Service Account**:
   - Go to Google Cloud Console
   - Create a new service account
   - Grant "Vertex AI User" role
   - Download JSON key file

3. **Configure Vertex AI Search**:
   - Create a data store
   - Upload JEGA documentation
   - Update datastore ID in `api/vertex-ai.js`

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Set Environment Variables**:
   - `GOOGLE_CLOUD_CREDENTIALS`: Your service account JSON
3. **Deploy**: Vercel will automatically build and deploy

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to your hosting platform
# The build output is in the `build/` directory
```

## 🐛 Troubleshooting

### Common Issues

#### API Server Won't Start
```bash
# Check if port is in use
lsof -i :3001

# Use different port
API_PORT=3002 npm run dev:api
```

#### ChatBot Not Responding
1. Check API server health: http://localhost:3001/api/health
2. Verify Google Cloud credentials
3. Check browser console for errors
4. Ensure Vertex AI APIs are enabled

#### Build Errors
```bash
# Clear cache and reinstall
npm run clean:all
npm install
```

### Debug Mode

Enable debug logging:

```bash
# API server debug
DEBUG=* npm run dev:api

# Frontend debug
NODE_ENV=development npm run dev:frontend
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: [https://jegavn-kb.vercel.app](https://jegavn-kb.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/jega/knowledge-base/issues)
- **Discord**: [JEGA Community](https://discord.gg/jega)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes and updates.

---

**Built with ❤️ by the JEGA Team**
