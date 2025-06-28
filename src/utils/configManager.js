/**
 * Chatbot Configuration Manager
 * 
 * Client-side utility for managing chatbot configuration
 * through the API endpoints.
 */

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api' 
  : '/api';

/**
 * Fetch current chatbot configuration
 * @returns {Promise<Object>} Configuration object
 */
export async function fetchChatbotConfig() {
  try {
    console.log('🔧 Fetching chatbot configuration...');
    
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Configuration fetched successfully');
    
    return {
      success: true,
      config: data.config,
      timestamp: data.timestamp
    };

  } catch (error) {
    console.error('❌ Failed to fetch configuration:', error);
    
    return {
      success: false,
      error: error.message,
      config: null
    };
  }
}

/**
 * Update chatbot configuration
 * @param {Object} config - New configuration object
 * @returns {Promise<Object>} Update result
 */
export async function updateChatbotConfig(config) {
  try {
    console.log('🔧 Updating chatbot configuration...');
    
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Configuration updated successfully');
    
    return {
      success: true,
      message: data.message,
      timestamp: data.timestamp
    };

  } catch (error) {
    console.error('❌ Failed to update configuration:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}



/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  if (!config.systemPrompt) {
    errors.push('System prompt is required');
  } else if (typeof config.systemPrompt !== 'string') {
    errors.push('System prompt must be a string');
  } else if (config.systemPrompt.trim().length === 0) {
    errors.push('System prompt cannot be empty');
  }
  
  if (!config.modelParameters) {
    errors.push('Model parameters are required');
  }
  
  // Validate model parameters
  if (config.modelParameters) {
    const { temperature, topP, maxOutputTokens } = config.modelParameters;
    
    if (temperature !== undefined) {
      if (temperature < 0 || temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      } else if (temperature > 1.5) {
        warnings.push('High temperature may cause inconsistent responses');
      }
    }
    
    if (topP !== undefined && (topP < 0 || topP > 1)) {
      errors.push('Top P must be between 0 and 1');
    }
    
    if (maxOutputTokens !== undefined && maxOutputTokens < 1) {
      errors.push('Max output tokens must be at least 1');
    }
  }
  
  // Validate chat settings
  if (config.chatSettings) {
    const { conversationMemory, userHistory } = config.chatSettings;
    
    if (conversationMemory !== undefined) {
      if (conversationMemory < 1 || conversationMemory > 100) {
        errors.push('Conversation memory must be between 1 and 100');
      } else if (conversationMemory > 50) {
        warnings.push('High conversation memory may impact performance');
      }
    }
    
    if (userHistory !== undefined) {
      if (userHistory < 10 || userHistory > 1000) {
        errors.push('User history must be between 10 and 1000');
      } else if (userHistory > 500) {
        warnings.push('High user history limit may impact browser performance');
      }
    }
  }
  
  // Validate search settings
  if (config.searchSettings) {
    if (config.searchSettings.maxSearchResults && config.searchSettings.maxSearchResults > 20) {
      warnings.push('High number of search results may impact performance');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Cache configuration in localStorage
 * @param {Object} config - Configuration to cache
 */
export function cacheConfig(config) {
  try {
    localStorage.setItem('jega_chatbot_config', JSON.stringify({
      config,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.warn('⚠️ Failed to cache configuration:', error);
  }
}

/**
 * Get cached configuration
 * @returns {Object|null} Cached configuration or null
 */
export function getCachedConfig() {
  try {
    const cached = localStorage.getItem('jega_chatbot_config');
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is less than 1 hour old
      const cacheAge = Date.now() - new Date(data.timestamp).getTime();
      if (cacheAge < 60 * 60 * 1000) {
        return data.config;
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to get cached configuration:', error);
  }
  return null;
}

/**
 * Clear cached configuration
 */
export function clearCachedConfig() {
  try {
    localStorage.removeItem('jega_chatbot_config');
  } catch (error) {
    console.warn('⚠️ Failed to clear cached configuration:', error);
  }
} 