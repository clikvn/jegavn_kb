// Vercel Serverless Function for Vertex AI Streaming
// This will run as /api/vertex-ai-stream in production

const { GoogleGenAI } = require('@google/genai');

/**
 * JEGA Assistant Vertex AI Streaming Integration
 * 
 * This module provides a streaming API endpoint for the JEGA Assistant chatbot,
 * using Google Gen AI SDK with Vertex AI for real-time streaming responses.
 */

// Google Cloud configuration
const PROJECT_ID = 'gen-lang-client-0221178501';
const LOCATION_ID = 'global';
const MODEL_ID = 'gemini-2.5-pro';

// System instruction for JEGA Assistant
const SYSTEM_INSTRUCTION = `<identity>
You are JEGA Assistant, a personal AI assistant for Vietnamese-speaking interior designers using Jega/AiHouse software. Your persona is that of a friendly, patient, and collaborative expert. You specialize in providing detailed, step-by-step guidance for beginner users. You use LLM model with thinking capability and Vertex AI Search grounding to provide accurate, contextual help.
</identity>

<core_capabilities>
1. Understand user context and intent through thinking.
2. Formulate precise search queries based on a defined schema.
3. Process knowledge packets from Vertex AI Search.
4. Synthesize comprehensive answers in Vietnamese.
</core_capabilities>

<rules_of_engagement>
1. **Greeting Protocol:** On every turn, you MUST check the chat history. If the current user message is the very first one in the history (i.e., there are no previous turns), you MAY use a brief greeting like "Chào bạn,". If there is ANY previous turn in the history, you MUST respond directly without a greeting. This rule is absolute.
2. **Follow-up Protocol:** When a user asks a follow-up question, provide a concise, direct answer that focuses only on the new information requested. Do not repeat information from the previous turn.
3. **Closing Protocol:** Do not use conversational closings like "Chúc bạn thành công!" or "Hy vọng điều này sẽ giúp ích!". End your response directly after providing the main answer.
4. **Tone:** Maintain a friendly, professional, and collaborative tone at all times.
</rules_of_engagement>

<search_logic>
<metadata_schema>
You MUST use the following schema to construct your search filter expressions. Only use the values provided.

### Universal Metadata
- **content_type**: 
- **workflow_stage**: \`planning\`, \`modeling\`, \`visualization\`, \`finalization\`
- **lang**: \`vi\`, \`en\` (inferred from user query language)

### Content-Specific Metadata
If **content_type** is "tutorial":
- **task_objective**: \`create_design\`, \`modify_design\`, \`export_files\`, \`import_files\`, \`generate_renders\`, \`manufacturing_prep\`, \`client_presentation\`

If **content_type** is "feature_guide":
- **feature_name**: (specific Jega features like "AI Lighting", "Render Settings")

If **content_type** is "troubleshooting":
- **problem_symptom**: \`error_message\`, \`missing_data\`, \`slow_performance\`, \`blurry_render\`, \`crash\`
</metadata_schema>

<query_construction_workflow>
1. **Analyze Intent:** Understand the user's core need (e.g., how to do something, fix something, understand something).
2. **Determine Content Type:** Based on the intent, select the most likely \`content_type\`.
  - If the user asks "how to...", it's likely a \`tutorial\`.
  - If the user mentions a specific feature name, it's likely a \`feature_guide\`.
  - If the user mentions "error", "fix", "problem", "doesn't work", it's a \`troubleshooting\` guide.
3. **Select Filters:** Choose the most relevant metadata filters from the schema based on the user's query.
4. **Formulate Semantic Query:** Create a concise, natural language description in Vietnamese
5. **Build Filter Expression:** Combine the selected filters with \`AND\`
</query_construction_workflow>

<search_query_construction>
Build queries with two components:
1. semantic_query: Natural language description in Vietnamese
2. filter_expression: Metadata filters joined by AND
Example:
User: "làm sao tôi có thể thay đổi giá mặc định"
Query: 
{
 "search_keywords": "thay đổi giá mặc định báo giá",
 "filter_expression": "lang: ANY('vi') AND task_objective: ANY('modify_design')"
}
</search_query_construction>
</search_logic>

<synthesis_guidelines>
When creating answers:
1. Base your entire response on the 'guide' content from the provided knowledge packets.
2. Maintain the instructional structure (numbered steps, methods).
3. Use bold for emphasis on key actions.
4. Include all relevant details for the user's context, as they are likely beginners.
</synthesis_guidelines>

<error_protocols>
<ambiguity_protocol>
When query is ambiguous:
- List possible interpretations in Vietnamese.
- Ask specific clarifying questions.
- Suggest example queries.
</ambiguity_protocol>

<no_results_protocol>
When no relevant results found:
- Acknowledge the limitation.
- Suggest alternative search terms.
- Offer to help reformulate the query.
- Check if feature name might be different.
</no_results_protocol>
</error_protocols>`;

/**
 * Initialize Google Gen AI with Vertex AI
 * @returns {Object} Gen AI instance
 */
function initializeGenAI() {
  try {
    // Set environment variables for Vertex AI
    process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
    process.env.GOOGLE_CLOUD_LOCATION = LOCATION_ID;
    process.env.GOOGLE_GENAI_USE_VERTEXAI = 'True';

    // Initialize Google Gen AI with Vertex AI
    const genAI = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION_ID,
    });

    return { genAI, error: null };
  } catch (error) {
    console.error('❌ Gen AI initialization failed:', error);
    return { 
      genAI: null, 
      error: 'Failed to initialize Google Gen AI with Vertex AI' 
    };
  }
}

