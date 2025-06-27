// Vercel Serverless Function for Vertex AI integration
// This will run as /api/vertex-ai in production

const { GoogleAuth } = require('google-auth-library');

/**
 * JEGA Assistant Vertex AI Integration
 * 
 * This module provides the API endpoint for the JEGA Assistant chatbot,
 * integrating with Google Vertex AI using Gemini 2.5 Pro and Vertex AI Search
 * for contextual responses based on the JEGA knowledge base.
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
- **content_type**: \`tutorial\`, \`feature_guide\`, \`troubleshooting\`
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
5. **Build Filter Expression:** Combine the selected filters with \`AND\`.
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
 * Validate request body
 * @param {Object} body - Request body
 * @returns {Object} Validation result
 */
function validateRequest(body) {
  const errors = [];
  
  if (!body) {
    errors.push('Request body is required');
    return { isValid: false, errors };
  }
  
  if (typeof body !== 'object') {
    errors.push('Request body must be an object');
    return { isValid: false, errors };
  }
  
  if (!body.message || typeof body.message !== 'string') {
    errors.push('Message field is required and must be a string');
  } else if (body.message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (body.message.length > 10000) {
    errors.push('Message is too long (max 10,000 characters)');
  }
  
  if (body.chatHistory && !Array.isArray(body.chatHistory)) {
    errors.push('Chat history must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Initialize Google Cloud authentication
 * @returns {Promise<Object>} Auth client
 */
async function initializeAuth() {
  try {
    let auth;
    
    // In production (Vercel), use environment variables for credentials
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      console.log('🔐 Using environment variable credentials');
      const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
      auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    } else {
      // Fallback: try to use service account file (for local development only)
      console.log('🔐 Using service account file (local development)');
      auth = new GoogleAuth({
        keyFilename: './jega-chatbot-service-key.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    }
    
    return { auth, error: null };
  } catch (error) {
    console.error('❌ Auth initialization failed:', error);
    
    // Provide specific error messages for different scenarios
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      return { 
        auth: null, 
        error: 'Invalid GOOGLE_CLOUD_CREDENTIALS environment variable. Please check the JSON format.' 
      };
    } else {
      return { 
        auth: null, 
        error: 'Google Cloud credentials not found. Please set GOOGLE_CLOUD_CREDENTIALS environment variable or ensure jega-chatbot-service-key.json exists.' 
      };
    }
  }
}

/**
 * Convert chat history to Gemini format
 * @param {Array} chatHistory - Chat history array
 * @returns {Array} Formatted contents for Gemini
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
 * Process response text to add clickable links
 * @param {string} text - Response text
 * @param {Array} sources - Source links
 * @returns {string} Processed text with clickable links
 */
function processResponseText(text, sources) {
  if (!sources || sources.length === 0) {
    return text;
  }
  
  let processedText = text;
  
  // Look for patterns like [1], [2], etc. and replace with clickable source links
  processedText = processedText.replace(/\[(\d+)\]/g, (match, num) => {
    const sourceIndex = parseInt(num) - 1;
    if (sourceIndex >= 0 && sourceIndex < sources.length) {
      const source = sources[sourceIndex];
      return `<a href="${source.url}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: none; font-weight: 500;">[${num}]</a>`;
    }
    return match;
  });
  
  // Also look for explicit URLs in the text and make them clickable
  processedText = processedText.replace(/(https?:\/\/[^\s\n]+)/g, (url) => {
    // Check if this URL is in our extracted sources
    const matchingSource = sources.find(source => source.url === url);
    if (matchingSource) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: none; font-weight: 500;">${matchingSource.displayTitle}</a>`;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: none;">${url}</a>`;
  });
  
  // Append all sources as clickable links at the end of the response
  if (sources.length > 0) {
    processedText += '\n\n**📚 Tài liệu tham khảo:**\n';
    sources.forEach((source, index) => {
      processedText += `${index + 1}. <a href="${source.url}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: none; font-weight: 500;">${source.displayTitle}</a>\n`;
    });
  }
  
  return processedText;
}

/**
 * Main Vertex AI handler function
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
    const validation = validateRequest(req.body);
    if (!validation.isValid) {
      console.error('❌ Request validation failed:', validation.errors);
      res.status(400).json({ 
        error: 'Invalid request',
        message: validation.errors.join(', ')
      });
      return;
    }

    const { message, chatHistory = [] } = req.body;

    console.log('📨 Received request:', { 
      message: message.substring(0, 50) + '...', 
      historyLength: chatHistory.length 
    });

    // Initialize authentication
    const { auth, error: authError } = await initializeAuth();
    if (authError) {
      console.warn('⚠️ Google Cloud credentials not found. Vertex AI features disabled.');
      res.status(503).json({ 
        error: 'Vertex AI service unavailable',
        message: authError
      });
      return;
    }

    // Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    console.log('🔐 Access token acquired');

    // Convert chat history to Gemini format
    const contents = formatChatHistory(chatHistory);

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Prepare request body for Vertex AI
    const requestBody = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      tools: [{
        retrieval: {
          vertexAiSearch: {
            datastore: "projects/gen-lang-client-0221178501/locations/global/collections/default_collection/dataStores/jega-kb-chunks_1750402964245"
          }
        }
      }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 65535,
        topP: 0.9
      }
    };

    console.log('📋 Request body structure:', {
      hasContents: !!requestBody.contents,
      contentsLength: requestBody.contents?.length || 0,
      hasSystemInstruction: !!requestBody.systemInstruction,
      hasTools: !!requestBody.tools,
      toolsLength: requestBody.tools?.length || 0,
      hasGenerationConfig: !!requestBody.generationConfig
    });

    console.log('🚀 Sending request to Vertex AI...');

    // Call Vertex AI API
    const vertexResponse = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    console.log('📡 Vertex AI response status:', vertexResponse.status);

    if (!vertexResponse.ok) {
      const errorData = await vertexResponse.json();
      console.error('❌ Vertex AI Error:', JSON.stringify(errorData, null, 2));
      throw new Error(`Vertex AI API error: ${vertexResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    // Handle regular JSON response (not streaming)
    const data = await vertexResponse.json();
    console.log('📦 Response data received');
    
    let fullResponse = '';
    let groundingMetadata = null;
    let usageMetadata = null;
    
    // Extract text content from candidates
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts || [];
      for (const part of parts) {
        if (part.text) {
          console.log('📝 Adding text:', part.text.substring(0, 100) + '...');
          fullResponse += part.text;
        }
      }
    }
    
    // Capture grounding metadata from candidates
    if (data.candidates && data.candidates[0] && data.candidates[0].groundingMetadata) {
      groundingMetadata = data.candidates[0].groundingMetadata;
    }
    
    // Capture usage metadata
    if (data.usageMetadata) {
      usageMetadata = data.usageMetadata;
    }

    console.log('📊 Stream processing complete:', {
      responseLength: fullResponse.length,
      hasGrounding: !!groundingMetadata,
      groundingContexts: groundingMetadata?.groundingChunks?.length || 0
    });

    // Extract sources from grounding metadata
    const extractedSources = extractSources(groundingMetadata);

    // Process response text to add clickable links
    const processedResponse = processResponseText(fullResponse, extractedSources);

    // Extract response text
    let responseText = processedResponse || 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.';

    console.log('✅ Final response:', { 
      responseLength: responseText.length, 
      hasGrounding: !!groundingMetadata,
      groundingContexts: groundingMetadata?.groundingChunks?.length || 0,
      sourcesFound: extractedSources.length
    });

    // Return successful response
    res.status(200).json({
      response: responseText,
      model: 'gemini-2.5-pro',
      groundingMetadata: groundingMetadata || null,
      usageMetadata: usageMetadata || null,
      sources: extractedSources
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Determine appropriate error response
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('credentials') || error.message.includes('auth')) {
      statusCode = 503;
      errorMessage = 'Vertex AI service unavailable - authentication failed';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      statusCode = 503;
      errorMessage = 'Vertex AI service temporarily unavailable';
    } else if (error.message.includes('validation')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('API error: 429')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded - please try again later';
    } else if (error.message.includes('API error: 403')) {
      statusCode = 403;
      errorMessage = 'Access denied - check API permissions';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}; 