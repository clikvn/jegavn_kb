# Changelog

All notable changes to the JEGA Knowledge Base project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Docusaurus 3.8.0
- JEGA Assistant AI ChatBot with Vertex AI integration
- ChatBot panel component with modern UI design
- Development API server for local testing
- Vietnamese language support
- Responsive design for mobile devices
- Source attribution system for AI responses
- Theme toggle functionality
- Progress bar for page navigation
- **NEW**: Error handling and user feedback system
- **NEW**: Clear chat functionality
- **NEW**: Enhanced accessibility features (ARIA labels, keyboard navigation)
- **NEW**: Backdrop overlay for panel mode
- **NEW**: Comprehensive input validation
- **NEW**: Better error messages and status codes
- **NEW**: Request logging and monitoring
- **NEW**: Graceful shutdown handling
- **NEW**: Enhanced CORS configuration
- **NEW**: Development scripts for easier local development
- **NEW**: Comprehensive documentation and README

### Changed
- Updated to use Gemini 2.5 Pro model
- Enhanced system instructions for better Vietnamese responses
- Improved error handling in API calls
- Better UI/UX with Mintlify-inspired design system
- **IMPROVED**: ChatBot component refactored for better maintainability
- **IMPROVED**: API server with enhanced error handling and validation
- **IMPROVED**: Vertex AI integration with better source extraction
- **IMPROVED**: Message formatting with markdown support
- **IMPROVED**: Panel component with better accessibility
- **IMPROVED**: CSS styling with better responsive design
- **IMPROVED**: Package.json with better scripts and metadata
- **IMPROVED**: Removed redundant clear chat button from footer - now using functional trash icon in panel header
- **IMPROVED**: Enhanced privacy by replacing specific AI technology details with "Jega AI Companion" brand label
- **UPDATED**: User chat bubble styling with new design specifications:
  - Background color: #EEF2F1
  - Text color: #000000
  - Font family: inter-variable, sans-serif
  - Font size: 16px
  - Line height: 24px
  - Font weight: 400 (Regular)
  - Border radius: 16px
  - Padding: 14px top/left/right, 10px bottom
  - Minimum height: 40px
- **IMPROVED**: Chat interface focus - removed message time and model info from both user and bot messages for cleaner, distraction-free conversation experience
- Floating chat icon and send button in the floating ChatBot (`src/theme/ChatBot`) now use the brand green (`var(--primary)`) instead of the previous purple gradient. Hover/active/focus states are also updated for green brand consistency. No changes to the panel version. This ensures full brand color consistency for all chat entry points.

### Fixed
- CORS configuration for development environment
- Chat history management in panel mode
- Message formatting and display issues
- API endpoint routing for production vs development
- **FIXED**: Memory leaks in useEffect hooks
- **FIXED**: Input focus management in panel mode
- **FIXED**: Error state management
- **FIXED**: Source link processing and display
- **FIXED**: Panel backdrop and click-outside behavior
- **FIXED**: Keyboard navigation and accessibility issues
- **FIXED**: Trash icon in panel header now functional for clearing chat history
- **FIXED**: Delete button functionality using forwardRef and useImperativeHandle for proper component communication
- **FIXED**: Component rendering error in ChatBotPanel - resolved undefined component issue by properly handling ref forwarding between Root and ChatBotPanel components
- **FIXED**: User message text and send time overlapping issue - removed flex display from message bubble to ensure proper text and time separation

### Technical Details
- **Frontend**: React 18.3.1, Docusaurus 3.8.0
- **Backend**: Express.js API server with enhanced error handling
- **AI**: Google Vertex AI with Gemini 2.5 Pro
- **Styling**: CSS Modules with OKLCH color system
- **Deployment**: Vercel-ready configuration
- **Development**: Concurrently for running multiple servers
- **Validation**: Comprehensive input validation and error handling

## [0.0.0] - 2024-01-XX
- Initial release

---

## Development Notes

### Local Development Setup
The application now supports easy local development with:
- `npm run dev` - Start both frontend and API servers
- `npm run dev:api` - Start API server only  
- `npm run dev:frontend` - Start frontend only
- `npm run health` - Check API server health

### Key Improvements Made
1. **Code Quality**: Refactored components with proper separation of concerns
2. **Error Handling**: Comprehensive error handling throughout the application
3. **User Experience**: Better feedback, loading states, and accessibility
4. **Development Experience**: Enhanced scripts and documentation
5. **Maintainability**: Better code structure and documentation
6. **Performance**: Optimized rendering and state management
7. **Security**: Enhanced input validation and CORS configuration
8. **UI/UX**: Streamlined chat interface with functional trash icon in header 