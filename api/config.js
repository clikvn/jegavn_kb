// Vercel Serverless Function for Chatbot Configuration Management
// This will run as /api/config in production

/**
 * JEGA Chatbot Configuration API
 * 
 * This module provides API endpoints for managing chatbot configuration
 * by fetching and updating settings from the Bubble database.
 */

const { BUBBLE_API_URL, BUBBLE_API_KEY, environment } = require('./bubble-config');

/**
 * Fetch configuration from Bubble database
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function fetchConfig(req, res) {
  try {
    console.log('🔧 Fetching chatbot configuration from Bubble...');
    console.log('📍 Bubble API URL:', BUBBLE_API_URL);
    
    const response = await fetch(BUBBLE_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JEGA-Knowledge-Base/1.0'
      }
    });

    console.log('📡 Bubble API Response Status:', response.status);
    console.log('📡 Bubble API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Bubble API Error:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Failed to fetch configuration',
        message: `Bubble API returned ${response.status}: ${errorText}`,
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    console.log('📦 Raw Bubble API Response:', JSON.stringify(data, null, 2));
    console.log('✅ Configuration fetched successfully');
    
    // Transform Bubble data to our configuration format
    const config = transformBubbleData(data);
    
    res.status(200).json({
      success: true,
      config: config,
      timestamp: new Date().toISOString(),
      source: 'bubble-database'
    });

  } catch (error) {
    console.error('❌ Configuration fetch error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Transform Bubble data to our configuration format
 * @param {Object} bubbleData - Raw data from Bubble API
 * @returns {Object} Transformed configuration object
 */
function transformBubbleData(bubbleData) {
  try {
    // Parse the actual Bubble API response structure
    if (bubbleData && bubbleData.response && bubbleData.response.results && bubbleData.response.results.length > 0) {
      const bubbleConfig = bubbleData.response.results[0];
      
      // Extract only the specific fields we need - ALL must come from Bubble
      const extractedConfig = {
        systemPrompt: '',
        aiModel: '',
        modelParameters: {},
        chatSettings: {},
        searchSettings: {
          enableGrounding: true,
          maxSearchResults: 5,
          searchFilterExpression: "lang: ANY('vi')"
        },
        safetySettings: {
          enableContentFiltering: true,
          blockedCategories: ["harmful", "hate", "sexual", "violence"]
        },
        responseFormat: {
          language: "vi",
          includeSources: true,
          maxResponseLength: 1000
        }
      };

      // Extract AI model - REQUIRED from Bubble
      if (!bubbleConfig.ai_model) {
        throw new Error('Missing required ai_model in Bubble config');
      }
      extractedConfig.aiModel = bubbleConfig.ai_model;

      // Extract model parameters - throw error if missing
      if (!bubbleConfig.tempature || !bubbleConfig['top-p'] || !bubbleConfig.max_output_tokens) {
        throw new Error('Missing required model parameters in Bubble config');
      }

      extractedConfig.modelParameters = {
        temperature: parseFloat(bubbleConfig.tempature),
        topP: parseFloat(bubbleConfig['top-p']),
        maxOutputTokens: parseInt(bubbleConfig.max_output_tokens)
      };

      // Extract and parse the system prompt if available
      if (!bubbleConfig.prompt) {
        throw new Error('Missing system prompt in Bubble config');
      }

      // Decode HTML entities in the prompt
      const decodedPrompt = bubbleConfig.prompt
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      // Store the prompt as a direct string, not nested object
      extractedConfig.systemPrompt = decodedPrompt;

      // Extract chat settings - REQUIRED from Bubble (no defaults)
      if (!bubbleConfig.conversation_memory) {
        throw new Error('Missing required conversation_memory in Bubble config');
      }
      if (!bubbleConfig.user_history) {
        throw new Error('Missing required user_history in Bubble config');
      }
      
      extractedConfig.chatSettings.conversationMemory = parseInt(bubbleConfig.conversation_memory);
      extractedConfig.chatSettings.userHistory = parseInt(bubbleConfig.user_history);
      
      console.log('📝 Successfully extracted chat settings from Bubble:', {
        conversationMemory: extractedConfig.chatSettings.conversationMemory,
        userHistory: extractedConfig.chatSettings.userHistory
      });

      console.log('✅ Successfully extracted configuration from Bubble:', {
        aiModel: extractedConfig.aiModel,
        temperature: extractedConfig.modelParameters.temperature,
        topP: extractedConfig.modelParameters.topP,
        maxOutputTokens: extractedConfig.modelParameters.maxOutputTokens,
        hasPrompt: !!bubbleConfig.prompt,
        conversationMemory: extractedConfig.chatSettings.conversationMemory,
        userHistory: extractedConfig.chatSettings.userHistory
      });

      return extractedConfig;
    } else {
      throw new Error('No configuration found in Bubble response');
    }
  } catch (error) {
    console.error('❌ Error parsing Bubble data:', error);
    throw new Error('Failed to parse Bubble configuration: ' + error.message);
  }
}

