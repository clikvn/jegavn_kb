# Changelog

All notable changes to the JEGA Knowledge Base project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025-01-15] - Complete Migration to Flowise-Only Architecture

### Major Changes
- **MIGRATED**: Completely replaced complex Bubble-dependent system with simple Flowise-only implementation
- **REMOVED**: All Bubble database dependencies and configuration management
- **REMOVED**: Google GenAI/Vertex AI integration (using Flowise exclusively)
- **SIMPLIFIED**: Backend from 1400+ lines to ~300 lines of clean, maintainable code

### Added
- **NEW**: Real-time streaming implementation for Flowise integration
- **NEW**: `/api/flowise/stream` endpoint for real-time Server-Sent Events (SSE) streaming
- **NEW**: Simplified Flowise integration without Bubble configuration dependency
- **NEW**: Chunked streaming to avoid "Chunk too big" errors
- **NEW**: Direct Flowise API communication without intermediate processing
- **NEW**: Flowise as the only AI method (removed Vertex AI completely)

### Removed
- **REMOVED**: Bubble API integration and BUBBLE_API_KEY dependency
- **REMOVED**: Complex configuration management system
- **REMOVED**: Google GenAI/Vertex AI fallback system
- **REMOVED**: Feedback and rating systems (Bubble-dependent)
- **REMOVED**: Legacy endpoints that required Bubble integration

### Fixed
- **FIXED**: "Chunk too big" error by implementing chunked streaming (1KB chunks)
- **FIXED**: Simplified Flowise payload to only send user question (no chat history or Bubble config needed)
- **FIXED**: Syntax errors and indentation issues in the main API file
- **FIXED**: Environment variable loading issues (.env file encoding problems)
- **FIXED**: Production and local deployment consistency

### Technical Details
- **Backend**: Now uses only Flowise API at `https://langchain-ui.clik.vn/api/v1/prediction/40f982a3-ad4f-4df4-9999-8033ec570672`
- **Dependencies**: Removed `google-genai`, `aiohttp` for Bubble calls, and complex configuration management
- **Deployment**: Both production (Vercel) and local development now use the same simplified `index.py`
- **File Structure**: Cleaned up by removing `index_fixed.py` and backup files

## [2025-01-15] - Flowise-Only Implementation

### Added
- **NEW**: Real-time streaming implementation for Flowise integration
- **NEW**: `/api/flowise/stream` endpoint for real-time Server-Sent Events (SSE) streaming
- **NEW**: Simplified Flowise integration without Bubble configuration dependency
- **NEW**: Chunked streaming to avoid "Chunk too big" errors
- **NEW**: Direct Flowise API communication without intermediate processing
- **NEW**: Flowise as the only AI method (removed Vertex AI completely)

### Fixed
- **FIXED**: "Chunk too big" error by implementing chunked streaming (1KB chunks)
- **FIXED**: Simplified Flowise payload to only send user question (no chat history or Bubble config needed)
- **FIXED**: Removed unnecessary Bubble API calls for Flowise integration
- **FIXED**: Real streaming implementation using fetch with ReadableStream
- **FIXED**: Proper handling of Flowise's actual streaming format
- **FIXED**: Removed "can't load bubble configuration" error by eliminating Bubble dependency
- **FIXED**: Chatbot now works immediately without waiting for configuration loading

### Improved
- **IMPROVED**: Flowise integration now works independently without Bubble configuration
- **IMPROVED**: Real-time streaming with proper token-by-token display
- **IMPROVED**: Simplified backend logic by removing complex content extraction patterns
- **IMPROVED**: Better error handling for streaming responses
- **IMPROVED**: Frontend now uses proper streaming with ReadableStream API
- **IMPROVED**: Removed all Vertex AI code and dependencies
- **IMPROVED**: Simplified component props (removed useFlowise prop)
- **IMPROVED**: Faster startup time without configuration loading

### Removed
- **REMOVED**: All Vertex AI integration code and functions
- **REMOVED**: Bubble API configuration loading and dependencies
- **REMOVED**: Complex content extraction patterns and filtering
- **REMOVED**: Chat history processing for Flowise (not needed)
- **REMOVED**: Toggle switch between AI methods (Flowise only now)
- **REMOVED**: `limitConversationMemory` function (not needed for Flowise)
- **REMOVED**: All unused code and references to old methods
- **REMOVED**: Syntax errors and leftover code from old implementation
- **REMOVED**: AI method toggle switcher from ChatBotPanel component
- **REMOVED**: All switcher-related props and state from Root.js
- **REMOVED**: Toggle UI elements and related CSS classes

