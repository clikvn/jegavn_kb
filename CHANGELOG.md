# Changelog

All notable changes to the JEGA Knowledge Base project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
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