import React, { useState, useEffect } from 'react';
import { fetchChatbotConfig, updateChatbotConfig, getDefaultConfig, validateConfig } from '../utils/configManager';
import styles from './admin.module.css';

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
        <h1>🤖 Chatbot Configuration Admin</h1>
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
                  value={config.systemPrompt || ''}
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
                  {config.systemPrompt || 'Not set'}
                </div>
              </div>
            )}
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
                    value={config.modelParameters?.temperature || 0.5}
                    onChange={(e) => updateConfig('modelParameters', 'temperature', parseFloat(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.modelParameters?.temperature || 'Not set'}</span>
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
                    value={config.modelParameters?.topP || 0.9}
                    onChange={(e) => updateConfig('modelParameters', 'topP', parseFloat(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.modelParameters?.topP || 'Not set'}</span>
                )}
              </div>
              <div className={styles.parameter}>
                <label>Max Output Tokens:</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={config.modelParameters?.maxOutputTokens || 65535}
                    onChange={(e) => updateConfig('modelParameters', 'maxOutputTokens', parseInt(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.modelParameters?.maxOutputTokens || 'Not set'}</span>
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
                    value={config.chatSettings?.conversationMemory || 20}
                    onChange={(e) => updateConfig('chatSettings', 'conversationMemory', parseInt(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.chatSettings?.conversationMemory || 'Not set'}</span>
                )}
              </div>
              <div className={styles.parameter}>
                <label>User History:</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={config.chatSettings?.userHistory || 100}
                    onChange={(e) => updateConfig('chatSettings', 'userHistory', parseInt(e.target.value))}
                    className={styles.input}
                  />
                ) : (
                  <span>{config.chatSettings?.userHistory || 'Not set'}</span>
                )}
              </div>
            </div>
            <div className={styles.info}>
              <p><strong>Conversation Memory:</strong> Maximum number of messages sent to Vertex AI (affects performance and costs)</p>
              <p><strong>User History:</strong> Maximum number of messages stored in user's browser localStorage</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage; 