### Technical Details
- **Streaming**: Real-time streaming using `response.body.getReader()` and `TextDecoder`
- **Chunking**: 1KB chunks to prevent "Chunk too big" errors
- **Format**: Direct forwarding of Flowise's SSE format to frontend
- **Flowise Endpoint**: Updated to use new chartflow ID `40f982a3-ad4f-4df4-9999-8033ec570672`
- **Independence**: Flowise integration no longer depends on Bubble API configuration
- **Performance**: Faster response times due to simplified processing
- **Simplicity**: Single AI method reduces complexity and potential errors

## [2025-01-15] - Image Upload Feature Implementation

### Added
- **Image Upload UI**: Added image upload button and preview functionality
- **Base64 Conversion**: Images automatically converted to base64 format
- **Multiple Image Support**: Users can upload up to 5 images per message
- **Image Preview**: Thumbnail preview with remove functionality
- **Backend Support**: Both API endpoints now handle image uploads

### Updated
- **Frontend**: Added image selection, preview, and management UI
- **Backend API**: Enhanced to accept `uploads` parameter with image data
- **Flowise Integration**: Images sent to Flowise in proper format
- **CSS Styles**: Added comprehensive styling for image upload components

### Technical Details
- **Image Format**: Base64 encoded with proper MIME type detection
- **Upload Structure**: Follows Flowise specification with `data`, `type`, `name`, `mime` fields
- **File Support**: PNG, JPEG, JPG, GIF, WebP formats supported
- **Size Limit**: Maximum 5 images per message
- **Auto-Clear**: Images cleared after sending message

## [2025-01-15] - Flowise Session Management Implementation

### Added
- **Session Management**: Implemented Flowise session continuity using `chatId` and `sessionId`
- **Browser Caching**: Session data stored in `localStorage` as `jega_flowise_session`
- **Session Persistence**: Chat context maintained across browser sessions
- **Session Clearing**: Clear session data when starting new conversations

### Updated
- **Backend API**: Both endpoints now accept and forward `chatId` and `sessionId` parameters
- **Frontend**: Automatically includes session data in Flowise requests
- **Metadata Handling**: Enhanced response parsing to extract and store session metadata
- **Clear Chat**: Updated to clear both message history and session data

### Technical Details
- **Session Storage**: `localStorage.getItem('jega_flowise_session')` for persistence
- **Session Data**: `{chatId, sessionId, lastUpdated}` structure
- **Auto-Include**: Session data automatically included in subsequent requests
- **Session Reset**: Cleared when user starts new conversation

## [2025-01-15] - Flowise Chartflow ID Update

### Updated
- **Flowise Endpoint**: Updated chartflow ID from `4460e8a3-ff9e-4eb2-be18-cdf1ae791201` to `40f982a3-ad4f-4df4-9999-8033ec570672`
- **Backend API**: Both `/api/flowise` and `/api/flowise/stream` endpoints now use the new Flowise chartflow
- **Testing**: Verified both regular and streaming endpoints work with the new chartflow ID

## [2025-01-15] - Flowise Integration & Configuration Message Filtering

### Added
- **NEW**: Flowise chatbot integration with dedicated API endpoint `/api/flowise`
- **NEW**: Complete Flowise integration module (`flowise_integration.py`) with comprehensive error handling
- **NEW**: Test files for Flowise connection validation (`test_flowise.py`, `simple_flowise_test.py`)
- **NEW**: Local development environment setup with `.env` file configuration
- **NEW**: Python API server running on port 3002 with environment variable support
- **NEW**: Docusaurus frontend running on port 3000 with successful build verification
- **NEW**: AI Method Toggle Switch in ChatBot panel header
- **NEW**: Seamless switching between Vertex AI and Flowise integrations
- **NEW**: Toggle switch with visual feedback showing current AI method
- **NEW**: Configuration message filtering to prevent display of Flowise internal data
- **NEW**: Content extraction logic to separate actual chat content from agent flow events
- **NEW**: Debug tools for analyzing Flowise response format (`debug_flowise.py`)

### Fixed
- **FIXED**: Configuration messages (agentFlowEvent, metadata, nodeLabel) no longer displayed in chat UI
- **FIXED**: Frontend filtering of Flowise internal events and status updates
- **FIXED**: Backend content extraction to properly separate chat content from configuration data
- **FIXED**: UTF-8 encoding issues in streaming response processing