/**
 * Update configuration in Bubble database
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function updateConfig(req, res) {
  try {
    console.log('🔧 Updating chatbot configuration in Bubble...');
    
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST method is allowed for updating configuration'
      });
    }

    const config = req.body;
    
    if (!config) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Configuration data is required'
      });
    }

    // Validate configuration structure
    const validation = validateConfig(config);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid configuration',
        message: 'Configuration validation failed',
        details: validation.errors
      });
    }

    // First, get the current record to get the _id
    console.log('📋 Fetching current record to get _id...');
    const getResponse = await fetch(BUBBLE_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JEGA-Knowledge-Base/1.0'
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('❌ Failed to fetch current record:', getResponse.status, errorText);
      return res.status(getResponse.status).json({
        error: 'Failed to fetch current configuration',
        message: `Bubble API returned ${getResponse.status}: ${errorText}`,
        timestamp: new Date().toISOString()
      });
    }

    const currentData = await getResponse.json();
    if (!currentData.response || !currentData.response.results || currentData.response.results.length === 0) {
      return res.status(404).json({
        error: 'No configuration record found',
        message: 'No SystemPrompt record exists in Bubble database',
        timestamp: new Date().toISOString()
      });
    }

    const recordId = currentData.response.results[0]._id;
    console.log('📋 Found record ID:', recordId);

    // Prepare the update data in Bubble format
    const updateData = {};
    
    // Map AI model to Bubble field
    if (config.aiModel) {
      updateData.ai_model = config.aiModel;
      console.log('📤 Sending ai_model to Bubble:', config.aiModel);
    }
    
    // Map our config to Bubble fields
    if (config.modelParameters) {
      if (config.modelParameters.temperature !== undefined) {
        updateData.tempature = config.modelParameters.temperature.toString();
      }
      if (config.modelParameters.topP !== undefined) {
        updateData['top-p'] = config.modelParameters.topP.toString();
      }
      if (config.modelParameters.maxOutputTokens !== undefined) {
        updateData.max_output_tokens = config.modelParameters.maxOutputTokens.toString();
      }
    }
    
    if (config.systemPrompt) {
      // Handle both string and object formats for backward compatibility
      if (typeof config.systemPrompt === 'string') {
        updateData.prompt = config.systemPrompt;
      } else if (config.systemPrompt.fullPrompt) {
        updateData.prompt = config.systemPrompt.fullPrompt;
      }
    }
    
    // Map chat settings to Bubble fields
    if (config.chatSettings) {
      if (config.chatSettings.conversationMemory !== undefined) {
        updateData.conversation_memory = config.chatSettings.conversationMemory.toString();
        console.log('📤 Sending conversation_memory to Bubble:', config.chatSettings.conversationMemory);
      }
      if (config.chatSettings.userHistory !== undefined) {
        updateData.user_history = config.chatSettings.userHistory.toString();
        console.log('📤 Sending user_history to Bubble:', config.chatSettings.userHistory);
      }
    }

    console.log('📤 Update data for Bubble:', JSON.stringify(updateData, null, 2));

    // Update the record using PATCH method
    const updateResponse = await fetch(`${BUBBLE_API_URL}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JEGA-Knowledge-Base/1.0'
      },
      body: JSON.stringify(updateData)
    });

    console.log('📡 Bubble API Update Response Status:', updateResponse.status);

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Bubble API Update Error:', updateResponse.status, errorText);
      
      return res.status(updateResponse.status).json({
        error: 'Failed to update configuration',
        message: `Bubble API returned ${updateResponse.status}: ${errorText}`,
        timestamp: new Date().toISOString()
      });
    }

    // For 204 responses (success with no content), don't try to parse JSON
    let result = null;
    if (updateResponse.status !== 204) {
      try {
        result = await updateResponse.json();
        console.log('📦 Update result:', JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.warn('⚠️ Could not parse response as JSON:', parseError.message);
      }
    }

    console.log('✅ Configuration updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString(),
      result: result
    });

  } catch (error) {
    console.error('❌ Configuration update error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
function validateConfig(config) {
  const errors = [];
  
  // Check required fields
  if (!config.systemPrompt) {
    errors.push('systemPrompt is required');
  } else if (typeof config.systemPrompt !== 'string') {
    errors.push('systemPrompt must be a string');
  } else if (config.systemPrompt.trim().length === 0) {
    errors.push('systemPrompt cannot be empty');
  }
  
  if (!config.aiModel) {
    errors.push('aiModel is required');
  } else if (typeof config.aiModel !== 'string') {
    errors.push('aiModel must be a string');
  } else if (config.aiModel.trim().length === 0) {
    errors.push('aiModel cannot be empty');
  }
  
  if (!config.modelParameters) {
    errors.push('modelParameters is required');
  }
  
  // Validate model parameters
  if (config.modelParameters) {
    const { temperature, topP, maxOutputTokens } = config.modelParameters;
    
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      errors.push('temperature must be between 0 and 2');
    }
    
    if (topP !== undefined && (topP < 0 || topP > 1)) {
      errors.push('topP must be between 0 and 1');
    }
    
    if (maxOutputTokens !== undefined && maxOutputTokens < 1) {
      errors.push('maxOutputTokens must be at least 1');
    }
  }
  
  // Validate chat settings - REQUIRED from Bubble
  if (!config.chatSettings) {
    errors.push('chatSettings is required');
  } else {
    const { conversationMemory, userHistory } = config.chatSettings;
    
    // Both conversationMemory and userHistory are required
    if (conversationMemory === undefined || conversationMemory === null) {
      errors.push('conversationMemory is required');
    } else if (conversationMemory < 1 || conversationMemory > 100) {
      errors.push('conversationMemory must be between 1 and 100');
    }
    
    if (userHistory === undefined || userHistory === null) {
      errors.push('userHistory is required');
    } else if (userHistory < 10 || userHistory > 1000) {
      errors.push('userHistory must be between 10 and 1000');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export the main handler function
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Route requests based on method
  if (req.method === 'GET') {
    return fetchConfig(req, res);
  } else if (req.method === 'POST') {
    return updateConfig(req, res);
  } else {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are supported'
    });
  }
};

// Export functions for testing
module.exports.transformBubbleData = transformBubbleData;
module.exports.validateConfig = validateConfig; 