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
// MODEL_ID is now dynamic from Bubble config

// Bubble API configuration
const { BUBBLE_API_URL, BUBBLE_API_KEY, environment } = require('./bubble-config');

/**
 * Fetch configuration from Bubble database
 * @returns {Promise<Object>} Configuration object with systemPrompt and modelParameters
 */
async function fetchBubbleConfig() {
  try {
    console.log('🔧 [BUBBLE] Starting configuration fetch from Bubble database...');
    console.log('📍 [BUBBLE] API URL:', BUBBLE_API_URL);
    console.log('⏰ [BUBBLE] Fetch timestamp:', new Date().toISOString());
    
    const response = await fetch(BUBBLE_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JEGA-Knowledge-Base/1.0'
      }
    });

    console.log('📡 [BUBBLE] API Response Status:', response.status);
    console.log('📡 [BUBBLE] API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [BUBBLE] API Error:', response.status, errorText);
      throw new Error(`Bubble API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 [BUBBLE] Raw API Response:', JSON.stringify(data, null, 2));
    console.log('✅ [BUBBLE] Configuration fetched successfully from Bubble');
    
    // Transform Bubble data to our configuration format
    const config = transformBubbleData(data);
    
    console.log('🔧 [BUBBLE] Transformed config:', {
      hasSystemPrompt: !!config.systemPrompt,
      systemPromptLength: config.systemPrompt?.length || 0,
      aiModel: config.aiModel,
      temperature: config.modelParameters.temperature,
      topP: config.modelParameters.topP,
      maxOutputTokens: config.modelParameters.maxOutputTokens
    });
    
    return config;

  } catch (error) {
    console.error('❌ [BUBBLE] Failed to fetch configuration from Bubble:', error);
    throw error;
  }
}

/**
 * Transform Bubble data to our configuration format
 * @param {Object} bubbleData - Raw data from Bubble API
 * @returns {Object} Transformed configuration object
 */
function transformBubbleData(bubbleData) {
  try {
    if (bubbleData && bubbleData.response && bubbleData.response.results && bubbleData.response.results.length > 0) {
      const bubbleConfig = bubbleData.response.results[0];
      
      // Extract AI model - REQUIRED from Bubble
      let aiModel = undefined;
      console.log('🔍 [BUBBLE] Raw ai_model from Bubble:', bubbleConfig.ai_model);
      if (bubbleConfig.ai_model) {
        aiModel = bubbleConfig.ai_model;
        console.log('✅ [BUBBLE] AI model extracted:', aiModel);
      } else {
        console.log('❌ [BUBBLE] AI model field missing or empty');
      }
      
      // Extract model parameters
      const modelParameters = {
        temperature: bubbleConfig.tempature ? parseFloat(bubbleConfig.tempature) : undefined,
        topP: bubbleConfig['top-p'] ? parseFloat(bubbleConfig['top-p']) : undefined,
        maxOutputTokens: bubbleConfig.max_output_tokens ? parseInt(bubbleConfig.max_output_tokens) : undefined
      };
      
      // Extract and parse the system prompt if available
      let systemPrompt = undefined;
      if (bubbleConfig.prompt) {
        systemPrompt = bubbleConfig.prompt
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      }
      
      // Validate ALL required fields are present
      console.log('🔍 [BUBBLE] Validation check:', {
        hasAiModel: !!aiModel,
        aiModelValue: aiModel,
        hasSystemPrompt: !!systemPrompt,
        hasTemperature: !!modelParameters.temperature,
        hasTopP: !!modelParameters.topP,
        hasMaxOutputTokens: !!modelParameters.maxOutputTokens
      });
      
      if (!aiModel || !systemPrompt || !modelParameters.temperature || !modelParameters.topP || !modelParameters.maxOutputTokens) {
        const missingFields = [];
        if (!aiModel) missingFields.push('aiModel');
        if (!systemPrompt) missingFields.push('systemPrompt');
        if (!modelParameters.temperature) missingFields.push('temperature');
        if (!modelParameters.topP) missingFields.push('topP');
        if (!modelParameters.maxOutputTokens) missingFields.push('maxOutputTokens');
        throw new Error(`Missing required config fields from Bubble: ${missingFields.join(', ')}`);
      }
      
      return {
        aiModel,
        systemPrompt,
        modelParameters
      };
    } else {
      throw new Error('No config found in Bubble response');
    }
  } catch (error) {
    throw new Error('Failed to parse Bubble config: ' + error.message);
  }
}

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
    // Skip the first message (usually welcome message) and process the rest
    const messagesToProcess = chatHistory.slice(1);
    console.log(`📝 [CHAT] Processing ${messagesToProcess.length} messages for Vertex AI`);
    
    messagesToProcess.forEach((msg, index) => {
      if (msg.sender === 'user' || msg.sender === 'bot') {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    });
    
    console.log(`✅ [CHAT] Formatted ${contents.length} messages for Vertex AI`);
  } else {
    console.log('📝 [CHAT] No chat history to process');
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

    // Log if history was limited by frontend
    if (chatHistory.length > 20) {
      console.log('⚠️ [CHAT] Frontend sent more than 20 messages, history may have been limited');
    }

    // Fetch configuration from Bubble database
    let config;
    try {
      console.log('🔄 [CHAT] Fetching Bubble config for this chat request...');
      config = await fetchBubbleConfig();
      console.log('✅ [CHAT] Successfully using configuration from Bubble database');
      console.log('📋 [CHAT] Config details:', {
        temperature: config.modelParameters.temperature,
        topP: config.modelParameters.topP,
        maxOutputTokens: config.modelParameters.maxOutputTokens,
        systemPromptLength: config.systemPrompt?.length || 0
      });
    } catch (bubbleError) {
      console.error('❌ [CHAT] Failed to fetch configuration from Bubble:', bubbleError);
      res.status(503).json({
        error: 'Configuration service unavailable',
        message: `Không thể tải cấu hình chatbot từ cơ sở dữ liệu. Lỗi: ${bubbleError.message}. Vui lòng thử lại sau hoặc liên hệ quản trị viên.`,
        details: {
          bubbleError: bubbleError.message,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

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

    // Prepare request body for Vertex AI using dynamic configuration
    const requestBody = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: config.systemPrompt }]
      },
      tools: [{
        retrieval: {
          vertexAiSearch: {
            datastore: "projects/gen-lang-client-0221178501/locations/global/collections/default_collection/dataStores/jega-kb-chunks_1750402964245"
          }
        }
      }],
      generationConfig: {
        temperature: config.modelParameters.temperature,
        maxOutputTokens: config.modelParameters.maxOutputTokens,
        topP: config.modelParameters.topP
      }
    };

    console.log('📋 Request body structure:', {
      hasContents: !!requestBody.contents,
      contentsLength: requestBody.contents?.length || 0,
      hasSystemInstruction: !!requestBody.systemInstruction,
      hasTools: !!requestBody.tools,
      toolsLength: requestBody.tools?.length || 0,
      hasGenerationConfig: !!requestBody.generationConfig,
      configSource: 'Bubble Database',
      temperature: config.modelParameters.temperature,
      maxOutputTokens: config.modelParameters.maxOutputTokens,
      topP: config.modelParameters.topP
    });

    console.log('🚀 [VERTEX] Sending request to Vertex AI with Bubble config...');
    console.log('🔧 [VERTEX] Generation config from Bubble:', {
      temperature: requestBody.generationConfig.temperature,
      maxOutputTokens: requestBody.generationConfig.maxOutputTokens,
      topP: requestBody.generationConfig.topP
    });
    console.log('📝 [VERTEX] System instruction length from Bubble:', requestBody.systemInstruction.parts[0].text.length);

    // Call Vertex AI API using dynamic model from Bubble config - NO FALLBACKS
    if (!config.aiModel) {
      throw new Error('AI model not configured in Bubble database. Contact administrator.');
    }
    const modelId = config.aiModel;
    console.log('🤖 [VERTEX] Using AI model from Bubble config:', modelId);
    
    const vertexResponse = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${modelId}:generateContent`,
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
      
      // Special logging for 429 errors to help with monitoring
      if (vertexResponse.status === 429) {
        console.warn('⚠️ [DSQ] Resource exhausted error detected - this is normal under Dynamic Shared Quota');
        console.warn('⚠️ [DSQ] Error details:', {
          status: vertexResponse.status,
          timestamp: new Date().toISOString(),
          errorCode: errorData.error?.code,
          errorMessage: errorData.error?.message,
          requestId: vertexResponse.headers.get('x-request-id') || 'unknown'
        });
      }
      
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
      model: modelId,
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
      errorMessage = 'Vertex AI resources temporarily exhausted due to high demand. This is normal under Dynamic Shared Quota and will resolve automatically. Please retry with exponential backoff.';
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