### Known Issues
- **Streaming**: "Chunk too big" error when using Flowise streaming mode
- **Connectivity**: Occasional timeouts when connecting to Flowise API
- **Content Extraction**: Some responses may still contain configuration data that needs further filtering

### Technical Details
- **Flowise API**: Successfully tested connection to `https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201`
- **Environment Setup**: Created `.env` file with `BUBBLE_API_KEY` and `NODE_ENV` configuration
- **Dependencies**: Installed all required Python packages (`fastapi`, `uvicorn`, `google-genai`, `aiohttp`, `python-multipart`, `python-dotenv`)
- **API Integration**: Added Flowise endpoint to existing FastAPI server with proper error handling and timeout management
- **Response Processing**: Implemented metadata extraction for chat IDs, message IDs, and agent flow data
- **Chat History Support**: Added conversion between frontend chat history format and Flowise format
- **Toggle UI**: Custom CSS toggle switch with smooth animations and visual feedback
- **State Management**: React state management for AI method selection with localStorage persistence
- **API Routing**: Dynamic API endpoint selection based on `useFlowise` prop
- **Streaming Implementation**: Real-time Server-Sent Events (SSE) for both Vertex AI and Flowise
- **Flowise Streaming**: Based on [Flowise streaming documentation](https://docs.flowiseai.com/using-flowise/streaming)
- **Event Types**: Support for `start`, `token`, `error`, `end`, `metadata`, `sourceDocuments`, `usedTools` events
- **Streaming Generator**: Async generator function for processing Flowise streaming responses
- **Real-time UI Updates**: Both APIs now provide live streaming with typewriter effects
- **Flowise Format Handling**: Properly handles Flowise's actual streaming format (`message:` + content + metadata)
- **Chunked Streaming**: Content is sent in 50-character chunks for smooth typewriter effect

### Development Environment
- **Frontend**: Docusaurus 3.8.0 running on http://localhost:3000
- **Backend**: Python FastAPI server running on http://localhost:3002
- **Environment**: Windows PowerShell with proper encoding for `.env` file creation
- **Testing**: Comprehensive test suite for Flowise API connection and response validation

## [2025-08-15] - Enhanced Chat Rating System

### Added
- **NEW**: Chat rating system for AI responses with thumbs up/down buttons
- **NEW**: Backend API endpoint `/api/chat-rating` for storing chat ratings
- **NEW**: Frontend ChatRating component integrated into chatbot interface
- **NEW**: localStorage persistence for chat ratings to prevent duplicate submissions
- **NEW**: Integration with existing JEGA_Feedbacks table using chat_ prefix for doc_id

### Improved
- **IMPROVED**: Chat rating component now only appears after AI response streaming is complete
- **IMPROVED**: Added 500ms delay and smooth fade-in animation for better user experience
- **IMPROVED**: Chat rating buttons now always visible, allowing users to change their ratings
- **IMPROVED**: Added visual feedback for selected rating state with color-coded buttons
- **IMPROVED**: Simplified chat rating UI by removing redundant text feedback - users can see rating status through button colors

### Fixed
- **FIXED**: Chat rating API now correctly stores AI answers in `ai_answer` field instead of `user_feedback` field
- **FIXED**: Document rating API endpoints now properly use production URLs instead of hardcoded localhost
- **FIXED**: All API endpoints now use consistent runtime environment detection for production vs development
- **FIXED**: Removed build-time environment variable dependency that could cause production API routing issues
- **FIXED**: Critical SSR (Server-Side Rendering) issue that was causing Vercel build failures
- **FIXED**: Made admin page and configManager SSR-safe by checking for browser environment before accessing window object

### Added
- **NEW**: Test Cases page at `/test-cases` with 3 sample JEGA software questions in Vietnamese
- **NEW**: Simple test case management system with search functionality
- **NEW**: User rating system (thumbs up/down) for AI answers
- **NEW**: User comment system for feedback on AI responses
- **NEW**: Clean, simplified UI without tags, icons, or expand/collapse functionality
- **NEW**: Wider layout (4200px max-width) for better readability
- **NEW**: Always-visible answers (no need to click expand)
- **NEW**: Single question display with left/right navigation arrows
- **NEW**: Question counter showing current position (e.g., "2 / 3")
- **NEW**: Responsive design optimized for all device sizes
- **UPDATED**: Reduced all component sizes - text font size set to 16px, all spacing reduced by half for more compact layout
- **UPDATED**: Removed statistics section with question count display
- **UPDATED**: Moved navigation arrows to left and right sides of main content area for better accessibility and visual balance
- **FIXED**: UI layout shifts when navigating between questions - added consistent heights and smooth transitions
- **IMPROVED**: Question/answer box width tripled and layout stability enhanced with fixed dimensions and overflow control
- **ENHANCED**: Main content area now uses flex: 3 for maximum width utilization with minimum 800px width constraint
- **IMPROVED**: Header section reduced in height and font size for better proportion and compact design
- **ENHANCED**: Header height further reduced by half with smaller fonts (12px/10px) and minimal padding (8px) for ultra-compact design
- **IMPROVED**: Search box width now matches main content area for better visual alignment and consistency
- **UPDATED**: Rating button text changed from "Hữu ích/Không hữu ích" to "Tốt/Không tốt" for better Vietnamese language clarity
- **IMPROVED**: Question counter now properly center-aligned with block display and fit-content width for better visual balance
- **REMOVED**: Search bar completely removed from Test Cases page to save space and simplify the interface

## [Unreleased]

### Changed
- **RATING SYSTEM INTEGRATION**: Refactored document rating component positioning
  - Moved rating component from separate row to same row as document content using Layout override
  - Rating component now integrates directly into Docusaurus document layout structure
  - Improved positioning to match document content width constraints
  - Rating component appears as additional column in same row as navigation and content
- **MAJOR MIGRATION**: Replaced English documentation structure with Vietnamese jega_docs
  - Removed old docs folder with English-structured content
  - Migrated complete Vietnamese documentation from jega_docs to docs folder
  - Updated documentation structure to better match Vietnamese content organization
  - Created new intro.md page with comprehensive Vietnamese navigation
  - Fixed YAML frontmatter issues with colons in titles (quoted sensitive values)
  - **VERIFIED**: Build process works correctly with new Vietnamese document structure
  - **RESULT**: All documentation now uses proper Vietnamese organization and terminology
- **API DATASTORE UPDATE**: Updated Google Vertex AI Search datastore configuration
  - Changed from `jega-kb-chunks_1750402964245` to `jega-chunks-v2`
  - Maintained full path format: `projects/gen-lang-client-0221178501/locations/global/collections/default_collection/dataStores/jega-chunks-v2`

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
- **NEW**: Gemini 2.5 thinking capability with streaming thoughts display

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
- **FIXED**: Removed hardcoded default limit (100) from saveMessagesToStorage function - now properly uses userHistory value from Bubble configuration
- **ENHANCED**: Added Gemini 2.5 thinking configuration with dynamic thinking budget and thought streaming
- **ENHANCED**: Implemented real-time streaming thoughts with typewriter effect and visual indicators
- **UX IMPROVEMENT**: Thoughts section now expanded by default for better visibility of AI reasoning process
- **FIXED**: Corrected thought detection logic to use direct attribute access (`part.thought`) instead of `getattr()` for proper Gemini 2.5 thinking detection
- **UX IMPROVEMENT**: Moved thoughts section above bot message for better logical flow - users see AI reasoning before the final answer
- **FIXED**: Corrected undefined variable references in typewriter streaming implementation - replaced `typewriterInterval` and `textBuffer` with proper variable names (`answerTypewriterInterval`, `thoughtsTypewriterInterval`, `answerBuffer`, `thoughtsBuffer`)
- **FIXED**: Thoughts now properly stream with typewriter effect - corrected streaming response handler to call `onThought` callback instead of directly updating message state
- **NEW**: Chatbot response rating system - Users can rate AI responses with thumbs up/down
- **NEW**: Chat rating component integrated into chatbot interface for each AI response
- **NEW**: Backend API endpoint `/api/chat-rating` for storing chat ratings in Bubble database
- **NEW**: Separate storage system for chat ratings vs document ratings with localStorage persistence
- **NEW**: Rating feedback display showing user's previous rating status
- **IMPROVED**: Chat rating component now only appears after AI response streaming is complete
- **IMPROVED**: Added 500ms delay and smooth fade-in animation for better user experience
- **IMPROVED**: Chat rating buttons now always visible, allowing users to change their ratings
- **IMPROVED**: Added visual feedback for selected rating state with color-coded buttons
- **IMPROVED**: Simplified chat rating UI by removing redundant text feedback - users can see rating status through button colors
- **FIXED**: Chat rating API now correctly stores AI answers in `ai_answer` field instead of `user_feedback` field
- **IMPROVED**: Thoughts typewriter speed increased to 5ms (from 10ms) for faster, more responsive display since thoughts are typically shorter than answers
- **ENHANCED**: Sequential typewriter flow - thoughts appear first with typewriter effect, then answer starts only after thoughts are complete for better readability
- **FIXED**: Answer text now properly hidden until thoughts typewriter effect is complete - prevents premature display of answer content
- **ENHANCED**: Thoughts section automatically collapses when typewriter effect completes - cleaner UI flow
- **UI IMPROVEMENTS**: 
  - Removed borders and round corners from thoughts section for cleaner appearance
  - Moved thoughts arrow indicator to the right side
  - Changed answer typewriter speed to 10ms for better readability
  - Applied streaming indicator styling to thoughts text (primary color, italic, opacity) while keeping font size
  - Applied streaming indicator styling to thoughts summary header (primary color only) and updated arrow icon to match menu style
  - Enhanced thoughts summary header with soft gray gradient background (left to right) for better visual appeal
  - **NEW**: Added thoughts timing display in header showing total time spent on thoughts (in milliseconds)
  - **FIXED**: Thoughts timing now stops when last chunk is received (not when typewriter ends) for accurate timing measurement
  - **STYLING**: Made thoughts content background and borders transparent for cleaner appearance
- **CRITICAL FIX**: Fixed single-word message duplication bug - added check to prevent duplicate user messages in chat history before sending to Gemini API
- **FIXED**: Removed hardcoded fallback values for conversation_memory (10) and user_history (100) - now properly validates that these values exist in Bubble configuration
- **DOCUMENTATION FIX**: Fixed YAML frontmatter parsing errors in multiple documentation files - added proper quotes around titles containing colons to resolve Docusaurus build issues (affected 6 files across different documentation sections)
- **ROUTING FIX**: Resolved duplicate routes warning by adding prefixes to differentiate similar content across sections:
  - Added "kitchen-" prefix to Kitchen Cabinets documentation routes
  - Added "general-" prefix to root-level Parameters Setting routes  
  - Added "lighting-" prefix to Rendering Lighting routes
  - Added "intro-", "basic-", "construction-" prefixes to resolve other conflicts
  - Fixed 12 duplicate route conflicts total
- **MARKDOWN FIX**: Fixed unused markdown directives - replaced unsupported `:::question` and `:::example` with standard `:::note` directives
- **BLOG FIX**: Added proper blog post content with truncation marker (`<!-- truncate -->`) to resolve Docusaurus warning
- **CRITICAL CLEANUP**: Removed duplicate root-level "Parameters Setting" folder that was conflicting with merged "Wardrobe-System Cabinets/Parameters Setting" 
  - Eliminated 58+ module resolution errors causing build failures
  - Resolved "EMFILE: too many open files" issues
  - Cleaned up folder structure after merging old separate "System Cabinet" and "Wardrobe" folders into unified "Wardrobe-System Cabinets"
  - Cleared Docusaurus cache and restarted servers for clean state
- **YAML FRONTMATTER CRITICAL FIX**: Resolved persistent YAML parsing errors preventing frontend startup
  - Fixed 6 documentation files where titles containing colons (`:`) weren't properly quoted
  - Recreated `trinh-chinh-sua-mo-hinh-tam-1-mo-canh-ben.md` with clean character encoding
  - Added proper quotes around titles and sidebar_labels in affected files
  - Cleared Docusaurus build cache to resolve stale file conflicts
  - **VERIFIED**: Both frontend (port 3000) and backend (port 3001) servers now running successfully
- **MAJOR UX IMPROVEMENT**: Completely redesigned ChatBot thoughts and answer streaming flow to eliminate freezing and jarring transitions
  - **REMOVED**: Complex sequential typewriter animation for thoughts that caused freezing and sudden appearances
  - **IMPROVED**: Thoughts now appear instantly but remain collapsed by default until user manually opens them
  - **ENHANCED**: Answer typing animation starts immediately when ready, no longer waits for thoughts to complete
  - **SIMPLIFIED**: Changed from sequential flow (thoughts → answer) to parallel flow (thoughts + answer simultaneously)
  - **PERFORMANCE**: Eliminated unnecessary typewriter intervals and reduced complexity of streaming logic
  - **ACCESSIBILITY**: Better user experience with smoother, more predictable chat interactions
- **CRITICAL FIX**: ChatBot panel now stays open when users click on source links
  - **FIXED**: Removed `window.location.href` from internal link navigation that was causing full page reload and closing the ChatBot panel
  - **IMPROVED**: Internal source links now navigate using React Router's pushState without page reload
  - **UX ENHANCEMENT**: Users can now click on source links and continue their conversation without losing the ChatBot panel state
- **UI IMPROVEMENT**: Source link containers now maintain full width regardless of text length
  - **FIXED**: Changed source links from `inline-flex` to `flex` with `width: 100%` for consistent layout
  - **ENHANCED**: Source link containers now provide consistent visual spacing and alignment
  - **STYLING**: Added `box-sizing: border-box` for proper width calculation
- **CRITICAL FIX**: Fixed numbered list numbering reset issue when source links are present
  - **PROBLEM**: Source links were breaking HTML list structure, causing numbering to reset to 1 after each source link
  - **SOLUTION**: Changed processing order to handle source links before numbered lists
  - **TECHNICAL**: Changed source link containers from `<div>` to `<span>` elements to maintain inline flow within list items
  - **RESULT**: Numbered lists now maintain continuous numbering (1, 2, 3, 4, 5) even with source links
- **URL FIX**: Fixed double slash issue in ChatBot source link URLs
  - **PROBLEM**: ChatBot was generating malformed URLs like `http://localhost:3000/docs//o-vat-lieu` with double slashes
  - **ROOT CAUSE**: AI responses contained URLs with leading slashes after `/docs/`, causing concatenation issues
  - **SOLUTION**: Added `.replace(/^\/+/, '')` to strip leading slashes from document paths before URL construction
  - **RESULT**: All internal source links now generate correct URLs like `http://localhost:3000/docs/o-vat-lieu`
  - **DEBUGGING**: Enhanced logging to track URL processing and validation
- **NEW FEATURE**: Added comprehensive automation testing framework for ChatBot API
  - **FRAMEWORK**: Created `automation-tests/` folder with complete testing infrastructure (git-ignored)
  - **CAPABILITIES**: CSV-based question loading, API response validation, performance testing, and detailed reporting
  - **STRUCTURE**: Organized folders for data, tests, config, and results with professional test architecture
  - **VALIDATION**: Automated checks for API response structure, content length, keyword matching, and performance metrics
  - **FORMATS**: Multiple output formats (JSON, CSV, logs) for comprehensive test result analysis
  - **USABILITY**: Simple batch file execution for Windows users and command-line interface for advanced usage
  - **DOCUMENTATION**: Complete README with setup instructions, usage examples, and troubleshooting guide
  - **CUSTOM FORMAT**: Updated framework to work with user's CSV format (persona, question, relevant_doc_title)
  - **ENHANCED VALIDATION**: Added Vietnamese language detection, source checking, and persona-based testing
  - **FLEXIBLE INPUT**: Supports both user's format and template format for maximum compatibility
  - **STREAMING API**: Fixed framework to work with streaming ChatBot API endpoint (`/api/vertex-ai`)
  - **RESPONSE PARSING**: Added Server-Sent Events (SSE) parsing for streaming responses with `fullResponse` field
  - **TESTING LIMITS**: Added `max_questions` configuration to limit test runs (default: 10 questions) for easier testing and validation
  - **BACKEND API MATCHING**: Enhanced framework to replicate backend API configuration exactly
    - ✅ Same system prompt fetched from Bubble database
    - ✅ Same model parameters (temperature, top_p, max_tokens)
    - ✅ Same safety settings (all categories OFF)
    - ✅ Same thinking configuration (dynamic budget, thoughts included)
    - ✅ Same tools (Vertex AI Search with identical datastore)
    - ✅ Same response processing (link conversion, text formatting)
  - **ENHANCED CSV OUTPUT**: Results now capture detailed AI responses for manual review:
    - `ai_analyze`: AI thinking and analysis process
    - `ai_search`: Search results and document sources  
    - `ai_answer`: Final answer text
    - Perfect format for quality assessment and manual review
  - **ASYNC PROCESSING**: Fast, efficient testing with proper rate limiting and error handling
  - **CONFIGURATION MANAGEMENT**: Automatically fetches live configuration from Bubble API
  - **BUBBLE API INTEGRATION**: Added `aiohttp` dependency for async HTTP requests to Bubble API

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