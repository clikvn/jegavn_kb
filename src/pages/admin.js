import React, { useState, useEffect } from 'react';
import { fetchChatbotConfig, updateChatbotConfig, validateConfig } from '../utils/configManager';
import styles from './admin.module.css';

// Predefined AI models list
const PREDEFINED_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

// Helper function to check if a model is in the predefined list (exact match only)
const isPredefinedModel = (model) => {
  return PREDEFINED_MODELS.includes(model);
};

// This function is still used to determine initial state when loading config

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [config, setConfig] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem('adminSession');
      if (sessionData) {
        try {
          const { isAuthenticated: sessionAuth, timestamp } = JSON.parse(sessionData);
          const sessionAge = Date.now() - timestamp;
          const sessionDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
          
          if (sessionAuth && sessionAge < sessionDuration) {
            setIsAuthenticated(true);
            return true;
          } else {
            // Session expired, clear it
            localStorage.removeItem('adminSession');
          }
        } catch (error) {
          // Invalid session data, clear it
          localStorage.removeItem('adminSession');
        }
      }
      return false;
    };

    const hasValidSession = checkSession();
    
    // Only load config if we have a valid session
    if (hasValidSession) {
      loadConfig();
      
      // Automatically open chat panel when admin page loads
      const openChatPanelWithRetry = () => {
        if (window.openChatPanel) {
          window.openChatPanel();
        } else {
          // Retry after a longer delay if function is not available yet
          setTimeout(() => {
            if (window.openChatPanel) {
              window.openChatPanel();
            }
          }, 1000);
        }
      };

      // Initial attempt with short delay
      setTimeout(openChatPanelWithRetry, 500);
    }
  }, []);

  // Update session when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      // Create session data
      const sessionData = {
        isAuthenticated: true,
        timestamp: Date.now()
      };
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
    } else {
      // Clear session when logged out
      localStorage.removeItem('adminSession');
    }
  }, [isAuthenticated]);

  // Only load config after authentication
  useEffect(() => {
    if (isAuthenticated && !config) {
      loadConfig();
      
      // Automatically open chat panel when admin page loads
      const openChatPanelWithRetry = () => {
        if (window.openChatPanel) {
          window.openChatPanel();
        } else {
          // Retry after a longer delay if function is not available yet
          setTimeout(() => {
            if (window.openChatPanel) {
              window.openChatPanel();
            }
          }, 1000);
        }
      };

      // Initial attempt with short delay
      setTimeout(openChatPanelWithRetry, 500);
    }
  }, [isAuthenticated, config]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchChatbotConfig();
      
      if (result.success) {
        setConfig(result.config);
        setLastUpdated(result.timestamp);
        // Set custom model state based on whether the loaded model is predefined
        setIsCustomModel(!isPredefinedModel(result.config.aiModel));
      } else {
        setError(result.error);
        setConfig(null); // Don't use default config, show error instead
      }
    } catch (err) {
      setError(err.message);
      setConfig(null); // Don't use default config, show error instead
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadConfig();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaveMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage('');
    // Reload original config
    loadConfig();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      // Validate configuration before saving
      const validation = validateConfig(config);
      if (!validation.isValid) {
        setSaveMessage(`Validation failed: ${validation.errors.join(', ')}`);
        setSaving(false);
        return;
      }

      const result = await updateChatbotConfig(config);
      
      if (result.success) {
        setSaveMessage('✅ Configuration saved successfully!');
        setIsEditing(false);
        setLastUpdated(result.timestamp);
      } else {
        setSaveMessage(`❌ Failed to save: ${result.error}`);
      }
    } catch (err) {
      setSaveMessage(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateSystemPrompt = (value) => {
    setConfig(prev => ({
      ...prev,
      systemPrompt: value
    }));
  };

  const updateAiModel = (value) => {
    setConfig(prev => ({
      ...prev,
      aiModel: value
    }));
  };

  // Password protection
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '@Clik123') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // If not authenticated, show password prompt
  if (!isAuthenticated) {
    return (
      <div className={styles.passwordContainer}>
        <div className={styles.passwordForm}>
          <h2>🔐 Admin Access Required</h2>
          <p>Please enter the admin password to continue.</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.passwordInput}
              autoFocus
            />
            {passwordError && (
              <div className={styles.passwordError}>{passwordError}</div>
            )}
            <button type="submit" className={styles.passwordButton}>
              🔓 Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🤖 Chatbot Configuration Admin</h1>
          <p className={styles.headerNote}>
            📖 <strong>Read-Only View</strong> - Configuration is managed in Bubble database. 
            Changes must be made in Bubble directly.
          </p>
        </div>
        <div className={styles.headerActions}>
          {!isEditing ? (
            <>
              <button 
                onClick={handleEdit} 
                className={styles.editButton}
                disabled={!config}
                title={!config ? "Cannot edit: No configuration available" : "Edit configuration"}
              >
                ✏️ Edit Configuration
              </button>
              <button onClick={handleRefresh} className={styles.refreshButton}>
                🔄 Refresh
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
                {saving ? '💾 Saving...' : '💾 Save Configuration'}
              </button>
              <button onClick={handleCancel} disabled={saving} className={styles.cancelButton}>
                ❌ Cancel
              </button>
              <button onClick={handleRefresh} className={styles.refreshButton}>
                🔄 Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <h3>⚠️ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {saveMessage && (
        <div className={`${styles.message} ${saveMessage.includes('✅') ? styles.success : styles.error}`}>
          <p>{saveMessage}</p>
        </div>
      )}

      {lastUpdated && (
        <div className={styles.info}>
          <p><strong>Last Updated:</strong> {new Date(lastUpdated).toLocaleString()}</p>
        </div>
      )}

      {!config && !loading && (
        <div className={styles.error}>
          <h3>❌ No Configuration Available</h3>
          <p>Unable to load configuration from Bubble database. Please check the error message above and try refreshing.</p>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            🔄 Try Again
          </button>
        </div>
      )}

      {config && (
        <div className={styles.configDisplay}>
          {/* System Prompt Section */}
          <div className={styles.section}>
            {isEditing ? (
              <div className={styles.subsection}>
                <h3>System Prompt</h3>
                <textarea
                  value={config.systemPrompt}
                  onChange={(e) => updateSystemPrompt(e.target.value)}
                  className={styles.promptTextarea}
                  placeholder="Enter the full system prompt..."
                  rows={20}
                />
              </div>
            ) : (
              <div className={styles.subsection}>
                <h3>System Prompt</h3>
                <div className={styles.promptDisplay}>
                  {config.systemPrompt || '❌ Missing from Bubble database'}
                </div>
              </div>
            )}
          </div>

          {/* AI Model Section */}
          <div className={styles.section}>
            <h3>AI Model</h3>
            <div className={styles.parameters}>
              <div className={styles.parameter}>
                <label>Model:</label>
                {isEditing ? (
                  <div className={styles.modelSelector}>
                    <select
                      value={isCustomModel ? 'custom' : config.aiModel}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomModel(true);
                          // Keep current value if it's already custom, otherwise clear it
                          if (isPredefinedModel(config.aiModel)) {
                            updateAiModel('');
                          }
                        } else {
                          // User selected a predefined model
                          setIsCustomModel(false);
                          updateAiModel(e.target.value);
                        }
                      }}
                      className={styles.aiModelSelect}
                    >
                      <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                      <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                      <option value="custom">Custom (enter below)</option>
                    </select>
                    {isCustomModel && (
                      <input
                        type="text"
                        value={config.aiModel}
                        onChange={(e) => updateAiModel(e.target.value)}
                        className={styles.aiModelInput}
                        placeholder="e.g., gemini-2.5-pro-vision, gemini-experimental..."
                        style={{ marginTop: '8px' }}
                      />
                    )}
                  </div>
                ) : (
                  <span>{config.aiModel || '❌ Missing from Bubble database'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Model Parameters Section */}
          <div className={styles.section}>
            <h3>Model Parameters</h3>
            <div className={styles.parameters}>
              <div className={styles.parameter}>
                <label>Temperature:</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={config.modelParameters?.temperature}
                    onChange={(e) => updateConfig('modelParameters', 'temperature', parseFloat(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.modelParameters?.temperature ?? '❌ Missing from Bubble database'}</span>
                )}
              </div>
              <div className={styles.parameter}>
                <label>Top P:</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={config.modelParameters?.topP}
                    onChange={(e) => updateConfig('modelParameters', 'topP', parseFloat(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.modelParameters?.topP ?? '❌ Missing from Bubble database'}</span>
                )}
              </div>
              <div className={styles.parameter}>
                <label>Max Output Tokens:</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={config.modelParameters?.maxOutputTokens}
                    onChange={(e) => updateConfig('modelParameters', 'maxOutputTokens', parseInt(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.modelParameters?.maxOutputTokens ?? '❌ Missing from Bubble database'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Chat Settings Section */}
          <div className={styles.section}>
            <h3>Chat Settings</h3>
            <div className={styles.parameters}>
              <div className={styles.parameter}>
                <label>Conversation Memory:</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.chatSettings?.conversationMemory}
                    onChange={(e) => updateConfig('chatSettings', 'conversationMemory', parseInt(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.chatSettings?.conversationMemory ?? '❌ Missing from Bubble database'}</span>
                )}
              </div>
              <div className={styles.parameter}>
                <label>User History:</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={config.chatSettings?.userHistory}
                    onChange={(e) => updateConfig('chatSettings', 'userHistory', parseInt(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.chatSettings?.userHistory ?? '❌ Missing from Bubble database'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage; 