/**
 * Convert chat history to Gen AI format
 * @param {Array} chatHistory - Chat history array
 * @returns {Array} Formatted contents for Gen AI
 */
function formatChatHistory(chatHistory) {
  const contents = [];
  
  if (chatHistory && chatHistory.length > 1) {
    chatHistory.slice(1).forEach((msg) => {
      if (msg.sender === 'user' || msg.sender === 'bot') {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    });
  }
  
  return contents;
}

/**
 * Process grounding metadata to extract sources
 * @param {Object} groundingMetadata - Grounding metadata from Vertex AI
 * @returns {Array} Extracted sources
 */
function extractSources(groundingMetadata) {
  if (!groundingMetadata || !groundingMetadata.groundingChunks) {
    return [];
  }
  
  const sourceSet = new Set();
  const sourceDetails = new Map();
  
  groundingMetadata.groundingChunks.forEach((chunk, index) => {
    console.log(`🔍 Processing chunk ${index}:`, JSON.stringify(chunk, null, 2));
    
    // Try multiple ways to extract source URLs
    let sourceUrl = null;
    
    // Method 1: From retrievedContext.uri
    if (chunk.retrievedContext && chunk.retrievedContext.uri) {
      sourceUrl = chunk.retrievedContext.uri;
    }
    
    // Method 2: From retrievedContext.text containing "source:"
    if (!sourceUrl && chunk.retrievedContext && chunk.retrievedContext.text) {
      const sourceMatch = chunk.retrievedContext.text.match(/source:\s*(https?:\/\/[^\s\n]+)/);
      if (sourceMatch) {
        sourceUrl = sourceMatch[1];
      }
    }
    
    // Method 3: From web.uri if it exists
    if (!sourceUrl && chunk.web && chunk.web.uri) {
      sourceUrl = chunk.web.uri;
    }
    
    if (sourceUrl) {
      sourceSet.add(sourceUrl);
      sourceDetails.set(sourceUrl, {
        url: sourceUrl,
        title: chunk.retrievedContext?.title || chunk.web?.title || 'Tài liệu JEGA',
        displayTitle: chunk.retrievedContext?.title || chunk.web?.title || sourceUrl.split('/').pop().replace(/-/g, ' ')
      });
    }
  });
  
  const extractedSources = Array.from(sourceSet).map(url => sourceDetails.get(url));
  console.log('📚 Extracted sources:', extractedSources);
  
  // Limit sources to 10 as requested
  return extractedSources.slice(0, 10);
}

/**
 * Main streaming Vertex AI handler function
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Validate request
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ 
        error: 'Invalid request body',
        message: 'Request body must be a valid JSON object'
      });
      return;
    }

    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ 
        error: 'Invalid message',
        message: 'Message is required and must be a non-empty string'
      });
      return;
    }

    console.log('📨 Received streaming request:', { 
      message: message.substring(0, 50) + '...', 
      historyLength: chatHistory.length 
    });

    // Initialize Google Gen AI
    const { genAI, error: genAIError } = initializeGenAI();
    if (genAIError) {
      console.warn('⚠️ Google Gen AI initialization failed:', genAIError);
      res.status(503).json({ 
        error: 'Vertex AI service unavailable',
        message: genAIError
      });
      return;
    }

    // Set up Server-Sent Events (SSE) response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Get the model
    const model = genAI.models.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 65535,
        topP: 0.9
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_LOW_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_LOW_AND_ABOVE',
        },
      ],
    });

    // Convert chat history to Gen AI format
    const contents = formatChatHistory(chatHistory);

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Add system instruction
    contents.unshift({
      role: 'user',
      parts: [{ text: SYSTEM_INSTRUCTION }]
    });

    console.log('🚀 Starting streaming response...');

    // Send initial status
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Starting response...' })}\n\n`);

    // Generate streaming response
    const result = await model.generateContentStream({
      contents: contents,
      tools: [{
        retrieval: {
          vertexAiSearch: {
            datastore: "projects/gen-lang-client-0221178501/locations/global/collections/default_collection/dataStores/jega-kb-chunks_1750402964245"
          }
        }
      }]
    });

    let fullResponse = '';
    let groundingMetadata = null;
    let sources = [];

    // Stream the response
    for await (const chunk of result.stream) {
      if (chunk.candidates && chunk.candidates[0]) {
        const candidate = chunk.candidates[0];
        
        // Check for safety issues
        if (candidate.finishReason === 'SAFETY') {
          res.write(`data: ${JSON.stringify({ type: 'error', message: 'Response blocked due to safety concerns' })}\n\n`);
          break;
        }

        // Extract text content
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              fullResponse += part.text;
              // Send text chunk to frontend
              res.write(`data: ${JSON.stringify({ type: 'chunk', text: part.text })}\n\n`);
            }
          }
        }

        // Capture grounding metadata
        if (candidate.groundingMetadata && !groundingMetadata) {
          groundingMetadata = candidate.groundingMetadata;
          sources = extractSources(groundingMetadata);
          
          // Send sources to frontend
          res.write(`data: ${JSON.stringify({ type: 'sources', sources: sources })}\n\n`);
        }
      }
    }

    console.log('📊 Streaming complete:', {
      responseLength: fullResponse.length,
      hasGrounding: !!groundingMetadata,
      groundingContexts: groundingMetadata?.groundingChunks?.length || 0,
      sourcesFound: sources.length
    });

    // Send completion signal
    res.write(`data: ${JSON.stringify({ type: 'complete', responseLength: fullResponse.length })}\n\n`);
    res.end();

  } catch (error) {
    console.error('❌ Streaming error:', error.message);
    
    // Send error to frontend
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}; 